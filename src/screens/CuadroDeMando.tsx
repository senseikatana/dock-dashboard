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

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Cuadro de mando</h1>
          <p className="sub">
            Turno mañana · Nave 3 · todo el movimiento del almacén en un golpe.
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
