import { useEffect, useState } from "react";

import { useAuth } from "../auth/useAuth";
import type { WarehouseRepository } from "../data/repository";
import {
  formatHours,
  hoursBetween,
  SHIFT_COPY,
  timeOf,
  type ShiftKind,
  type TimeEntry,
} from "../domain/workday";
import { toastSuccess } from "../ui/dialogs";

export function Timesheet({ repository }: { repository: WarehouseRepository }) {
  const { member } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [shift, setShift] = useState<ShiftKind>("manana");
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!member) return;
    setEntries(await repository.loadTimeEntries(member.id));
  }

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    repository.loadTimeEntries(member.id).then((data) => {
      if (!cancelled) setEntries(data);
    });
    return () => {
      cancelled = true;
    };
  }, [member, repository]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!member) return null;

  const active = entries.find((entry) => entry.clockOut === null);
  const sorted = [...entries].sort((a, b) =>
    b.clockIn.localeCompare(a.clockIn),
  );

  async function clockIn() {
    if (!member) return;
    setBusy(true);
    try {
      await repository.clockIn(member.id, shift);
      await refresh();
      toastSuccess(`Entrada fichada · ${SHIFT_COPY[shift]}`);
    } finally {
      setBusy(false);
    }
  }

  async function clockOut() {
    if (!active) return;
    setBusy(true);
    try {
      await repository.clockOut(active.id);
      await refresh();
      toastSuccess("Salida fichada");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Fichaje</h1>
          <p className="sub">
            Registrá tu entrada y salida por turno. Queda asociado a tu cuenta.
          </p>
        </div>
      </div>

      <section className="clock-card">
        {active ? (
          <>
            <div>
              <p className="kpi-label">Turno activo</p>
              <p className="clock-shift">{SHIFT_COPY[active.shift]}</p>
              <p className="me-note">
                Entrada {timeOf(active.clockIn)} ·{" "}
                {formatHours(hoursBetween(active.clockIn, now.toISOString()))}{" "}
                transcurridas
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={clockOut}
            >
              {busy ? "Fichando…" : "Fichar salida"}
            </button>
          </>
        ) : (
          <>
            <div>
              <p className="kpi-label">Nuevo fichaje</p>
              <p className="clock-shift">Elegí el turno</p>
              <div className="shift-picker" role="group" aria-label="Turno">
                {(Object.keys(SHIFT_COPY) as ShiftKind[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={value === shift ? "tab on" : "tab"}
                    aria-pressed={value === shift}
                    onClick={() => setShift(value)}
                  >
                    {SHIFT_COPY[value]}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={clockIn}
            >
              {busy ? "Fichando…" : "Fichar entrada"}
            </button>
          </>
        )}
      </section>

      <section className="rail-block">
        <h2 className="panel-title">Historial</h2>
        {sorted.length === 0 ? (
          <div className="empty-slot">Todavía no hay fichajes.</div>
        ) : (
          <table className="albaranes stack">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Turno</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th className="col-num">Horas</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr key={entry.id}>
                  <td data-label="Fecha" className="code loc">
                    {entry.date}
                  </td>
                  <td data-label="Turno">{SHIFT_COPY[entry.shift]}</td>
                  <td data-label="Entrada" className="num">
                    {timeOf(entry.clockIn)}
                  </td>
                  <td data-label="Salida" className="num">
                    {entry.clockOut ? timeOf(entry.clockOut) : "En curso"}
                  </td>
                  <td data-label="Horas" className="col-num num">
                    {entry.clockOut
                      ? formatHours(hoursBetween(entry.clockIn, entry.clockOut))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
