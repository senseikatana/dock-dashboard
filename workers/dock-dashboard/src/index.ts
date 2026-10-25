import { importPKCS8, SignJWT } from "jose";

interface Env {
  ASSETS: Fetcher;
  AVATARS: R2Bucket;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY: string;
  ALLOWED_ORIGINS: string;
  FIREBASE_SERVICE_ACCOUNT: string;
  // Secreto de instalación: obligatorio solo mientras el panel no tenga
  // ningún miembro. Evita que el primer registro público se quede el admin.
  BOOTSTRAP_TOKEN?: string;
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

interface ProvisionBody {
  memberId: string;
  email: string;
  name: string;
  role: "admin" | "responsable" | "operario";
}

interface MemberRecord {
  email: string;
  uid: string | null;
}

const PREFIX = "/apps/dock-dashboard";
const API_MEMBERS = `${PREFIX}/api/members`;
const API_SIGNUP = `${PREFIX}/api/signup`;
const API_SESSION = `${PREFIX}/api/session`;
const API_AVATARS = `${PREFIX}/api/avatars`;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
// Margen para las cabeceras multipart antes de leer el cuerpo.
const MAX_UPLOAD_BYTES = MAX_AVATAR_BYTES + 8 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MEMBER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

let tokenCache: { token: string; expiresAt: number } | null = null;

function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = env.ALLOWED_ORIGINS.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };
  // Sin origen permitido no se emite la cabecera: el navegador bloquea.
  if (allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split(".")[1];
  if (!part) throw new Error("Invalid token");
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function serviceAccountToken(env: Env): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
  const key = await importPKCS8(account.private_key, "RS256");
  const assertion = await new SignJWT({
    scope:
      "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(account.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(`Service account token failed: ${data.error ?? "unknown"}`);
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

async function verifyCaller(
  request: Request,
  env: Env,
): Promise<{ uid: string; email: string; role: string } | null> {
  const header = request.headers.get("Authorization") ?? "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken) return null;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  const data = (await response.json()) as {
    users?: Array<{ localId: string; email?: string }>;
  };
  const user = data.users?.[0];
  if (!response.ok || !user) return null;

  let payload: Record<string, unknown>;
  try {
    payload = decodeJwtPayload(idToken);
  } catch {
    return null;
  }
  return {
    uid: user.localId,
    email: user.email ?? "",
    role: typeof payload.role === "string" ? payload.role : "",
  };
}

async function getMember(
  env: Env,
  accessToken: string,
  memberId: string,
): Promise<MemberRecord | null> {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/members/${encodeURIComponent(memberId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as {
    fields?: {
      email?: { stringValue?: string };
      uid?: { stringValue?: string };
    };
  };
  const email = data.fields?.email?.stringValue;
  if (!email) return null;
  return { email, uid: data.fields?.uid?.stringValue ?? null };
}

async function patchMember(
  env: Env,
  accessToken: string,
  memberId: string,
  fields: Record<string, string>,
): Promise<void> {
  const params = new URLSearchParams();
  for (const field of Object.keys(fields)) {
    params.append("updateMask.fieldPaths", field);
  }
  const body = {
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [
        key,
        { stringValue: value },
      ]),
    ),
  };
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/members/${encodeURIComponent(memberId)}?${params}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error("No se pudo actualizar el miembro en Firestore");
  }
}

async function createAuthUser(
  env: Env,
  accessToken: string,
  email: string,
  name: string,
  password: string,
): Promise<string> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/accounts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        password,
        displayName: name,
        emailVerified: false,
      }),
    },
  );
  const data = (await response.json()) as {
    localId?: string;
    error?: { message?: string };
  };
  if (!response.ok || !data.localId) {
    const code = data.error?.message ?? "UNKNOWN";
    if (code.includes("EMAIL_EXISTS")) {
      throw new Error("EMAIL_EXISTS");
    }
    throw new Error(`No se pudo crear la cuenta: ${code}`);
  }
  return data.localId;
}

// Rollback si el alta inicial pierde la carrera: el usuario se creó sin
// claim, así que borrarlo no deja privilegios colgando.
async function deleteAuthUser(
  env: Env,
  accessToken: string,
  uid: string,
): Promise<void> {
  await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/accounts:delete`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ localId: uid }),
    },
  );
}

async function setRoleClaim(
  env: Env,
  accessToken: string,
  uid: string,
  role: string,
): Promise<void> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/accounts:update`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        localId: uid,
        customAttributes: JSON.stringify({ role }),
      }),
    },
  );
  if (!response.ok) {
    throw new Error("No se pudo asignar el rol a la cuenta");
  }
}

function generatePassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const random = btoa(String.fromCharCode(...bytes))
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12);
  return `Pola-${random}9!`;
}

async function handleProvision(request: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(request, env);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return json({ error: "Método no permitido" }, 405, cors);
  }

  try {
    const caller = await verifyCaller(request, env);
    if (!caller) {
      return json({ error: "Sesión inválida" }, 401, cors);
    }
    if (caller.role !== "admin") {
      return json({ error: "Solo un admin puede crear accesos" }, 403, cors);
    }

    const body = (await request.json()) as ProvisionBody;
    if (
      !body.memberId ||
      !body.email ||
      !["admin", "responsable", "operario"].includes(body.role)
    ) {
      return json({ error: "Datos incompletos" }, 400, cors);
    }

    const accessToken = await serviceAccountToken(env);
    const member = await getMember(env, accessToken, body.memberId);
    if (!member) {
      return json({ error: "Miembro no encontrado" }, 404, cors);
    }
    if (member.email.toLowerCase() !== body.email.toLowerCase()) {
      return json({ error: "El email no coincide con el miembro" }, 409, cors);
    }

    const password = generatePassword();
    const uid = await createAuthUser(
      env,
      accessToken,
      body.email,
      body.name,
      password,
    );
    await setRoleClaim(env, accessToken, uid, body.role);
    await patchMember(env, accessToken, body.memberId, { uid });

    return json({ uid, email: body.email.toLowerCase(), password }, 201, cors);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    if (message === "EMAIL_EXISTS") {
      return json({ error: "Ya existe una cuenta con ese email" }, 409, cors);
    }
    return json({ error: message }, 500, cors);
  }
}

interface MemberMatch {
  id: string;
  email: string;
  role: string;
  uid: string | null;
}

async function queryMemberByEmail(
  env: Env,
  accessToken: string,
  email: string,
): Promise<MemberMatch | null> {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "members" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "email" },
              op: "EQUAL",
              value: { stringValue: email.toLowerCase() },
            },
          },
          limit: 1,
        },
      }),
    },
  );
  if (!response.ok) {
    throw new Error("No se pudo verificar el email");
  }
  const rows = (await response.json()) as Array<{
    document?: {
      name?: string;
      fields?: {
        email?: { stringValue?: string };
        role?: { stringValue?: string };
        uid?: { stringValue?: string };
      };
    };
  }>;
  const document = rows.find((row) => row.document)?.document;
  if (!document?.name) return null;
  return {
    id: document.name.split("/").pop() ?? "",
    email: document.fields?.email?.stringValue ?? "",
    role: document.fields?.role?.stringValue ?? "",
    uid: document.fields?.uid?.stringValue ?? null,
  };
}

async function findMemberByEmail(
  env: Env,
  accessToken: string,
  email: string,
): Promise<boolean> {
  return (await queryMemberByEmail(env, accessToken, email)) !== null;
}

async function createMemberDoc(
  env: Env,
  accessToken: string,
  uid: string,
  name: string,
  email: string,
  role: string,
): Promise<void> {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/members/${encodeURIComponent(uid)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          id: { stringValue: `USR-${uid.slice(0, 6).toUpperCase()}` },
          name: { stringValue: name },
          email: { stringValue: email.toLowerCase() },
          role: { stringValue: role },
          department: { stringValue: "almacen" },
          status: { stringValue: "activo" },
          uid: { stringValue: uid },
        },
      }),
    },
  );
  if (!response.ok) {
    throw new Error("No se pudo crear el perfil del miembro");
  }
}

async function hasAnyMember(env: Env, accessToken: string): Promise<boolean> {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/members?pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    throw new Error("No se pudo verificar el estado del panel");
  }
  const data = (await response.json()) as { documents?: unknown[] };
  return (data.documents?.length ?? 0) > 0;
}

// Reserva atómica del alta inicial. La precondición `exists: false` hace que
// solo un request pueda ganar aunque lleguen en paralelo; sin esto, dos
// signups concurrentes leen "panel vacío" y los dos quedan como admin.
async function claimBootstrap(
  env: Env,
  accessToken: string,
  uid: string,
): Promise<boolean> {
  const documentName = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/config/bootstrap`;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: documentName,
              fields: { claimedBy: { stringValue: uid } },
            },
            currentDocument: { exists: false },
          },
        ],
      }),
    },
  );
  // 400/409/412 = la precondición no se cumplió: otro request ya reservó.
  if ([400, 409, 412].includes(response.status)) return false;
  if (!response.ok) {
    throw new Error("No se pudo reservar el alta inicial del panel");
  }
  return true;
}

async function handleSignup(request: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(request, env);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return json({ error: "Método no permitido" }, 405, cors);
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      bootstrapToken?: string;
    };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (name.length < 2) {
      return json({ error: "Indicá tu nombre completo." }, 400, cors);
    }
    if (!email.includes("@") || email.length < 5) {
      return json({ error: "El email no es válido." }, 400, cors);
    }
    if (password.length < 6) {
      return json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        400,
        cors,
      );
    }

    const accessToken = await serviceAccountToken(env);

    if (await findMemberByEmail(env, accessToken, email)) {
      return json(
        { error: "Ese email ya está registrado. Iniciá sesión." },
        409,
        cors,
      );
    }

    const isFirstMember = !(await hasAnyMember(env, accessToken));

    // Panel virgen: exige el código de instalación. Sin esto, cualquiera que
    // llegue primero se queda con el admin.
    if (isFirstMember) {
      if (!env.BOOTSTRAP_TOKEN) {
        return json(
          {
            error:
              "El panel todavía no tiene administrador. Configurá BOOTSTRAP_TOKEN en el Worker y volvé a intentar.",
            code: "bootstrap_unconfigured",
          },
          503,
          cors,
        );
      }
      if (body.bootstrapToken !== env.BOOTSTRAP_TOKEN) {
        return json(
          {
            error: "Esta instalación pide el código de instalación.",
            code: "bootstrap_required",
          },
          403,
          cors,
        );
      }
    }

    let uid: string;
    try {
      uid = await createAuthUser(env, accessToken, email, name, password);
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_EXISTS") {
        return json(
          { error: "Ese email ya está registrado. Iniciá sesión." },
          409,
          cors,
        );
      }
      throw error;
    }

    let role = "operario";
    if (isFirstMember) {
      const claimed = await claimBootstrap(env, accessToken, uid);
      if (!claimed) {
        await deleteAuthUser(env, accessToken, uid);
        return json(
          {
            error:
              "Otra alta inicial ya reservó el panel. Pedile acceso al administrador.",
            code: "bootstrap_conflict",
          },
          409,
          cors,
        );
      }
      role = "admin";
    }

    await setRoleClaim(env, accessToken, uid, role);
    await createMemberDoc(env, accessToken, uid, name, email, role);

    return json({ uid, email, role }, 201, cors);
  } catch (error) {
    console.error("signup failed", error);
    return json({ error: "No se pudo crear la cuenta." }, 500, cors);
  }
}

async function handleAvatarUpload(
  request: Request,
  env: Env,
): Promise<Response> {
  const cors = corsHeaders(request, env);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return json({ error: "Método no permitido" }, 405, cors);
  }

  try {
    const caller = await verifyCaller(request, env);
    if (!caller) {
      return json({ error: "Sesión inválida" }, 401, cors);
    }

    // Rechazamos antes de bufferizar: formData() materializa el cuerpo entero
    // en memoria y el límite de 5 MB se chequeaba demasiado tarde.
    const declared = Number(request.headers.get("Content-Length") ?? "0");
    if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
      return json({ error: "El avatar supera los 5 MB" }, 413, cors);
    }

    const form = await request.formData();
    const memberId = String(form.get("memberId") ?? "");
    const file = form.get("file");
    if (!MEMBER_ID_PATTERN.test(memberId) || !(file instanceof File)) {
      return json({ error: "Faltan memberId o file" }, 400, cors);
    }
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      return json(
        { error: "El avatar tiene que ser PNG, JPG o WebP." },
        415,
        cors,
      );
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return json({ error: "El avatar supera los 5 MB" }, 413, cors);
    }

    // Allowlist explícito: un token sin rol no debe saltear el control de
    // propiedad (antes, `role === "operario"` dejaba pasar el caso "").
    const canManageOthers =
      caller.role === "admin" || caller.role === "responsable";
    if (!canManageOthers) {
      const accessToken = await serviceAccountToken(env);
      const member = await getMember(env, accessToken, memberId);
      if (!member || member.uid !== caller.uid) {
        return json(
          { error: "Solo podés cambiar tu propio avatar" },
          403,
          cors,
        );
      }
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const key = `avatars/${memberId}/${crypto.randomUUID()}-${safeName}`;
    await env.AVATARS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { memberId },
    });

    return json(
      {
        url: new URL(
          `${API_AVATARS}/${encodeURIComponent(key)}`,
          request.url,
        ).toString(),
      },
      201,
      cors,
    );
  } catch (error) {
    console.error("avatar upload failed", error);
    return json({ error: "No se pudo subir el avatar." }, 500, cors);
  }
}

async function handleAvatarRead(
  request: Request,
  env: Env,
  key: string,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  const object = await env.AVATARS.get(decodeURIComponent(key));
  if (!object) {
    return new Response("Not found", { status: 404 });
  }
  const headers = new Headers();
  // El content-type guardado no se copia a ciegas: solo se sirven tipos
  // raster de la allowlist y siempre con nosniff + CSP sandbox.
  const storedType = object.httpMetadata?.contentType ?? "";
  headers.set(
    "Content-Type",
    ALLOWED_AVATAR_TYPES.has(storedType)
      ? storedType
      : "application/octet-stream",
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  headers.set("Content-Disposition", 'inline; filename="avatar"');
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(request.method === "HEAD" ? null : object.body, {
    headers,
  });
}

/**
 * Enlaza una cuenta creada por Google/GitHub con su ficha de `members` y le
 * pinta el claim `role`.
 *
 * Sin esto el SSO no sirve para nada: las reglas de Firestore exigen un token
 * provisionado, y el claim solo lo pinta el Admin SDK. Un signup de
 * email/password lo recibe en `/api/signup`, pero el popup de un proveedor
 * pasa por delante de nosotros.
 */
async function handleSession(request: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(request, env);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return json({ error: "Método no permitido" }, 405, cors);
  }

  try {
    const caller = await verifyCaller(request, env);
    if (!caller) {
      return json({ error: "Sesión inválida" }, 401, cors);
    }

    // Ya estaba enlazado: idempotente, no hace nada.
    if (["admin", "responsable", "operario"].includes(caller.role)) {
      return json({ role: caller.role }, 200, cors);
    }

    if (!caller.email) {
      return json(
        { error: "La cuenta del proveedor no expone un email." },
        409,
        cors,
      );
    }

    const accessToken = await serviceAccountToken(env);
    const member = await queryMemberByEmail(env, accessToken, caller.email);
    if (!member) {
      return json(
        {
          error: "Ese email no figura como miembro del panel.",
          code: "not_member",
        },
        404,
        cors,
      );
    }
    if (!["admin", "responsable", "operario"].includes(member.role)) {
      return json(
        { error: "La ficha de miembro no tiene un rol válido." },
        409,
        cors,
      );
    }

    await setRoleClaim(env, accessToken, caller.uid, member.role);
    await patchMember(env, accessToken, member.id, { uid: caller.uid });

    return json({ role: member.role, memberId: member.id }, 200, cors);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return json({ error: message }, 500, cors);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === API_MEMBERS) {
      return handleProvision(request, env);
    }

    if (url.pathname === API_SIGNUP) {
      return handleSignup(request, env);
    }

    if (url.pathname === API_SESSION) {
      return handleSession(request, env);
    }

    if (url.pathname === API_AVATARS) {
      return handleAvatarUpload(request, env);
    }

    if (url.pathname.startsWith(`${API_AVATARS}/`)) {
      return handleAvatarRead(
        request,
        env,
        url.pathname.slice(API_AVATARS.length + 1),
      );
    }

    if (url.pathname === PREFIX) {
      return Response.redirect(`${url.origin}${PREFIX}/`, 301);
    }

    if (!url.pathname.startsWith(`${PREFIX}/`)) {
      return new Response("Not found", { status: 404 });
    }

    const assetPath = url.pathname.slice(PREFIX.length) || "/";
    const assetUrl = new URL(`${assetPath}${url.search}`, url.origin);
    return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
  },
};
