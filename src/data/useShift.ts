import { useCallback, useEffect, useState } from "react";

import { toastError } from "../ui/dialogs";
import type { ShiftData, WarehouseRepository } from "./repository";

export interface ShiftState {
  /** Datos cargados, o `null` mientras dura la carga inicial. */
  shift: ShiftData | null;
  /** Fallo de la carga inicial: la pantalla lo pinta en su hueco. */
  error: string | null;
  /**
   * Recarga tras una mutación. No toca `error` para no vaciar la vista que
   * el usuario acaba de modificar; un fallo se avisa por toast.
   */
  reload: () => Promise<void>;
}

const LOAD_ERROR =
  "No se pudieron cargar los datos de Firestore. Revisá la conexión y volvé a cargar la página.";
const RELOAD_ERROR = "No se pudieron actualizar los datos.";

/**
 * Carga del turno para las pantallas operativas.
 *
 * Antes cada pantalla repetía el mismo `useEffect` con `.then()` sin
 * `.catch()`: si la lectura fallaba, `shift` se quedaba en `null` y la
 * pantalla se colgaba en "Cargando el turno…" sin error ni reintento.
 */
export function useShift(
  repository: WarehouseRepository,
  today: string,
): ShiftState {
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    repository
      .loadShift(today)
      .then((data) => {
        if (!cancelled) {
          setShift(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError(LOAD_ERROR);
      });
    return () => {
      cancelled = true;
    };
  }, [repository, today]);

  const reload = useCallback(async () => {
    try {
      setShift(await repository.loadShift(today));
      setError(null);
    } catch {
      toastError(RELOAD_ERROR);
    }
  }, [repository, today]);

  return { shift, error, reload };
}
