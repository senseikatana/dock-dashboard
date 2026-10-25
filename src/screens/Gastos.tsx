import { useState } from "react";

import type { WarehouseRepository } from "../data/repository";
import { useShift } from "../data/useShift";
import { formatEur } from "../domain/format";
import type { Expense, ExpenseCategory } from "../domain/operations";
import { expenseTotalsByCategory } from "../domain/operations";
import { confirmDestructive, toastError, toastSuccess } from "../ui/dialogs";

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
  const { shift, error, reload } = useShift(repository, today);
  const [showForm, setShowForm] = useState(false);

  if (error) {
    return <div className="empty-slot">{error}</div>;
  }

  if (!shift) {
    return <div className="empty-slot">Cargando el turno…</div>;
  }

  const totals = expenseTotalsByCategory(shift.expenses);
  const grandTotal = totals.reduce((sum, row) => sum + row.amountEur, 0);
  const maxCategory = totals[0]?.amountEur ?? 1;

  async function addExpense(expense: Expense) {
    try {
      await repository.addExpense(expense);
    } catch {
      toastError("No se pudo guardar el gasto.");
      return;
    }
    setShowForm(false);
    toastSuccess("Gasto guardado.");
    await reload();
  }

  async function removeExpense(expenseId: string) {
    const confirmed = await confirmDestructive({
      title: "Eliminar gasto",
      text: "Se borrará el apunte de forma permanente. No se puede deshacer.",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;

    try {
      await repository.deleteExpense(expenseId);
    } catch {
      toastError("No se pudo eliminar el gasto.");
      return;
    }
    toastSuccess("Gasto eliminado.");
    await reload();
  }

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Gastos generales</h1>
          <p className="sub">{`Costes del mes en nave 3 · ${formatEur(grandTotal)} comprometidos.`}</p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm((open) => !open)}
          >
            {showForm ? "Cerrar formulario" : "Añadir gasto"}
          </button>
        </div>
      </div>

      {showForm ? <ExpenseForm today={today} onSubmit={addExpense} /> : null}

      <div className="work">
        <section>
          <div className="panel-head">
            <h2>Partidas del mes</h2>
            <span className="count">{`${shift.expenses.length} apuntes`}</span>
          </div>
          {shift.expenses.length === 0 ? (
            <div className="empty-slot">Sin gastos registrados.</div>
          ) : (
            <table className="albaranes">
              <thead>
                <tr>
                  <th>Apunte</th>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th className="col-num">Importe</th>
                  <th>Acciones</th>
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
                    <td>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => removeExpense(expense.id)}
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
            <span>{`${shift.expenses.length} apuntes · categorías del almacén`}</span>
            <span className="num">{formatEur(grandTotal)}</span>
          </div>
        </section>

        <aside>
          <section className="rail-block">
            <h3>Por categoría</h3>
            <div className="rail-card">
              {totals.length === 0 ? (
                <div className="empty-slot">Sin categorías con gasto.</div>
              ) : (
                <ul className="material-rows">
                  {totals.map((row) => (
                    <li key={row.category}>
                      <div className="name">
                        <span>{CATEGORY_COPY[row.category]}</span>
                        <span className="value">
                          {formatEur(row.amountEur)}
                        </span>
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
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function ExpenseForm({
  today,
  onSubmit,
}: {
  today: string;
  onSubmit: (expense: Expense) => void;
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
          category: String(form.get("category")) as ExpenseCategory,
          concept: String(form.get("concept")),
          amountEur: Number(form.get("amountEur")),
        });
      }}
    >
      <div className="form-grid">
        <label>
          Apunte
          <input name="id" required placeholder="G-09" />
        </label>
        <label>
          Fecha
          <input name="date" type="date" required defaultValue={today} />
        </label>
        <label>
          Categoría
          <select name="category" defaultValue="suministros">
            {Object.entries(CATEGORY_COPY).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Concepto
          <input name="concept" required placeholder="Estanterías nave 3" />
        </label>
        <label>
          Importe (€)
          <input name="amountEur" type="number" min={0} step="0.01" required />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Guardar gasto
        </button>
      </div>
    </form>
  );
}
