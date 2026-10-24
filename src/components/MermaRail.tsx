import { formatEur, formatPct } from "../domain/format";
import type { ShrinkageRow, ShiftSummary } from "../domain/reception";

export interface OpenDifference {
  noteId: string;
  description: string;
  delta: number;
}

export function MermaRail({
  shrinkage,
  byMaterial,
  differences,
}: {
  shrinkage: ShiftSummary["shrinkage"];
  byMaterial: ShrinkageRow[];
  differences: OpenDifference[];
}) {
  const total = shrinkage.totalEur;
  const knownShare = total === 0 ? 0 : (shrinkage.knownEur / total) * 100;
  const maxMaterial = byMaterial[0]?.costEur ?? 1;

  return (
    <>
      <section className="rail-block">
        <h3>Mermas conocidas y desconocidas</h3>
        <div className="rail-card">
          <div className="split-bar" aria-hidden="true">
            <div className="known" style={{ width: `${knownShare}%` }} />
            <div
              className="unknown"
              style={{ width: `${100 - knownShare}%` }}
            />
          </div>
          <div className="split-figures">
            <div className="k">
              <div className="split-label">Conocidas</div>
              <span className="figure">{formatEur(shrinkage.knownEur)}</span>
              <div className="split-caption">
                <span className="pct">{formatPct(knownShare)}</span> del total
              </div>
            </div>
            <div className="u">
              <div className="split-label">Desconocidas</div>
              <span className="figure">{formatEur(shrinkage.unknownEur)}</span>
              <div className="split-caption">
                <span className="pct">{formatPct(100 - knownShare)}</span> del
                total
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rail-block">
        <h3>Desglose por material</h3>
        <div className="rail-card">
          {byMaterial.length === 0 ? (
            <div className="empty-slot">Sin mermas registradas este mes.</div>
          ) : (
            <ul className="material-rows">
              {byMaterial.map((row) => (
                <li key={row.material}>
                  <div className="name">
                    <span>{row.material}</span>
                    <span className="value">{formatEur(row.costEur)}</span>
                  </div>
                  <div
                    className="bar"
                    style={{ width: `${(row.costEur / maxMaterial) * 88}%` }}
                    aria-hidden="true"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rail-block">
        <h3>Incidencias abiertas</h3>
        <div className="rail-card">
          {differences.length === 0 ? (
            <div className="empty-slot">
              Todas las líneas recibidas cuadran con lo pedido.
            </div>
          ) : (
            <ul className="incident-rows">
              {differences.map((entry) => (
                <li key={`${entry.noteId}-${entry.description}`}>
                  <span>
                    {entry.description}
                    <br />
                    <span className="muted num">{entry.noteId}</span>
                  </span>
                  <span className="delta">{entry.delta} uds</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
