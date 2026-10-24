import type { WarehouseRepository } from "../data/repository";
import { useShift } from "../data/useShift";
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
  const shift = useShift(repository, today);

  if (!shift) {
    return <div className="empty-slot">Cargando el turno…</div>;
  }

  const operational = shift.machines.filter(
    (machine) => machine.status === "operativa",
  ).length;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Maquinaria</h1>
          <p className="sub">{`Parque de nave 3 · ${operational} de ${shift.machines.length} unidades en servicio.`}</p>
        </div>
      </div>

      <table className="albaranes">
        <thead>
          <tr>
            <th>Unidad</th>
            <th>Tipo</th>
            <th>Estado</th>
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
                <span className={STATUS_COPY[machine.status].className}>
                  {STATUS_COPY[machine.status].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-foot">
        <span>{`${shift.machines.length} unidades registradas`}</span>
        <span className="num">Revisión preventiva cada 250 h</span>
      </div>
    </>
  );
}
