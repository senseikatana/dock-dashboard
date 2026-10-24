import { useEffect, useState } from "react";

import type { ShiftData, WarehouseRepository } from "../data/repository";
import type { Machine } from "../domain/reception";

const KIND_COPY: Record<Machine["kind"], string> = {
  frontal: "Frontal",
  elevadora: "Elevadora",
  retractil: "Retráctil",
};

const STATUS_COPY: Record<
  Machine["status"],
  { label: string; className: string }
> = {
  operativa: { label: "Operativa", className: "pill pill-ok" },
  taller: { label: "En taller", className: "pill pill-pendiente" },
  revision: { label: "En revisión", className: "pill pill-pendiente" },
};

export function Maquinaria({
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

  const operational = shift.machines.filter(
    (machine) => machine.status === "operativa",
  ).length;

  async function addMachine(machine: Machine) {
    await repository.addMachine(machine);
    await refresh();
    setShowForm(false);
  }

  async function changeStatus(machineId: string, status: Machine["status"]) {
    await repository.updateMachine(machineId, { status });
    await refresh();
  }

  async function removeMachine(machineId: string) {
    await repository.deleteMachine(machineId);
    await refresh();
  }

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Maquinaria</h1>
          <p className="sub">{`Parque de nave 3 · ${operational} de ${shift.machines.length} unidades en servicio.`}</p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm((open) => !open)}
          >
            {showForm ? "Cerrar formulario" : "Añadir máquina"}
          </button>
        </div>
      </div>

      {showForm ? <MachineForm onSubmit={addMachine} /> : null}

      {shift.machines.length === 0 ? (
        <div className="empty-slot">Sin maquinaria registrada.</div>
      ) : (
        <table className="albaranes">
          <thead>
            <tr>
              <th>Unidad</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {shift.machines.map((machine, index) => (
              <tr
                key={machine.id}
                className={index === 0 ? "course-start" : undefined}
              >
                <td className="code">{machine.id}</td>
                <td className="col-identity">{KIND_COPY[machine.kind]}</td>
                <td>
                  <select
                    className="inline-select"
                    value={machine.status}
                    aria-label={`Estado de ${machine.id}`}
                    onChange={(event) =>
                      changeStatus(
                        machine.id,
                        event.target.value as Machine["status"],
                      )
                    }
                  >
                    {Object.entries(STATUS_COPY).map(([value, copy]) => (
                      <option key={value} value={value}>
                        {copy.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => removeMachine(machine.id)}
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
        <span>{`${shift.machines.length} unidades registradas`}</span>
        <span className="num">Revisión preventiva cada 250 h</span>
      </div>
    </>
  );
}

function MachineForm({ onSubmit }: { onSubmit: (machine: Machine) => void }) {
  return (
    <form
      className="reception-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          id: String(form.get("id")),
          kind: String(form.get("kind")) as Machine["kind"],
          status: String(form.get("status")) as Machine["status"],
        });
      }}
    >
      <div className="form-grid">
        <label>
          Identificador
          <input name="id" required placeholder="FR-03" />
        </label>
        <label>
          Tipo
          <select name="kind" defaultValue="frontal">
            {Object.entries(KIND_COPY).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select name="status" defaultValue="operativa">
            {Object.entries(STATUS_COPY).map(([value, copy]) => (
              <option key={value} value={value}>
                {copy.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Guardar máquina
        </button>
      </div>
    </form>
  );
}
