import { useEffect, useState } from "react";

import type { ShiftData, WarehouseRepository } from "../data/repository";
import { formatEur } from "../domain/format";
import type { ShrinkageEvent } from "../domain/reception";
import { checkNote } from "../domain/reception";

const ORIGIN_COPY = { known: "Conocida", unknown: "Desconocida" } as const;

const KIND_COPY: Record<ShrinkageEvent["kind"], string> = {
  rotura: "Rotura",
  faltante: "Faltante",
  desconocida: "Desconocida",
};

export function Incidencias({
  repository,
  today,
}: {
  repository: WarehouseRepository;
  today: string;
}) {
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  async function addEvent(event: ShrinkageEvent) {
    await repository.addShrinkageEvent(event);
    await refresh();
    setShowForm(false);
  }

  async function removeEvent(eventId: string) {
    await repository.deleteShrinkageEvent(eventId);
    await refresh();
  }

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Incidencias y mermas</h1>
          <p className="sub">
            Diferencias de recepción y pérdida registrada del mes.
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm((open) => !open)}
          >
            {showForm ? "Cerrar formulario" : "Registrar merma"}
          </button>
        </div>
      </div>

      {showForm ? <ShrinkageForm onSubmit={addEvent} /> : null}

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
        {shift.shrinkageEvents.length === 0 ? (
          <div className="empty-slot">Sin mermas registradas.</div>
        ) : (
          <table className="albaranes">
            <thead>
              <tr>
                <th>Registro</th>
                <th>Albarán</th>
                <th>Origen</th>
                <th>Material</th>
                <th className="col-num">Importe</th>
                <th>Acciones</th>
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
                  <td>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => removeEvent(event.id)}
                    >
                      Eliminar
                    </button>
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

function ShrinkageForm({
  onSubmit,
}: {
  onSubmit: (event: ShrinkageEvent) => void;
}) {
  return (
    <form
      className="reception-form"
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        const form = new FormData(formEvent.currentTarget);
        onSubmit({
          id: String(form.get("id")),
          albaranId: String(form.get("albaranId")),
          kind: String(form.get("kind")) as ShrinkageEvent["kind"],
          material: String(form.get("material")),
          costEur: Number(form.get("costEur")),
          known: form.get("known") === "known",
        });
      }}
    >
      <div className="form-grid">
        <label>
          Registro
          <input name="id" required placeholder="MER-07" />
        </label>
        <label>
          Albarán
          <input name="albaranId" required placeholder="ALB-2026-0417" />
        </label>
        <label>
          Tipo
          <select name="kind" defaultValue="rotura">
            {Object.entries(KIND_COPY).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Origen
          <select name="known" defaultValue="known">
            <option value="known">Conocida</option>
            <option value="unknown">Desconocida</option>
          </select>
        </label>
        <label>
          Material
          <input name="material" required placeholder="Cerámica y pavimento" />
        </label>
        <label>
          Importe (€)
          <input name="costEur" type="number" min={0} step="0.01" required />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Guardar merma
        </button>
      </div>
    </form>
  );
}
