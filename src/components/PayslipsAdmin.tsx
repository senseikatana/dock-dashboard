import { useEffect, useState } from "react";

import type { WarehouseRepository } from "../data/repository";
import { formatEur } from "../domain/format";
import type { Member } from "../domain/members";
import {
  formatPeriod,
  PAYSLIP_STATUS_COPY,
  type Payslip,
  type PayslipStatus,
} from "../domain/workday";
import { confirmDestructive, toastSuccess } from "../ui/dialogs";

export function PayslipsAdmin({
  repository,
  members,
}: {
  repository: WarehouseRepository;
  members: Member[];
}) {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Payslip | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setPayslips(await repository.loadPayslips());
  }

  useEffect(() => {
    let cancelled = false;
    repository.loadPayslips().then((data) => {
      if (!cancelled) setPayslips(data);
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const nameOf = (memberId: string) =>
    members.find((member) => member.id === memberId)?.name ?? memberId;

  async function save(payslip: Payslip) {
    setError(null);
    try {
      if (editing) {
        await repository.updatePayslip(editing.id, payslip);
      } else {
        await repository.addPayslip(payslip);
      }
      await refresh();
      setEditing(null);
      setShowForm(false);
      toastSuccess(editing ? "Nómina actualizada" : "Nómina creada");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la nómina.",
      );
    }
  }

  async function remove(payslipId: string) {
    const confirmed = await confirmDestructive({
      title: "Eliminar nómina",
      text: "Se eliminará este recibo. Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;
    await repository.deletePayslip(payslipId);
    await refresh();
    toastSuccess("Nómina eliminada");
  }

  return (
    <section>
      <div className="panel-head">
        <h2>Nóminas</h2>
        <span className="count">{payslips.length} recibos</span>
        <div className="tabs">
          <button
            type="button"
            className="tab on"
            onClick={() => {
              setEditing(null);
              setShowForm((open) => !open);
            }}
          >
            {showForm && !editing ? "Cerrar formulario" : "Añadir nómina"}
          </button>
        </div>
      </div>

      {error ? <div className="signin-error">{error}</div> : null}

      {showForm ? (
        <PayslipForm
          key={editing?.id ?? "new"}
          initial={editing}
          members={members}
          onSubmit={save}
        />
      ) : null}

      {payslips.length === 0 ? (
        <div className="empty-slot">Sin nóminas registradas.</div>
      ) : (
        <table className="albaranes stack">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Periodo</th>
              <th className="col-num">Bruto</th>
              <th className="col-num">Neto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {[...payslips]
              .sort((a, b) => b.period.localeCompare(a.period))
              .map((slip) => (
                <tr key={slip.id}>
                  <td data-label="Empleado" className="col-identity">
                    {nameOf(slip.memberId)}
                  </td>
                  <td data-label="Periodo">{formatPeriod(slip.period)}</td>
                  <td data-label="Bruto" className="col-num num">
                    {formatEur(slip.grossEur)}
                  </td>
                  <td data-label="Neto" className="col-num num">
                    {formatEur(slip.netEur)}
                  </td>
                  <td data-label="Estado">
                    <span
                      className={
                        slip.status === "pagada"
                          ? "pill pill-ok"
                          : "pill pill-pendiente"
                      }
                    >
                      {PAYSLIP_STATUS_COPY[slip.status]}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => {
                          setEditing(slip);
                          setShowForm(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => remove(slip.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function PayslipForm({
  initial,
  members,
  onSubmit,
}: {
  initial: Payslip | null;
  members: Member[];
  onSubmit: (payslip: Payslip) => void;
}) {
  return (
    <form
      className="reception-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          id: initial?.id ?? `NOM-${crypto.randomUUID()}`,
          memberId: String(form.get("memberId")),
          period: String(form.get("period")),
          grossEur: Number(form.get("grossEur")),
          netEur: Number(form.get("netEur")),
          status: String(form.get("status")) as PayslipStatus,
          issuedAt: String(form.get("issuedAt")),
        });
      }}
    >
      <div className="form-grid">
        <label>
          Empleado
          <select
            name="memberId"
            defaultValue={initial?.memberId ?? members[0]?.id}
            required
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Periodo
          <input
            name="period"
            type="month"
            required
            defaultValue={initial?.period ?? ""}
          />
        </label>
        <label>
          Bruto (€)
          <input
            name="grossEur"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={initial?.grossEur ?? ""}
          />
        </label>
        <label>
          Neto (€)
          <input
            name="netEur"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={initial?.netEur ?? ""}
          />
        </label>
        <label>
          Estado
          <select name="status" defaultValue={initial?.status ?? "pendiente"}>
            {Object.entries(PAYSLIP_STATUS_COPY).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha de emisión
          <input
            name="issuedAt"
            type="date"
            required
            defaultValue={initial?.issuedAt ?? ""}
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {initial ? "Guardar cambios" : "Guardar nómina"}
        </button>
      </div>
    </form>
  );
}
