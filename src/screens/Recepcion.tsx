import { useEffect, useMemo, useState } from "react";

import { AlbaranesTable } from "../components/AlbaranesTable";
import { KpiStrip } from "../components/KpiStrip";
import { MermaRail, type OpenDifference } from "../components/MermaRail";
import type { ShiftData, WarehouseRepository } from "../data/repository";
import type { DeliveryNote, NoteStatus } from "../domain/reception";
import { localDateIso } from "../domain/date";
import { MAX_DOCKS } from "../domain/reception";
import {
  checkNote,
  shrinkageByMaterial,
  summarizeShift,
} from "../domain/reception";

type Tab = "pendientes" | "todos" | "incidencias";

const TABS: { id: Tab; label: (n: number) => string }[] = [
  { id: "pendientes", label: (n) => `Pendientes · ${n}` },
  { id: "todos", label: (n) => `Todos · ${n}` },
  { id: "incidencias", label: (n) => `Con incidencia · ${n}` },
];

function longDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${isoDate}T00:00:00`));
}

function openDifferences(shift: ShiftData): OpenDifference[] {
  return shift.notes.flatMap((note) => {
    const check = checkNote(note, "");
    return check.lines.flatMap((entry) => {
      if (entry.status === "conforme") return [];
      const line = note.lines.find((candidate) => candidate.sku === entry.sku);
      return [
        {
          noteId: note.id,
          description: line?.description ?? entry.sku,
          delta: entry.delta,
        },
      ];
    });
  });
}

export function Recepcion({
  repository,
  today,
}: {
  repository: WarehouseRepository;
  today: string;
}) {
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [tab, setTab] = useState<Tab>("pendientes");
  const [showForm, setShowForm] = useState(false);
  const [justStamped, setJustStamped] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    repository.loadShift(today).then((data) => {
      if (!cancelled) setShift(data);
    });
    return () => {
      cancelled = true;
    };
  }, [repository, today]);

  const summary = useMemo(
    () => (shift ? summarizeShift({ ...shift, today }) : null),
    [shift, today],
  );
  const byMaterial = useMemo(
    () => (shift ? shrinkageByMaterial(shift.shrinkageEvents) : []),
    [shift],
  );
  const differences = useMemo(
    () => (shift ? openDifferences(shift) : []),
    [shift],
  );

  if (!shift || !summary) {
    return <div className="empty-slot">Cargando el turno…</div>;
  }

  const counts: Record<Tab, number> = {
    pendientes: shift.notes.filter(
      (note) => note.status === "pendiente" || justStamped.includes(note.id),
    ).length,
    todos: shift.notes.length,
    incidencias: shift.notes.filter((note) => note.status === "incidencia")
      .length,
  };
  const visible = shift.notes
    .filter((note) =>
      tab === "todos"
        ? true
        : tab === "pendientes"
          ? note.status === "pendiente" || justStamped.includes(note.id)
          : note.status === "incidencia",
    )
    .sort((a, b) => a.dock - b.dock || a.id.localeCompare(b.id));

  async function validate(noteId: string) {
    await repository.validateNote(noteId, new Date().toISOString());
    setJustStamped((ids) => [...ids, noteId]);
    setShift(await repository.loadShift(today));
  }

  function selectTab(next: Tab) {
    setTab(next);
    setJustStamped([]);
  }

  async function register(note: DeliveryNote) {
    await repository.addNote(note);
    setShift(await repository.loadShift(today));
    setShowForm(false);
  }

  async function remove(noteId: string) {
    await repository.deleteNote(noteId);
    setShift(await repository.loadShift(today));
  }

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Recepción de mercancía</h1>
          <p className="sub">
            {`Turno mañana · Muelles 1–${MAX_DOCKS} · ${longDate(today)}`}
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm((open) => !open)}
          >
            {showForm ? "Cerrar formulario" : "Registrar recepción"}
          </button>
        </div>
      </div>

      {showForm ? <ReceptionForm onSubmit={register} /> : null}

      <KpiStrip summary={summary} />

      <div className="work">
        <section>
          <div className="panel-head">
            <h2>Albaranes del turno</h2>
            <span className="count">{`${counts.todos} registrados`}</span>
            <div className="tabs" role="tablist" aria-label="Filtrar albaranes">
              {TABS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === entry.id}
                  className={tab === entry.id ? "tab on" : "tab"}
                  onClick={() => selectTab(entry.id)}
                >
                  {entry.label(counts[entry.id])}
                </button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <div className="empty-slot">
              {tab === "pendientes"
                ? "No queda ningún albarán pendiente en este turno."
                : "Ningún albarán en este filtro."}
            </div>
          ) : (
            <>
              <AlbaranesTable
                notes={visible}
                onValidate={validate}
                onDelete={remove}
                justStamped={justStamped}
              />
              <div className="table-foot">
                <span>{`${visible.length} de ${counts.todos} albaranes · Muelles 1–${MAX_DOCKS}`}</span>
                <span className="num">Actualizado 13:52</span>
              </div>
            </>
          )}
        </section>

        <aside>
          <MermaRail
            shrinkage={summary.shrinkage}
            byMaterial={byMaterial}
            differences={differences}
          />
        </aside>
      </div>
    </>
  );
}

const UNITS = ["uds", "sacos", "m²", "cajas", "cubos", "barras", "t"];

function ReceptionForm({
  onSubmit,
}: {
  onSubmit: (note: DeliveryNote) => void;
}) {
  return (
    <form
      className="reception-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const status: NoteStatus = "pendiente";
        onSubmit({
          id: String(form.get("id")),
          supplier: String(form.get("supplier")),
          carrier: String(form.get("carrier")),
          date: String(form.get("date")),
          dock: Number(form.get("dock")),
          status,
          lines: [
            {
              sku: String(form.get("sku")),
              description: String(form.get("description")),
              unit: String(form.get("unit")),
              qtyExpected: Number(form.get("qtyExpected")),
              qtyReceived: Number(form.get("qtyReceived")),
              location: String(form.get("location")),
            },
          ],
        });
      }}
    >
      <div className="form-grid">
        <label>
          Albarán
          <input name="id" required defaultValue="ALB-2026-0417" />
        </label>
        <label>
          Proveedor
          <input name="supplier" required placeholder="Cerámicas del Ebro" />
        </label>
        <label>
          Transportista
          <input name="carrier" required placeholder="Transportes Ebro S.L." />
        </label>
        <label>
          Fecha
          <input
            name="date"
            type="date"
            required
            defaultValue={localDateIso()}
          />
        </label>
        <label>
          Muelle
          <input
            name="dock"
            type="number"
            min={1}
            max={MAX_DOCKS}
            required
            defaultValue={1}
          />
        </label>
        <label>
          Artículo (SKU)
          <input name="sku" required placeholder="CE-6060" />
        </label>
        <label>
          Descripción
          <input
            name="description"
            required
            placeholder="Pavimento porcelánico 60x60"
          />
        </label>
        <label>
          Unidad
          <select name="unit" defaultValue="uds">
            {UNITS.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
        <label>
          Cantidad pedida
          <input
            name="qtyExpected"
            type="number"
            min={0}
            required
            defaultValue={1}
          />
        </label>
        <label>
          Cantidad recibida
          <input
            name="qtyReceived"
            type="number"
            min={0}
            required
            defaultValue={1}
          />
        </label>
        <label>
          Ubicación
          <input
            name="location"
            required
            placeholder="03-A-12"
            pattern="\d{2}-[A-D]-\d{2}"
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Guardar recepción
        </button>
      </div>
    </form>
  );
}
