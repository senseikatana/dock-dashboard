import { formatCount } from "../domain/format";
import type { DeliveryNote, NoteStatus } from "../domain/reception";

const STATUS_COPY: Record<NoteStatus, string> = {
  pendiente: "En validación",
  validado: "Conforme",
  incidencia: "Incidencia",
};

function locationOf(note: DeliveryNote): string {
  const first = note.lines[0]?.location ?? "—";
  return note.lines.length > 1 ? `${first} +${note.lines.length - 1}` : first;
}

export function AlbaranesTable({
  notes,
  onValidate,
  justStamped,
}: {
  notes: DeliveryNote[];
  onValidate?: (noteId: string) => void;
  justStamped?: string[];
}) {
  return (
    <div className="table-frame">
      <table className="albaranes queue">
        <thead>
          <tr>
            <th>Albarán</th>
            <th>Proveedor</th>
            <th>Transportista</th>
            <th className="col-num">Líneas</th>
            <th>Ubicación</th>
            <th>Estado</th>
            {onValidate ? <th aria-label="Acciones" /> : null}
          </tr>
        </thead>
        <tbody>
          {notes.map((note, index) => {
            const courseStart =
              index === 0 || notes[index - 1].dock !== note.dock;
            return (
              <tr
                key={note.id}
                className={courseStart ? "course-start" : undefined}
              >
                <td className="code">{note.id}</td>
                <td className="col-identity">{note.supplier}</td>
                <td className="muted">{note.carrier}</td>
                <td className="col-num">
                  {formatCount(note.lines.length)}
                  <span className="cell-unit">
                    {note.lines.length === 1 ? " línea" : " líneas"}
                  </span>
                </td>
                <td className="code loc">{locationOf(note)}</td>
                <td>
                  {note.status === "validado" ? (
                    <span
                      className={
                        justStamped?.includes(note.id)
                          ? "stamp stamp-landing"
                          : "stamp"
                      }
                    >
                      Conforme
                    </span>
                  ) : note.status === "incidencia" ? (
                    <span className="stamp stamp-no">No conforme</span>
                  ) : (
                    <span className="pill pill-pendiente">
                      {STATUS_COPY[note.status]}
                    </span>
                  )}
                </td>
                {onValidate ? (
                  <td>
                    {note.status === "pendiente" ? (
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => onValidate(note.id)}
                      >
                        Validar
                      </button>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
