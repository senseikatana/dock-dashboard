import { useEffect, useState } from "react";

import type { WarehouseRepository } from "./repository";
import type { ShiftData } from "./repository";

export function useShift(
  repository: WarehouseRepository,
  today: string,
): ShiftData | null {
  const [shift, setShift] = useState<ShiftData | null>(null);

  useEffect(() => {
    let cancelled = false;
    repository.loadShift(today).then((data) => {
      if (!cancelled) setShift(data);
    });
    return () => {
      cancelled = true;
    };
  }, [repository, today]);

  return shift;
}
