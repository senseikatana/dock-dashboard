import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { AlbaranesTable } from "../components/AlbaranesTable";
import { KpiStrip } from "../components/KpiStrip";
import { MermaRail, type OpenDifference } from "../components/MermaRail";
import type { ShiftData, WarehouseRepository } from "../data/repository";
import {
  checkNote,
  shrinkageByMaterial,
  summarizeShift,
} from "../domain/reception";
import { formatCount, formatEur } from "../domain/format";
import { confirmDestructive, toastSuccess } from "../ui/dialogs";

export function CuadroDeMando({
  repository,
  today,
}: {
  repository: WarehouseRepository;
  today: string;
}) {
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setShift(await repository.loadShift(today));
  }

  useEffect(() => {
    let cancelled = false;
    repository.loadShift(today).then((data) => {
      if (!cancelled) setShift(data);
    });
    return () => {
      cancelled = true;
    };
  }, [repository, today]);

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

  async function purge() {
    const confirmed = await confirmDestructive({
      title: "Purgar datos",
      text: "Se borrarán los albaranes, mermas, maquinaria, residuos, fichajes y nóminas. Los miembros y sus accesos se conservan.",
      confirmText: "Purgar",
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await repository.purgeSeed();
      await refresh();
      toastSuccess("Datos purgados");
    } finally {
      setBusy(false);
    }
  }

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
          <button
            type="button"
            className="btn btn-danger"
            disabled={busy}
            onClick={purge}
          >
            Purgar datos
          </button>
          <Link className="btn btn-primary" to="/reception">
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
          {recent.length === 0 ? (
            <div className="empty-slot">
              Sin albaranes. Purgá los datos o registrá una recepción.
            </div>
          ) : (
            <>
              <AlbaranesTable notes={recent} />
              <div className="table-foot">
                <span>Los 6 más recientes</span>
                <Link to="/">Ver la recepción completa</Link>
              </div>
            </>
          )}
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
