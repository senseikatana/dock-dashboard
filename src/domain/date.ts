/**
 * Fechas civiles (año-mes-día) según el calendario LOCAL.
 *
 * `new Date().toISOString().slice(0, 10)` corta en UTC: entre las 00:00 y
 * las 01:00/02:00 de España devuelve el día ANTERIOR. Con turno "noche" eso
 * mete un fichaje o una recepción en el día equivocado.
 *
 * Para instantes (hora de entrada/salida) se sigue usando `toISOString()`;
 * solo el campo `date` —que representa un día de calendario— debe usar
 * `localDateIso`.
 */

export function localDateIso(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
