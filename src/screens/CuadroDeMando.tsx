import { useEffect, useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";

import type { ShiftData, WarehouseRepository } from "../data/repository";
import dashboard from "../content/dashboard.json";
import {
  checkNote,
  shrinkageByMaterial,
  summarizeShift,
} from "../domain/reception";
import {
  formatCount,
  formatEur,
  formatLongDate,
  formatPct,
} from "../domain/format";
import { confirmDestructive, toastSuccess } from "../ui/dialogs";

type Tone = "positive" | "warning" | "negative" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  positive: "bg-[var(--positive-bg)] text-[var(--positive-ink)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning-ink)]",
  negative: "bg-[var(--negative-bg)] text-[var(--negative-ink)]",
  neutral: "bg-[var(--raised)] text-[var(--muted)]",
};

function TrendIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {direction === "up" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
        />
      )}
    </svg>
  );
}

function KpiIcon({
  icon,
}: {
  icon: "reception" | "conformity" | "shrinkage" | "machinery";
}) {
  const common = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    className: "size-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
  } as const;

  switch (icon) {
    case "reception":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"
          />
        </svg>
      );
    case "conformity":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "shrinkage":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
          />
        </svg>
      );
    case "machinery":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.7 6.3a4 4 0 01-5.4 5.4l-5 5a2 2 0 102.8 2.8l5-5a4 4 0 015.4-5.4l-2.3 2.3-1.4-1.4 2.3-2.3z"
          />
        </svg>
      );
  }
}

function KpiCard({
  label,
  value,
  note,
  badge,
  tone,
  trend,
  icon,
  sparklineRef,
}: {
  label: string;
  value: string;
  note: string;
  badge: string;
  tone: Tone;
  trend?: "up" | "down";
  icon: "reception" | "conformity" | "shrinkage" | "machinery";
  sparklineRef?: RefObject<HTMLCanvasElement | null>;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-[var(--raised)] text-[var(--muted)]">
          <KpiIcon icon={icon} />
        </span>
        <div
          className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium ${TONE_CLASS[tone]}`}
        >
          {trend ? <TrendIcon direction={trend} /> : null}
          <span className="sr-only">
            {trend === "up"
              ? "Aumento: "
              : trend === "down"
                ? "Descenso: "
                : ""}
          </span>
          <span>{badge}</span>
        </div>
      </div>

      <div className="min-w-0">
        <strong className="block text-sm font-medium text-[var(--muted)]">
          {label}
        </strong>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-2xl font-semibold tabular-nums text-[var(--text)]">
            {value}
          </span>
          <span className="text-xs text-[var(--muted)]">{note}</span>
        </p>
      </div>

      {sparklineRef ? (
        <div className="h-10">
          <canvas
            ref={sparklineRef}
            role="img"
            aria-label="Tendencia de recepciones por muelle"
          />
        </div>
      ) : null}
    </article>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: "pendiente" | "validado" | "incidencia";
  label: string;
}) {
  const tone: Tone =
    status === "validado"
      ? "positive"
      : status === "pendiente"
        ? "warning"
        : "negative";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}

export function CuadroDeMando({
  repository,
  today,
}: {
  repository: WarehouseRepository;
  today: string;
}) {
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [busy, setBusy] = useState(false);
  const sparklineRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    if (!shift) return;

    const maxDock = Math.max(7, ...shift.notes.map((note) => note.dock));
    const dockLabels = Array.from(
      { length: maxDock },
      (_, index) => `M${index + 1}`,
    );
    const dockCounts = dockLabels.map(
      (_, index) =>
        shift.notes.filter((note) => note.dock === index + 1).length,
    );
    const statusCounts = [
      shift.notes.filter((note) => note.status === "validado").length,
      shift.notes.filter((note) => note.status === "pendiente").length,
      shift.notes.filter((note) => note.status === "incidencia").length,
    ];
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const sparkline = new Chart(sparklineRef.current!, {
      type: "line",
      data: {
        labels: dockLabels,
        datasets: [
          {
            data: dockCounts,
            borderColor: "#d95d2b",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.35,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: reduceMotion ? false : undefined,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });

    const lineCanvas = lineRef.current!;
    const context = lineCanvas.getContext("2d");
    const gradient = context?.createLinearGradient(0, 0, 0, 256);
    gradient?.addColorStop(0, "rgba(217, 93, 43, 0.25)");
    gradient?.addColorStop(1, "rgba(217, 93, 43, 0)");

    const line = new Chart(lineCanvas, {
      type: "line",
      data: {
        labels: dockLabels,
        datasets: [
          {
            label: "Albaranes",
            data: dockCounts,
            borderColor: "#d95d2b",
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#d95d2b",
            pointHoverBorderColor: "#ffffff",
            pointHoverBorderWidth: 2,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: reduceMotion ? false : undefined,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `${item.formattedValue} albaranes`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#8a7d72" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#8a7d72", precision: 0 },
            grid: { color: "rgba(138, 125, 114, 0.15)" },
          },
        },
      },
    });

    const donut = new Chart(donutRef.current!, {
      type: "doughnut",
      data: {
        labels: ["Conforme", "En validación", "Incidencia"],
        datasets: [
          {
            data: statusCounts,
            backgroundColor: ["#2f4526", "#6b551b", "#832a17"],
            hoverBackgroundColor: ["#24351d", "#554414", "#6b2213"],
            borderColor: "transparent",
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: reduceMotion ? false : undefined,
        cutout: "70%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#8a7d72", boxWidth: 10, boxHeight: 10 },
          },
          tooltip: {
            callbacks: {
              label: (item) => `${item.label}: ${item.formattedValue}`,
            },
          },
        },
      },
    });

    return () => {
      sparkline.destroy();
      line.destroy();
      donut.destroy();
    };
  }, [shift]);

  if (!shift) {
    return <div className="empty-slot">Cargando el turno…</div>;
  }

  const summary = summarizeShift({ ...shift, today });
  const byMaterial = shrinkageByMaterial(shift.shrinkageEvents);
  const differences = shift.notes.flatMap((note) =>
    checkNote(note, "").lines.flatMap((entry) => {
      if (entry.status === "conforme") return [];
      const line = note.lines.find((candidate) => candidate.sku === entry.sku);
      return [
        {
          noteId: note.id,
          description: line?.description ?? entry.sku,
          delta: entry.delta,
        },
      ];
    }),
  );
  const recent = [...shift.notes]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 7);
  const dailyExpenses = shift.expenses.filter((entry) => entry.date === today);
  const dailyTotalEur = dailyExpenses.reduce(
    (sum, entry) => sum + entry.amountEur,
    0,
  );
  const inactiveMachines =
    summary.machinery.total - summary.machinery.operational;
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayIso = yesterday.toISOString().slice(0, 10);
  const yesterdayCount = shift.notes.filter(
    (note) => note.date === yesterdayIso,
  ).length;
  const receptionDelta = summary.receptionsToday - yesterdayCount;

  async function purge() {
    const confirmed = await confirmDestructive({
      title: "Purgar datos",
      text: "Se borrarán albaranes, mermas, maquinaria, residuos, gastos, fichajes y nóminas. Los miembros y sus accesos se conservan.",
      confirmText: "Purgar",
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await repository.purgeSeed();
      await refresh();
      toastSuccess("Datos purgados");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-balance text-lg font-semibold tracking-tight text-[var(--text)]">
            {dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {dashboard.subtitlePrefix} · Nave 3 · {formatLongDate(today)} ·{" "}
            {dashboard.subtitleSuffix}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-danger"
            disabled={busy}
            onClick={purge}
          >
            Purgar datos
          </button>
          <Link to="/reception" className="btn btn-primary">
            Ir a recepción
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={dashboard.kpis.receptions}
          value={formatCount(summary.receptionsToday)}
          note={`de ${formatCount(shift.notes.length)} albaranes`}
          badge={`${receptionDelta >= 0 ? "+" : ""}${formatCount(receptionDelta)} vs. ayer`}
          tone={receptionDelta >= 0 ? "positive" : "negative"}
          trend={receptionDelta >= 0 ? "up" : "down"}
          icon="reception"
          sparklineRef={sparklineRef}
        />
        <KpiCard
          label={dashboard.kpis.conformity}
          value={formatPct(summary.conformity.ratePct)}
          note={`${formatCount(summary.conformity.conformingLines)} de ${formatCount(summary.conformity.totalLines)} líneas`}
          badge={
            summary.conformity.ratePct >= 90
              ? "Dentro del objetivo"
              : "Revisar incidencias"
          }
          tone={summary.conformity.ratePct >= 90 ? "positive" : "warning"}
          icon="conformity"
        />
        <KpiCard
          label={dashboard.kpis.shrinkage}
          value={formatEur(summary.shrinkage.totalEur)}
          note={`${formatEur(summary.shrinkage.knownEur)} conocidas`}
          badge={`${formatEur(summary.shrinkage.unknownEur)} desconocidas`}
          tone={summary.shrinkage.unknownEur > 0 ? "warning" : "positive"}
          icon="shrinkage"
        />
        <KpiCard
          label={dashboard.kpis.machinery}
          value={`${formatCount(summary.machinery.operational)}/${formatCount(summary.machinery.total)}`}
          note="unidades en servicio"
          badge={`${formatCount(inactiveMachines)} fuera de servicio`}
          tone={inactiveMachines > 0 ? "negative" : "positive"}
          icon="machinery"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-[var(--text)]">
                {dashboard.charts.docksTitle}
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {dashboard.charts.docksSubtitle}
              </p>
            </div>
            <span className="rounded-sm border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--muted)]">
              Muelles 1–{Math.max(7, ...shift.notes.map((note) => note.dock))}
            </span>
          </div>
          <div className="mt-4 h-64">
            <canvas
              ref={lineRef}
              role="img"
              aria-label="Gráfico de albaranes agrupados por muelle"
            />
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-sm font-medium text-[var(--text)]">
              {dashboard.charts.statusTitle}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {dashboard.charts.statusSubtitle}
            </p>
            <div className="mt-4 h-56">
              <canvas
                ref={donutRef}
                role="img"
                aria-label="Gráfico de albaranes conformes, en validación y con incidencia"
              />
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-[var(--text)]">
                {dashboard.expensesTitle}
              </h2>
              <span className="text-xs text-[var(--muted)]">
                {formatCount(dailyExpenses.length)} conceptos
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {dashboard.expensesSubtitle}
            </p>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-[var(--text)]">
              {formatEur(dailyTotalEur)}
            </p>
            {dailyExpenses.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Sin gastos registrados.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {dailyExpenses.slice(0, 3).map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-baseline justify-between gap-3 text-xs text-[var(--muted)]"
                  >
                    <span className="min-w-0 truncate">{expense.concept}</span>
                    <span className="shrink-0 tabular-nums">
                      {formatEur(expense.amountEur)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-[var(--text)]">
            {dashboard.recentTitle}
          </h2>
          <span className="text-xs text-[var(--muted)]">
            {formatCount(shift.notes.length)} en el turno
          </span>
        </div>

        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Sin albaranes. Purgá los datos o registrá una recepción.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-[var(--border)] text-left text-sm">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-3 py-2 font-medium text-[var(--text)]"
                  >
                    Albarán
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-3 py-2 font-medium text-[var(--text)]"
                  >
                    Proveedor
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-3 py-2 font-medium text-[var(--text)]"
                  >
                    Transportista
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-3 py-2 font-medium text-[var(--text)]"
                  >
                    Líneas
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-3 py-2 font-medium text-[var(--text)]"
                  >
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recent.map((note) => (
                  <tr
                    key={note.id}
                    className="text-[var(--text)] transition-colors hover:bg-[var(--raised)] motion-reduce:transition-none"
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-medium">
                      {note.id}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-2">
                      {note.supplier}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2 text-[var(--muted)]">
                      {note.carrier}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {formatCount(note.lines.length)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <StatusPill
                        status={note.status}
                        label={
                          note.status === "validado"
                            ? "Conforme"
                            : note.status === "pendiente"
                              ? "En validación"
                              : "Incidencia"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
          <span>
            {formatCount(byMaterial.length)} materiales con merma ·{" "}
            {formatCount(differences.length)} diferencias abiertas
          </span>
          <Link
            to="/incidents"
            className="font-medium text-[var(--accent-ink)] underline-offset-2 hover:underline"
          >
            Ver incidencias
          </Link>
        </div>
      </section>
    </div>
  );
}
