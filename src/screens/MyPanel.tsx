import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import type { WarehouseRepository } from "../data/repository";
import { MEMBER_DEPARTMENT_COPY, MEMBER_ROLE_COPY } from "../domain/members";
import { localDateIso } from "../domain/date";
import { formatEur } from "../domain/format";
import {
  formatHours,
  formatPeriod,
  hoursBetween,
  SHIFT_COPY,
  type Payslip,
  type TimeEntry,
} from "../domain/workday";

function isoWeek(date: Date): string {
  const copy = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((copy.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${copy.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function MyPanel({ repository }: { repository: WarehouseRepository }) {
  const { member } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    Promise.all([
      repository.loadTimeEntries(member.id),
      repository.loadPayslips(member.id),
    ]).then(([timeEntries, slips]) => {
      if (cancelled) return;
      setEntries(timeEntries);
      setPayslips(slips);
    });
    return () => {
      cancelled = true;
    };
  }, [member, repository]);

  if (!member) return null;

  const today = localDateIso();
  const active = entries.find((entry) => entry.clockOut === null);
  const week = isoWeek(new Date());
  const weekEntries = entries.filter(
    (entry) => isoWeek(new Date(`${entry.date}T00:00:00`)) === week,
  );
  const weekHours = weekEntries.reduce(
    (sum, entry) => sum + hoursBetween(entry.clockIn, entry.clockOut),
    0,
  );
  const todayEntries = entries.filter((entry) => entry.date === today);
  const lastPayslip = [...payslips].sort((a, b) =>
    b.period.localeCompare(a.period),
  )[0];
  const firstName = member.name.split(" ")[0];

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Hola, {firstName}</h1>
          <p className="sub">
            Tu panel personal · {today} ·{" "}
            {MEMBER_DEPARTMENT_COPY[member.department]}
          </p>
        </div>
        <div className="actions">
          <Link className="btn btn-primary" to="/timesheet">
            {active ? "Fichar salida" : "Fichar entrada"}
          </Link>
        </div>
      </div>

      <div className="me-grid">
        <section className="me-card">
          <h2>Fichaje de hoy</h2>
          {active ? (
            <>
              <p className="me-figure num">
                {SHIFT_COPY[active.shift]} · desde{" "}
                {new Intl.DateTimeFormat("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(active.clockIn))}
              </p>
              <Link to="/timesheet" className="btn btn-small">
                Ver fichaje
              </Link>
            </>
          ) : (
            <>
              <p className="me-figure">
                {todayEntries.length > 0
                  ? "Turno cerrado. Podés abrir otro fichaje."
                  : "Todavía no fichaste hoy."}
              </p>
              <Link to="/timesheet" className="btn btn-small">
                Abrir fichaje
              </Link>
            </>
          )}
        </section>

        <section className="me-card">
          <h2>Esta semana</h2>
          <p className="me-figure num">{formatHours(weekHours)}</p>
          <p className="me-note">
            {weekEntries.length} fichajes · semana {week}
          </p>
        </section>

        <section className="me-card">
          <h2>Última nómina</h2>
          {lastPayslip ? (
            <>
              <p className="me-figure num">{formatEur(lastPayslip.netEur)}</p>
              <p className="me-note">
                {formatPeriod(lastPayslip.period)} · neto
              </p>
              <Link to="/payslips" className="btn btn-small">
                Ver nóminas
              </Link>
            </>
          ) : (
            <p className="me-figure">Sin nóminas todavía.</p>
          )}
        </section>

        <section className="me-card">
          <h2>Mi cuenta</h2>
          <p className="me-note">
            {member.email}
            <br />
            {MEMBER_ROLE_COPY[member.role]} · {member.status}
          </p>
          <Link to="/account" className="btn btn-small">
            Editar datos
          </Link>
        </section>
      </div>
    </>
  );
}
