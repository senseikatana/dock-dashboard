import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { routesForRole } from "../auth/access";
import type { AppRoute } from "../auth/access";
import { applyTheme, readTheme, type ThemeMode } from "../ui/theme";

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Auto",
};

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={open ? "chevron open" : "chevron"}
    >
      <path
        d="M4 10l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 3H3.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1H6M10 11l3-3-3-3M13 8H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PERSONAL_KEYS = ["me", "timesheet", "payslips", "account"];

function AccountMenu({
  onNavigate,
  theme,
  onThemeChange,
  defaultOpen = false,
}: {
  onNavigate?: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  defaultOpen?: boolean;
}) {
  const { member, role, signOut } = useAuth();
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  if (!member || !role) return null;

  const initials = member.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const routes = routesForRole(role);
  const personal = routes.filter((route) => PERSONAL_KEYS.includes(route.key));
  const operations = routes.filter(
    (route) => !PERSONAL_KEYS.includes(route.key) && route.key !== "settings",
  );
  const admin = routes.filter((route) => route.key === "settings");

  function close() {
    setOpen(false);
    onNavigate?.();
  }

  function link(route: AppRoute) {
    return (
      <NavLink
        key={route.path}
        to={route.path}
        end
        role="menuitem"
        className="account-item"
        onClick={close}
      >
        <span className="account-item-short" aria-hidden="true">
          {route.short}
        </span>
        {route.label}
      </NavLink>
    );
  }

  const avatar = member.avatarUrl ? (
    <img className="avatar" src={member.avatarUrl} alt="" />
  ) : (
    <span className="avatar avatar-fallback">{initials}</span>
  );

  return (
    <div className="account-menu" ref={rootRef}>
      {open ? (
        <div
          className={
            defaultOpen ? "account-dropdown static" : "account-dropdown"
          }
          role="menu"
        >
          {defaultOpen ? null : (
            <div className="account-dropdown-head">
              {avatar}
              <div>
                <b>{member.name}</b>
                <span>{member.email}</span>
              </div>
            </div>
          )}

          <div className="account-scroll">
            <div className="account-section-label">Personal</div>
            {personal.map(link)}

            {operations.length > 0 ? (
              <>
                <div className="account-section-label">Operaciones</div>
                {operations.map(link)}
              </>
            ) : null}

            {admin.length > 0 ? (
              <>
                <div className="account-section-label">Administración</div>
                {admin.map(link)}
              </>
            ) : null}
          </div>

          <div className="account-theme">
            <span className="account-section-label">Tema</span>
            <div className="theme-switch" role="group" aria-label="Tema">
              {(Object.keys(THEME_LABELS) as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={
                    theme === mode ? "theme-option on" : "theme-option"
                  }
                  aria-pressed={theme === mode}
                  onClick={() => onThemeChange(mode)}
                >
                  {THEME_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>

          <div className="account-divider" />
          <button
            type="button"
            role="menuitem"
            className="account-signout"
            onClick={() => {
              close();
              void signOut();
            }}
          >
            <IconLogout />
            Cerrar sesión
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="account-avatar">
          {avatar}
          <span className="avatar-status" aria-hidden="true" />
        </span>
        <span className="account-trigger-text">
          <b>{member.name}</b>
          <span>{member.email}</span>
        </span>
        <span className="account-chevron">
          <IconChevron open={open} />
        </span>
      </button>
    </div>
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("dock:rail-collapsed") === "1";
  });
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  useEffect(() => {
    window.localStorage.setItem("dock:rail-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => applyTheme(theme), [theme]);

  return (
    <div className={`app${collapsed ? " collapsed" : ""}`}>
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
            <div className="brand-name">Dock Dashboard</div>
            <div className="brand-scope">Recepción y operaciones · Nave 3</div>
          </div>
        </div>

        <button
          type="button"
          className="rail-toggle"
          aria-label={collapsed ? "Desplegar menú" : "Plegar menú"}
          aria-expanded={!collapsed}
          title={collapsed ? "Desplegar menú" : "Plegar menú"}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? "»" : "«"}
        </button>

        <div className="spacer" />
        <AccountMenu theme={theme} onThemeChange={setTheme} />
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
          <AccountMenu
            defaultOpen
            onNavigate={() => setMenuOpen(false)}
            theme={theme}
            onThemeChange={setTheme}
          />
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

      <nav className="bottom-nav" aria-label="Accesos personales">
        <NavLink
          to="/me"
          end
          className={({ isActive }) => (isActive ? "on" : undefined)}
        >
          Mi panel
        </NavLink>
        <NavLink
          to="/timesheet"
          className={({ isActive }) => (isActive ? "on" : undefined)}
        >
          Fichaje
        </NavLink>
        <NavLink
          to="/payslips"
          className={({ isActive }) => (isActive ? "on" : undefined)}
        >
          Nóminas
        </NavLink>
        <NavLink
          to="/account"
          className={({ isActive }) => (isActive ? "on" : undefined)}
        >
          Cuenta
        </NavLink>
      </nav>
    </div>
  );
}
