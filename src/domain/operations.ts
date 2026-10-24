export type ExpenseCategory =
  "suministros" | "mantenimiento" | "residuos" | "maquinaria" | "servicios";

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  concept: string;
  amountEur: number;
}

export type WasteKind =
  "embalaje" | "plastico" | "madera" | "restos" | "quimicos";

export interface WasteRecord {
  id: string;
  date: string;
  kind: WasteKind;
  quantityKg: number;
  handler: string;
  certificateRef: string;
}

export interface CategoryTotal {
  category: ExpenseCategory;
  amountEur: number;
}

export function expenseTotalsByCategory(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const expense of expenses) {
    totals.set(
      expense.category,
      (totals.get(expense.category) ?? 0) + expense.amountEur,
    );
  }

  return [...totals.entries()]
    .map(([category, amountEur]) => ({ category, amountEur }))
    .sort((a, b) => b.amountEur - a.amountEur);
}

export function wasteTotalKg(records: WasteRecord[]): number {
  return records.reduce((sum, record) => sum + record.quantityKg, 0);
}
