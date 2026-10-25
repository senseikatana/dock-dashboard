import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { routesForRole } from "../auth/access";
import type { AppRoute, AppRouteKey } from "../auth/access";
import site from "../content/site.json";
import type { WarehouseRepository } from "../data/repository";
import { checkNote } from "../domain/reception";
import { applyTheme, readTheme, type ThemeMode } from "../ui/theme";

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Auto",
};

interface NavCounts {
  pending: number;
  incidents: number;
  payslips: number;
}

const EMPTY_COUNTS: NavCounts = { pending: 0, incidents: 0, payslips: 0 };

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

function RouteIcon({ routeKey }: { routeKey: AppRouteKey }) {
  const common = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    className: "size-5 opacity-75",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
  } as const;

  switch (routeKey) {
    case "me":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955a1.125 1.125 0 011.591 0l8.955 8.955M4.5 9.75V19.5h5.25v-5.25h4.5v5.25h5.25V9.75"
          />
        </svg>
      );
    case "timesheet":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "payslips":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    case "account":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 19V9m6 10V5m6 14v-7m6 7H2"
          />
        </svg>
      );
    case "reception":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"
          />
        </svg>
      );
    case "incidents":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
          />
        </svg>
      );
    case "machinery":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.7 6.3a4 4 0 01-5.4 5.4l-5 5a2 2 0 102.8 2.8l5-5a4 4 0 015.4-5.4l-2.3 2.3-1.4-1.4 2.3-2.3z"
          />
        </svg>
      );
    case "waste":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5"
          />
        </svg>
      );
    case "expenses":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
  }
}

function NavGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text)] motion-reduce:transition-none">
        <span>{label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-5 shrink-0 transition-transform duration-300 group-open:-rotate-180 motion-reduce:transition-none"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <ul className="mt-1 space-y-1 px-2">{children}</ul>
    </details>
  );
}

const PERSONAL_KEYS = ["me", "timesheet", "payslips", "account"];

function AccountMenu({
  onNavigate,
  theme,
  onThemeChange,
  counts,
  defaultOpen = false,
}: {
  onNavigate?: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  counts: NavCounts;
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
  const primary = personal.filter((route) => route.key === "me");
  const personalRest = personal.filter((route) => route.key !== "me");
  const operations = routes.filter(
    (route) => !PERSONAL_KEYS.includes(route.key) && route.key !== "settings",
  );
  const admin = routes.filter((route) => route.key === "settings");

  function close() {
    setOpen(false);
    onNavigate?.();
  }

  function link(route: AppRoute) {
    const badge =
      route.key === "reception"
        ? counts.pending
        : route.key === "incidents"
          ? counts.incidents
          : route.key === "payslips"
            ? counts.payslips
            : null;

    return (
      <NavLink
        key={route.path}
        to={route.path}
        end
        onClick={close}
        className={({ isActive }) =>
          `group flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isActive
              ? "bg-[var(--raised)] text-[var(--text)]"
              : "text-[var(--muted)] hover:bg-[var(--raised)] hover:text-[var(--text)]"
          }`
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <RouteIcon routeKey={route.key} />
          <span className="truncate">{route.label}</span>
        </span>
        {badge !== null && badge > 0 ? (
          <span className="shrink-0 rounded-full bg-[var(--raised)] px-3 py-0.5 text-xs text-[var(--muted)] group-hover:bg-[var(--ground-deep)] group-hover:text-[var(--text)]">
            {badge}
          </span>
        ) : null}
      </NavLink>
    );
  }

  const avatar = member.avatarUrl ? (
    <img
      className="avatar"
      src={member.avatarUrl}
      alt=""
      width={28}
      height={28}
    />
  ) : (
    <span className="avatar avatar-fallback">{initials}</span>
  );

  return (
    <div className="account-menu" ref={rootRef}>
      {open ? (
        <nav
          className={
            defaultOpen ? "account-dropdown static" : "account-dropdown"
          }
          aria-label="Menú de cuenta"
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

          <div className="account-scroll space-y-1">
            {primary.map(link)}

            <NavGroup label="Personal">{personalRest.map(link)}</NavGroup>

            {operations.length > 0 ? (
              <NavGroup label="Operaciones">{operations.map(link)}</NavGroup>
            ) : null}

            {admin.length > 0 ? (
              <NavGroup label="Administración">{admin.map(link)}</NavGroup>
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
            className="account-signout"
            onClick={() => {
              close();
              void signOut();
            }}
          >
            <IconLogout />
            Cerrar sesión
          </button>
        </nav>
      ) : null}

      <button
        type="button"
        className="account-trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="account-avatar">
          {avatar}
          <span
            className="avatar-status"
            role="status"
            aria-label="Sesión activa"
          />
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
  repository,
  today,
}: {
  children: React.ReactNode;
  freshness: string;
  repository: WarehouseRepository;
  today: string;
}) {
  const { member } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [counts, setCounts] = useState<NavCounts>(EMPTY_COUNTS);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("dock:rail-collapsed-v2");
    return stored === null ? true : stored === "1";
  });
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  useEffect(() => {
    window.localStorage.setItem(
      "dock:rail-collapsed-v2",
      collapsed ? "1" : "0",
    );
  }, [collapsed]);

  useEffect(() => applyTheme(theme), [theme]);

  useEffect(() => {
    document.title = site.documentTitle;
  }, []);

  useEffect(() => {
    if (!member) return;
    let cancelled = false;

    Promise.all([
      repository.loadShift(today),
      repository.loadPayslips(member.id),
    ])
      .then(([shift, payslips]) => {
        if (cancelled) return;
        const pending = shift.notes.filter(
          (note) => note.status === "pendiente",
        ).length;
        const incidents = shift.notes.reduce(
          (sum, note) =>
            sum +
            checkNote(note, "").lines.filter(
              (line) => line.status !== "conforme",
            ).length,
          0,
        );
        setCounts({
          pending,
          incidents,
          payslips: payslips.length,
        });
      })
      .catch(() => {
        // Los contadores son decorativos; no bloquean el panel.
      });

    return () => {
      cancelled = true;
    };
  }, [member, repository, today]);

  return (
    <div className={`app${collapsed ? " collapsed" : ""}`}>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
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
            <div className="brand-name">{site.brand}</div>
            <div className="brand-scope">{site.scope}</div>
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
        <AccountMenu theme={theme} onThemeChange={setTheme} counts={counts} />
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
            counts={counts}
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
        <main id="main" className="sheet" tabIndex={-1}>
          {children}
        </main>
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
