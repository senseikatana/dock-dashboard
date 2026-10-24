import { Link } from "react-router-dom";

import { AlbaranesTable } from "../components/AlbaranesTable";
import { KpiStrip } from "../components/KpiStrip";
import { MermaRail, type OpenDifference } from "../components/MermaRail";
import type { WarehouseRepository } from "../data/repository";
import { useShift } from "../data/useShift";
import {
  checkNote,
  shrinkageByMaterial,
  summarizeShift,
} from "../domain/reception";
import { formatCount, formatEur } from "../domain/format";

export function CuadroDeMando({
  repository,
  today,
}: {
  repository: WarehouseRepository;
  today: string;
}) {
  const shift = useShift(repository, today);

  if (!shift) {
    return <div className="empty-slot">Cargando el turno…</div>;
  }

  const summary = summarizeShift({ ...shift, today });
  const byMaterial = shrinkageByMaterial(shift.shrinkageEvents);
  const differences: OpenDifference[] = shift.notes.flatMap((note) =>
    checkNote(note, "").lines.flatMap((entry) => {
      if (entry.status === "conforme") return [];
      const line = note.lines.find((candidate) => candidate.sku === entry.sku);
      return [
        {
          noteId: note.id,
          description: line?.description ?? entry.sku,
          delta: entry.delta,
        },
      ];
    }),
  );
  const recent = [...shift.notes]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 6);

  const dailyExpenses = shift.expenses.filter((e) => e.date === today);
  const dailyTotalEur = dailyExpenses.reduce((sum, e) => sum + e.amountEur, 0);

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Cuadro de mando</h1>
          <p className="sub">
            Turno de hoy · Nave 3 · {today} · movimiento completo del almacén.
          </p>
        </div>
        <div className="actions">
          <Link className="btn btn-primary" to="/">
            Ir a recepción
          </Link>
        </div>
      </div>

      <KpiStrip summary={summary} />

      <div className="work">
        <section>
          <div className="panel-head">
            <h2>Últimos albaranes</h2>
            <span className="count">{`${shift.notes.length} en el turno`}</span>
          </div>
          <AlbaranesTable notes={recent} />
          <div className="table-foot">
            <span>Los 6 más recientes</span>
            <Link to="/">Ver la recepción completa</Link>
          </div>
        </section>

        <section className="gastos">
          <div className="panel-head">
            <h2>Gastos del día</h2>
            <span className="count">
              {formatCount(dailyExpenses.length)} conceptos
            </span>
          </div>
          <div className="kpi-panel">
            <section className="kpi">
              <div className="kpi-label">Total gastado hoy</div>
              <div className="kpi-value num">{formatEur(dailyTotalEur)}</div>
              <div className="kpi-note">
                {dailyExpenses.length > 0
                  ? dailyExpenses.map((e) => e.concept).join(" · ")
                  : "Sin gastos registrados"}
              </div>
            </section>
          </div>
          {dailyExpenses.length > 0 && (
            <ul className="gastos-list">
              {dailyExpenses.map((expense) => (
                <li key={expense.id}>
                  <span>{expense.concept}</span>
                  <span className="num">{formatEur(expense.amountEur)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <MermaRail
            shrinkage={summary.shrinkage}
            byMaterial={byMaterial}
            differences={differences}
          />
        </aside>
      </div>
    </>
  );
}
