import { useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/useAuth";
import { canAccess } from "./auth/access";
import { Shell } from "./components/Shell";
import { FirebaseWarehouseRepository } from "./data/firebaseRepository";
import { Account } from "./screens/Account";
import { Ajustes } from "./screens/Ajustes";
import { CuadroDeMando } from "./screens/CuadroDeMando";
import { Gastos } from "./screens/Gastos";
import { Incidencias } from "./screens/Incidencias";
import { Maquinaria } from "./screens/Maquinaria";
import { MyPanel } from "./screens/MyPanel";
import { Payslips } from "./screens/Payslips";
import { Recepcion } from "./screens/Recepcion";
import { Residuos } from "./screens/Residuos";
import { SignIn } from "./screens/SignIn";
import { Timesheet } from "./screens/Timesheet";

const today = new Date().toISOString().slice(0, 10);

export function App() {
  const repository = useMemo(() => new FirebaseWarehouseRepository(), []);

  return (
    <AuthProvider>
      <AppContent repository={repository} />
    </AuthProvider>
  );
}

function AppContent({
  repository,
}: {
  repository: FirebaseWarehouseRepository;
}) {
  const { user, member, role, loading, signOut } = useAuth();

  if (loading) {
    return <div className="empty-slot">Cargando sesión…</div>;
  }

  if (!user) {
    return <SignIn />;
  }

  if (!member || !role || member.status === "inactivo") {
    const reason =
      member?.status === "inactivo"
        ? "Tu cuenta está marcada como inactiva. Pedile al administrador que la reactive en Ajustes → Miembros."
        : `${user.email} no figura como miembro de la empresa. Pedile al administrador que te agregue en Ajustes → Miembros.`;
    return (
      <div className="signin">
        <div className="signin-card">
          <h1>Cuenta sin acceso</h1>
          <p className="sub">{reason}</p>
          <button type="button" className="btn" onClick={() => void signOut()}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <Shell freshness="Datos del turno · Firestore">
      <Routes>
        <Route path="/" element={<Navigate to="/me" replace />} />
        <Route path="/me" element={<MyPanel repository={repository} />} />
        <Route
          path="/timesheet"
          element={<Timesheet repository={repository} />}
        />
        <Route
          path="/payslips"
          element={<Payslips repository={repository} />}
        />
        <Route path="/account" element={<Account repository={repository} />} />
        <Route
          path="/reception"
          element={<Recepcion repository={repository} today={today} />}
        />
        <Route
          path="/dashboard"
          element={
            canAccess(role, "dashboard") ? (
              <CuadroDeMando repository={repository} today={today} />
            ) : (
              <Navigate to="/me" replace />
            )
          }
        />
        <Route
          path="/incidents"
          element={
            canAccess(role, "incidents") ? (
              <Incidencias repository={repository} today={today} />
            ) : (
              <Navigate to="/me" replace />
            )
          }
        />
        <Route
          path="/machinery"
          element={
            canAccess(role, "machinery") ? (
              <Maquinaria repository={repository} today={today} />
            ) : (
              <Navigate to="/me" replace />
            )
          }
        />
        <Route
          path="/waste"
          element={
            canAccess(role, "waste") ? (
              <Residuos repository={repository} today={today} />
            ) : (
              <Navigate to="/me" replace />
            )
          }
        />
        <Route
          path="/expenses"
          element={
            canAccess(role, "expenses") ? (
              <Gastos repository={repository} today={today} />
            ) : (
              <Navigate to="/me" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            canAccess(role, "settings") ? (
              <Ajustes repository={repository} />
            ) : (
              <Navigate to="/me" replace />
            )
          }
        />

        {/* Compatibilidad con las rutas antiguas en español. */}
        <Route path="/nominas" element={<Navigate to="/payslips" replace />} />
        <Route path="/fichaje" element={<Navigate to="/timesheet" replace />} />
        <Route path="/perfil" element={<Navigate to="/account" replace />} />
        <Route
          path="/cuadro-de-mando"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/incidencias"
          element={<Navigate to="/incidents" replace />}
        />
        <Route
          path="/maquinaria"
          element={<Navigate to="/machinery" replace />}
        />
        <Route path="/residuos" element={<Navigate to="/waste" replace />} />
        <Route path="/gastos" element={<Navigate to="/expenses" replace />} />
        <Route path="/ajustes" element={<Navigate to="/settings" replace />} />

        <Route path="*" element={<Navigate to="/me" replace />} />
      </Routes>
    </Shell>
  );
}
