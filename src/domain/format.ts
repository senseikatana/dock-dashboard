/**
 * Presentation figures — one formatter per metric family so every screen
 * prints the same fixed decimals, separators and signs (es-ES).
 */

const eurFormat = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

const pctFormat = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const countFormat = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 0,
  useGrouping: "always",
});

export function formatEur(value: number): string {
  return `${eurFormat.format(value)} €`;
}

export function formatPct(value: number): string {
  return `${pctFormat.format(value)} %`;
}

export function formatCount(value: number): string {
  return countFormat.format(value);
}

export function formatSignedEur(value: number): string {
  if (value < 0) {
    return formatEur(value);
  }
  return `+${formatEur(value)}`;
}

export function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
  }).format(new Date(`${isoDate}T00:00:00`));
}
