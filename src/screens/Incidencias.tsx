import type { WarehouseRepository } from "../data/repository";
import { useShift } from "../data/useShift";
import { checkNote } from "../domain/reception";
import { formatEur } from "../domain/format";

const ORIGIN_COPY = { known: "Conocida", unknown: "Desconocida" } as const;

export function Incidencias({
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

  const differences = shift.notes.flatMap((note) =>
    checkNote(note, "").lines.flatMap((entry) => {
      if (entry.status === "conforme") return [];
      const line = note.lines.find((candidate) => candidate.sku === entry.sku);
      return [
        {
          noteId: note.id,
          sku: entry.sku,
          description: line?.description ?? entry.sku,
          expected: line?.qtyExpected ?? 0,
          received: line?.qtyReceived ?? 0,
          delta: entry.delta,
        },
      ];
    }),
  );

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Incidencias y mermas</h1>
          <p className="sub">
            Diferencias de recepción y pérdida registrada del mes.
          </p>
        </div>
      </div>

      <section className="rail-block">
        <h2 className="panel-title">Líneas con diferencia</h2>
        {differences.length === 0 ? (
          <div className="empty-slot">
            Todas las líneas recibidas cuadran con lo pedido.
          </div>
        ) : (
          <table className="albaranes">
            <thead>
              <tr>
                <th>Albarán</th>
                <th>Artículo</th>
                <th>Descripción</th>
                <th className="col-num">Pedida</th>
                <th className="col-num">Recibida</th>
                <th className="col-num">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {differences.map((entry) => (
                <tr key={`${entry.noteId}-${entry.sku}`}>
                  <td className="code">{entry.noteId}</td>
                  <td className="code">{entry.sku}</td>
                  <td className="col-identity">{entry.description}</td>
                  <td className="col-num">{entry.expected}</td>
                  <td className="col-num">{entry.received}</td>
                  <td className="col-num delta-num">{entry.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rail-block">
        <h2 className="panel-title">Mermas del mes</h2>
        <table className="albaranes">
          <thead>
            <tr>
              <th>Registro</th>
              <th>Albarán</th>
              <th>Origen</th>
              <th>Material</th>
              <th className="col-num">Importe</th>
            </tr>
          </thead>
          <tbody>
            {shift.shrinkageEvents.map((event) => (
              <tr key={event.id}>
                <td className="code">{event.id}</td>
                <td className="code">{event.albaranId}</td>
                <td>
                  <span
                    className={
                      event.known ? "pill pill-ok" : "pill pill-incidencia"
                    }
                  >
                    {event.known ? ORIGIN_COPY.known : ORIGIN_COPY.unknown}
                  </span>
                </td>
                <td className="col-identity">{event.material}</td>
                <td className="col-num">{formatEur(event.costEur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
