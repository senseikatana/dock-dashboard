import type { WarehouseRepository } from "../data/repository";
import { useShift } from "../data/useShift";
import { formatEur } from "../domain/format";
import type { ExpenseCategory } from "../domain/operations";
import { expenseTotalsByCategory } from "../domain/operations";

const CATEGORY_COPY: Record<ExpenseCategory, string> = {
  suministros: "Suministros",
  mantenimiento: "Mantenimiento",
  residuos: "Residuos",
  maquinaria: "Maquinaria",
  servicios: "Servicios",
};

export function Gastos({
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

  const totals = expenseTotalsByCategory(shift.expenses);
  const grandTotal = totals.reduce((sum, row) => sum + row.amountEur, 0);
  const maxCategory = totals[0]?.amountEur ?? 1;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Gastos generales</h1>
          <p className="sub">{`Costes del mes en nave 3 · ${formatEur(grandTotal)} comprometidos.`}</p>
        </div>
      </div>

      <div className="work">
        <section>
          <div className="panel-head">
            <h2>Partidas del mes</h2>
            <span className="count">{`${shift.expenses.length} apuntes`}</span>
          </div>
          <table className="albaranes">
            <thead>
              <tr>
                <th>Apunte</th>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th className="col-num">Importe</th>
              </tr>
            </thead>
            <tbody>
              {shift.expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="code">{expense.id}</td>
                  <td className="code loc">{expense.date}</td>
                  <td className="col-identity">{expense.concept}</td>
                  <td>{CATEGORY_COPY[expense.category]}</td>
                  <td className="col-num">{formatEur(expense.amountEur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-foot">
            <span>{`${shift.expenses.length} apuntes · categorías del almacén`}</span>
            <span className="num">{formatEur(grandTotal)}</span>
          </div>
        </section>

        <aside>
          <section className="rail-block">
            <h3>Por categoría</h3>
            <div className="rail-card">
              <ul className="material-rows">
                {totals.map((row) => (
                  <li key={row.category}>
                    <div className="name">
                      <span>{CATEGORY_COPY[row.category]}</span>
                      <span className="value">{formatEur(row.amountEur)}</span>
                    </div>
                    <div
                      className="bar"
                      style={{
                        width: `${(row.amountEur / maxCategory) * 88}%`,
                      }}
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
