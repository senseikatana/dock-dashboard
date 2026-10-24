import { useEffect, useState } from "react";

import { useAuth } from "../auth/useAuth";
import type { WarehouseRepository } from "../data/repository";
import { formatEur } from "../domain/format";
import {
  formatPeriod,
  PAYSLIP_STATUS_COPY,
  type Payslip,
} from "../domain/workday";

export function Payslips({ repository }: { repository: WarehouseRepository }) {
  const { member } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    repository.loadPayslips(member.id).then((data) => {
      if (!cancelled) setPayslips(data);
    });
    return () => {
      cancelled = true;
    };
  }, [member, repository]);

  if (!member) return null;

  const sorted = [...payslips].sort((a, b) => b.period.localeCompare(a.period));
  const totalNet = sorted.reduce((sum, slip) => sum + slip.netEur, 0);
  const last = sorted[0];

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Nóminas</h1>
          <p className="sub">
            Recibos de {member.name} · {sorted.length} registros.
          </p>
        </div>
      </div>

      <div className="kpi-strip two">
        <section className="kpi">
          <div className="kpi-label">Última nómina</div>
          <div className="kpi-value num">
            {last ? formatEur(last.netEur) : "—"}
          </div>
          <div className="kpi-note">
            {last ? `${formatPeriod(last.period)} · neto` : "Sin nóminas"}
          </div>
        </section>
        <section className="kpi">
          <div className="kpi-label">Neto acumulado</div>
          <div className="kpi-value num">{formatEur(totalNet)}</div>
          <div className="kpi-note">Suma de las nóminas visibles</div>
        </section>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-slot">
          No hay nóminas cargadas para tu cuenta.
        </div>
      ) : (
        <table className="albaranes stack">
          <thead>
            <tr>
              <th>Periodo</th>
              <th className="col-num">Bruto</th>
              <th className="col-num">Neto</th>
              <th>Estado</th>
              <th>Emitida</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((slip) => (
              <tr key={slip.id}>
                <td data-label="Periodo" className="col-identity">
                  {formatPeriod(slip.period)}
                </td>
                <td data-label="Bruto" className="col-num num">
                  {formatEur(slip.grossEur)}
                </td>
                <td data-label="Neto" className="col-num num">
                  {formatEur(slip.netEur)}
                </td>
                <td data-label="Estado">
                  <span
                    className={
                      slip.status === "pagada"
                        ? "pill pill-ok"
                        : "pill pill-pendiente"
                    }
                  >
                    {PAYSLIP_STATUS_COPY[slip.status]}
                  </span>
                </td>
                <td data-label="Emitida" className="code loc">
                  {slip.issuedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
