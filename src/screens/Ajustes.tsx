import { useEffect, useState } from "react";

import { useAuth } from "../auth/useAuth";
import { provisionMember } from "../data/authProvisioner";
import { uploadAvatar } from "../data/avatarStorage";
import { PayslipsAdmin } from "../components/PayslipsAdmin";
import { confirmDestructive, toastSuccess } from "../ui/dialogs";
import type { WarehouseRepository } from "../data/repository";
import type {
  Member,
  MemberDepartment,
  MemberRole,
  MemberStatus,
} from "../domain/members";
import {
  MEMBER_DEPARTMENT_COPY,
  MEMBER_ROLE_COPY,
  MEMBER_STATUS_COPY,
} from "../domain/members";

interface ProvisionedAccess {
  email: string;
  password: string;
}

export function Ajustes({ repository }: { repository: WarehouseRepository }) {
  const { member: currentMember } = useAuth();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [tab, setTab] = useState<"members" | "payslips">("members");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [provisioned, setProvisioned] = useState<ProvisionedAccess | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setMembers(await repository.loadMembers());
  }

  useEffect(() => {
    let cancelled = false;
    repository.loadMembers().then((data) => {
      if (!cancelled) setMembers(data);
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  if (!members) {
    return <div className="empty-slot">Cargando ajustes…</div>;
  }

  const active = members.filter((member) => member.status === "activo").length;

  function startCreate() {
    setEditing(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(member: Member) {
    setEditing(member);
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setEditing(null);
    setShowForm(false);
  }

  async function save(member: Member, avatarFile: File | null) {
    setError(null);
    try {
      const next = avatarFile
        ? { ...member, avatarUrl: await uploadAvatar(member.id, avatarFile) }
        : member;
      if (editing) {
        await repository.updateMember(editing.id, next);
      } else {
        await repository.addMember(next);
      }
      await refresh();
      closeForm();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el miembro.",
      );
    }
  }

  async function remove(memberId: string) {
    const confirmed = await confirmDestructive({
      title: "Eliminar miembro",
      text: `Se eliminará el miembro ${memberId}. Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
    });
    if (!confirmed) return;
    await repository.deleteMember(memberId);
    await refresh();
    toastSuccess("Miembro eliminado");
  }

  async function provision(member: Member) {
    setError(null);
    setBusyId(member.id);
    try {
      const access = await provisionMember({
        memberId: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
      });
      setProvisioned({ email: access.email, password: access.password });
      await refresh();
    } catch (provisionError) {
      setError(
        provisionError instanceof Error
          ? provisionError.message
          : "No se pudo crear el acceso.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Ajustes</h1>
          <p className="sub">
            Miembros y nóminas · {active} activos de {members.length}{" "}
            registrados.
          </p>
        </div>
        {tab === "members" ? (
          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={showForm && !editing ? closeForm : startCreate}
            >
              {showForm && !editing ? "Cerrar formulario" : "Añadir miembro"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="tabs settings-tabs" role="tablist" aria-label="Ajustes">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "members"}
          className={tab === "members" ? "tab on" : "tab"}
          onClick={() => setTab("members")}
        >
          Miembros
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "payslips"}
          className={tab === "payslips" ? "tab on" : "tab"}
          onClick={() => setTab("payslips")}
        >
          Nóminas
        </button>
      </div>

      {tab === "members" ? (
        <>
          {error ? <div className="signin-error">{error}</div> : null}

          {provisioned ? (
            <div className="provision-box">
              <div>
                <b>Acceso creado para {provisioned.email}</b>
                <p>
                  Contraseña temporal: <code>{provisioned.password}</code>
                </p>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() =>
                    void navigator.clipboard.writeText(provisioned.password)
                  }
                >
                  Copiar
                </button>
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => setProvisioned(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : null}

          {showForm ? (
            <MemberForm
              key={editing?.id ?? "new"}
              initial={editing}
              onSubmit={save}
            />
          ) : null}

          {members.length === 0 ? (
            <div className="empty-slot">
              Sin miembros registrados. Añadí el primero para empezar.
            </div>
          ) : (
            <table className="albaranes">
              <thead>
                <tr>
                  <th>Miembro</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Departamento</th>
                  <th>Estado</th>
                  <th>Acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="col-identity">
                      <span className="member-cell">
                        <Avatar member={member} />
                        {member.name}
                      </span>
                    </td>
                    <td className="muted">{member.email}</td>
                    <td>{MEMBER_ROLE_COPY[member.role]}</td>
                    <td>{MEMBER_DEPARTMENT_COPY[member.department]}</td>
                    <td>
                      <span
                        className={
                          member.status === "activo"
                            ? "pill pill-ok"
                            : "pill pill-pendiente"
                        }
                      >
                        {MEMBER_STATUS_COPY[member.status]}
                      </span>
                    </td>
                    <td>
                      {member.uid ? (
                        <span className="pill pill-ok">Con acceso</span>
                      ) : (
                        <span className="pill pill-pendiente">Sin acceso</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {member.uid ? null : (
                          <button
                            type="button"
                            className="btn btn-small"
                            disabled={busyId === member.id}
                            onClick={() => provision(member)}
                          >
                            {busyId === member.id ? "Creando…" : "Crear acceso"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => startEdit(member)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          disabled={currentMember?.id === member.id}
                          title={
                            currentMember?.id === member.id
                              ? "No podés eliminar tu propio usuario"
                              : undefined
                          }
                          onClick={() => remove(member.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="table-foot">
            <span>{`${members.length} miembros · acceso al panel`}</span>
            <span className="num">
              Cambiar rol: resincronizar claims y volver a iniciar sesión
            </span>
          </div>
        </>
      ) : (
        <PayslipsAdmin repository={repository} members={members} />
      )}
    </>
  );
}

function Avatar({ member }: { member: Member }) {
  if (member.avatarUrl) {
    return (
      <img
        className="avatar"
        src={member.avatarUrl}
        alt=""
        width={28}
        height={28}
      />
    );
  }
  const initials = member.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return <span className="avatar avatar-fallback">{initials}</span>;
}

function MemberForm({
  initial,
  onSubmit,
}: {
  initial: Member | null;
  onSubmit: (member: Member, avatarFile: File | null) => void;
}) {
  const isEdit = initial !== null;
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  return (
    <form
      className="reception-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit(
          {
            id: initial ? initial.id : String(form.get("id")),
            name: String(form.get("name")),
            email: String(form.get("email")),
            role: String(form.get("role")) as MemberRole,
            department: String(form.get("department")) as MemberDepartment,
            status: String(form.get("status")) as MemberStatus,
          },
          avatarFile,
        );
      }}
    >
      <div className="form-grid">
        <label>
          Identificador
          <input
            name="id"
            required
            readOnly={isEdit}
            defaultValue={initial?.id ?? ""}
            placeholder="MI-05"
          />
        </label>
        <label>
          Nombre
          <input
            name="name"
            required
            defaultValue={initial?.name ?? ""}
            placeholder="Sergio Álvarez"
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            spellCheck={false}
            defaultValue={initial?.email ?? ""}
            placeholder="sergio@empresa.es"
          />
        </label>
        <label>
          Rol
          <select name="role" defaultValue={initial?.role ?? "operario"}>
            {Object.entries(MEMBER_ROLE_COPY).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Departamento
          <select
            name="department"
            defaultValue={initial?.department ?? "almacen"}
          >
            {Object.entries(MEMBER_DEPARTMENT_COPY).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select name="status" defaultValue={initial?.status ?? "activo"}>
            {Object.entries(MEMBER_STATUS_COPY).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Avatar (máx. 5 MB)
          <input
            name="avatar"
            type="file"
            accept="image/*"
            onChange={(event) =>
              setAvatarFile(event.currentTarget.files?.[0] ?? null)
            }
          />
          {initial?.avatarUrl ? (
            <span className="muted">
              Ya tiene avatar; subí uno nuevo para reemplazarlo.
            </span>
          ) : null}
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {isEdit ? "Guardar cambios" : "Guardar miembro"}
        </button>
      </div>
    </form>
  );
}
