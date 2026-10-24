import { formatCount, formatEur, formatPct } from "../domain/format";
import type { ShiftSummary } from "../domain/reception";
import { MAX_DOCKS } from "../domain/reception";

export function KpiStrip({ summary }: { summary: ShiftSummary }) {
  const inactive = summary.machinery.total - summary.machinery.operational;

  return (
    <div className="kpi-strip">
      <section className="kpi">
        <div className="kpi-label">Recepciones hoy</div>
        <div className="kpi-value num">
          {formatCount(summary.receptionsToday)}
        </div>
        <div className="kpi-note">{`Muelles 1–${MAX_DOCKS}`}</div>
      </section>
      <section className="kpi">
        <div className="kpi-label">Conformidad</div>
        <div className="kpi-value num">
          {formatPct(summary.conformity.ratePct)}
        </div>
        <div className="kpi-note">
          {`${summary.conformity.conformingLines} de ${summary.conformity.totalLines} líneas conformes`}
        </div>
      </section>
      <section className="kpi">
        <div className="kpi-label">Mermas del mes</div>
        <div
          className={`kpi-value num${summary.shrinkage.unknownEur > 0 ? " accent" : ""}`}
        >
          {formatEur(summary.shrinkage.totalEur)}
        </div>
        <div className="kpi-note">{`${formatEur(summary.shrinkage.knownEur)} conocidas`}</div>
      </section>
      <section className="kpi">
        <div className="kpi-label">Maquinaria operativa</div>
        <div className="kpi-value">
          <span className="num">
            {formatCount(summary.machinery.operational)}
          </span>
          <span className="kpi-unit">/ {summary.machinery.total}</span>
        </div>
        <div className="kpi-note">{`${formatCount(inactive)} fuera de servicio`}</div>
      </section>
    </div>
  );
}
