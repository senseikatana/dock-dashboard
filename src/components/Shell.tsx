import { useState } from "react";
import { NavLink } from "react-router-dom";

const MODULES = [
  { to: "/cuadro-de-mando", label: "Cuadro de mando" },
  { to: "/", label: "Recepción" },
  { to: "/incidencias", label: "Incidencias y mermas" },
  { to: "/maquinaria", label: "Maquinaria" },
  { to: "/residuos", label: "Residuos" },
  { to: "/gastos", label: "Gastos generales" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="nav">
      {MODULES.map((module) => (
        <NavLink
          key={module.to}
          to={module.to}
          end
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? "on" : undefined)}
        >
          {module.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Shell({
  children,
  freshness,
}: {
  children: React.ReactNode;
  freshness: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="24"
              height="24"
              rx="5"
              fill="var(--text)"
            />
            <path
              d="M6 19 L10 7 L13 15 L16 9 L20 19"
              stroke="var(--accent)"
              strokeWidth="2.2"
              fill="none"
            />
          </svg>
          <div>
            <div className="brand-name">Panel OLA</div>
            <div className="brand-scope">Logística de obra · Nave 3</div>
          </div>
        </div>
        <NavLinks />
        <div className="spacer" />
        <div className="shift-card">
          <b>K. Ramírez</b>
          <span>Turno mañana · 06:00–14:00</span>
        </div>
        <button
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Cerrar" : "Menú"}
        </button>
      </aside>

      {menuOpen ? (
        <div className="menu-sheet">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
          <div className="shift-card">
            <b>K. Ramírez</b>
            <span>Turno mañana · 06:00–14:00</span>
          </div>
          <input
            className="search"
            type="search"
            placeholder="Buscar albarán, proveedor o ubicación"
            aria-label="Buscar albarán, proveedor o ubicación"
          />
          <div className="freshness">{freshness}</div>
        </div>
      ) : null}

      <div className="main">
        <header className="topbar">
          <input
            className="search"
            type="search"
            placeholder="Buscar albarán, proveedor o ubicación"
            aria-label="Buscar albarán, proveedor o ubicación"
          />
          <div className="freshness">{freshness}</div>
        </header>
        <main className="sheet">{children}</main>
      </div>
    </div>
  );
}
