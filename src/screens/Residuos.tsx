import type { WarehouseRepository } from "../data/repository";
import { useShift } from "../data/useShift";
import { formatCount } from "../domain/format";
import type { WasteRecord } from "../domain/operations";
import { wasteTotalKg } from "../domain/operations";

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
  const shift = useShift(repository, today);

  if (!shift) {
    return <div className="empty-slot">Cargando el turno…</div>;
  }

  const totalKg = wasteTotalKg(shift.wasteRecords);

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Residuos</h1>
          <p className="sub">
            Retiradas con gestor autorizado y certificado de tratamiento.
          </p>
        </div>
      </div>

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

      <table className="albaranes">
        <thead>
          <tr>
            <th>Registro</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th className="col-num">Cantidad</th>
            <th>Gestor autorizado</th>
            <th>Certificado</th>
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
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-foot">
        <span>{`${shift.wasteRecords.length} retiradas registradas`}</span>
        <span className="num">Sin residuos sin certificar</span>
      </div>
    </>
  );
}
