import { useState } from "react";

import type { WarehouseRepository } from "../data/repository";
import { useShift } from "../data/useShift";
import { formatCount } from "../domain/format";
import type { WasteRecord } from "../domain/operations";
import { wasteTotalKg } from "../domain/operations";
import { confirmDestructive, toastError, toastSuccess } from "../ui/dialogs";

const KIND_COPY: Record<WasteRecord["kind"], string> = {
  embalaje: "Embalaje",
  plastico: "Plástico",
  madera: "Madera",
  restos: "Restos de obra",
  quimicos: "Químicos",
};

export function Residuos({
  repository,
  today,
}: {
  repository: WarehouseRepository;
  today: string;
}) {
  const { shift, error, reload } = useShift(repository, today);
  const [showForm, setShowForm] = useState(false);

  if (error) {
    return <div className="empty-slot">{error}</div>;
  }

  if (!shift) {
    return <div className="empty-slot">Cargando el turno…</div>;
  }

  const totalKg = wasteTotalKg(shift.wasteRecords);

  async function addRecord(record: WasteRecord) {
    try {
      await repository.addWasteRecord(record);
    } catch {
      toastError("No se pudo registrar la retirada.");
      return;
    }
    setShowForm(false);
    toastSuccess("Retirada registrada.");
    await reload();
  }

  async function removeRecord(recordId: string) {
    const confirmed = await confirmDestructive({
      title: "Eliminar retirada",
      text: "Se borrará el registro de forma permanente. No se puede deshacer.",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;

    try {
      await repository.deleteWasteRecord(recordId);
    } catch {
      toastError("No se pudo eliminar la retirada.");
      return;
    }
    toastSuccess("Retirada eliminada.");
    await reload();
  }

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Residuos</h1>
          <p className="sub">
            Retiradas con gestor autorizado y certificado de tratamiento.
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm((open) => !open)}
          >
            {showForm ? "Cerrar formulario" : "Registrar retirada"}
          </button>
        </div>
      </div>

      {showForm ? <WasteForm today={today} onSubmit={addRecord} /> : null}

      <div className="kpi-strip two">
        <section className="kpi">
          <div className="kpi-label">Retirado este mes</div>
          <div className="kpi-value num">{`${formatCount(totalKg)} kg`}</div>
          <div className="kpi-note">
            Suma de todas las retiradas registradas
          </div>
        </section>
        <section className="kpi">
          <div className="kpi-label">Certificados emitidos</div>
          <div className="kpi-value num">
            {formatCount(shift.wasteRecords.length)}
          </div>
          <div className="kpi-note">Uno por retirada</div>
        </section>
      </div>

      {shift.wasteRecords.length === 0 ? (
        <div className="empty-slot">Sin retiradas registradas.</div>
      ) : (
        <table className="albaranes">
          <thead>
            <tr>
              <th>Registro</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th className="col-num">Cantidad</th>
              <th>Gestor autorizado</th>
              <th>Certificado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {shift.wasteRecords.map((record) => (
              <tr key={record.id}>
                <td className="code">{record.id}</td>
                <td className="code loc">{record.date}</td>
                <td className="col-identity">{KIND_COPY[record.kind]}</td>
                <td className="col-num">{`${formatCount(record.quantityKg)} kg`}</td>
                <td>{record.handler}</td>
                <td className="code loc">{record.certificateRef}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => removeRecord(record.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="table-foot">
        <span>{`${shift.wasteRecords.length} retiradas registradas`}</span>
        <span className="num">Sin residuos sin certificar</span>
      </div>
    </>
  );
}

function WasteForm({
  today,
  onSubmit,
}: {
  today: string;
  onSubmit: (record: WasteRecord) => void;
}) {
  return (
    <form
      className="reception-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          id: String(form.get("id")),
          date: String(form.get("date")),
          kind: String(form.get("kind")) as WasteRecord["kind"],
          quantityKg: Number(form.get("quantityKg")),
          handler: String(form.get("handler")),
          certificateRef: String(form.get("certificateRef")),
        });
      }}
    >
      <div className="form-grid">
        <label>
          Registro
          <input name="id" required placeholder="RES-07" />
        </label>
        <label>
          Fecha
          <input name="date" type="date" required defaultValue={today} />
        </label>
        <label>
          Tipo
          <select name="kind" defaultValue="embalaje">
            {Object.entries(KIND_COPY).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cantidad (kg)
          <input name="quantityKg" type="number" min={0} required />
        </label>
        <label>
          Gestor autorizado
          <input name="handler" required placeholder="EcoGestión Ebro" />
        </label>
        <label>
          Certificado
          <input name="certificateRef" required placeholder="CERT-2026-116" />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Guardar retirada
        </button>
      </div>
    </form>
  );
}
