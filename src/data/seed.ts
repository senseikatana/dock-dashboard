import type {
  DeliveryNote,
  Machine,
  ReceptionLine,
  ShrinkageEvent,
} from "../domain/reception";
import type { Expense, WasteRecord } from "../domain/operations";

export interface SeedData {
  notes: DeliveryNote[];
  shrinkageEvents: ShrinkageEvent[];
  machines: Machine[];
  wasteRecords: WasteRecord[];
  expenses: Expense[];
}

const L = (
  sku: string,
  description: string,
  unit: string,
  qtyExpected: number,
  qtyReceived: number,
  location: string,
): ReceptionLine => ({
  sku,
  description,
  unit,
  qtyExpected,
  qtyReceived,
  location,
});

const N = (
  id: string,
  supplier: string,
  carrier: string,
  date: string,
  dock: number,
  status: DeliveryNote["status"],
  lines: ReceptionLine[],
): DeliveryNote => ({ id, supplier, carrier, date, dock, status, lines });

/**
 * Synthetic demonstration data — fabricated for the panel, no real company behind it.
 * Every headline figure the screens show is computed from these rows.
 * Dates are relative to the day the panel is opened so the shift always reads current.
 */
export function buildSeed(today: string): SeedData {
  const yesterday = shiftDate(today, -1);

  const notes: DeliveryNote[] = [
    N(
      "ALB-2026-0401",
      "Cementos del Norte",
      "Grúas Vega",
      yesterday,
      2,
      "validado",
      [
        L("CM-25", "Cemento gris CEM II 25 kg", "sacos", 240, 240, "02-B-07"),
        L("AR-12", "Árido gravilla 12 mm", "t", 12, 12, "02-B-09"),
      ],
    ),
    N(
      "ALB-2026-0402",
      "Ferretería Pisuerga",
      "Duero Logística",
      yesterday,
      4,
      "validado",
      [
        L("FP-CH10", "Taco y tornillo 8x100", "cajas", 40, 40, "01-A-09"),
        L("FP-08", "Fijación química 300 ml", "uds", 96, 96, "01-A-10"),
      ],
    ),
    N(
      "ALB-2026-0403",
      "Cerámicas del Ebro",
      "Transportes Ebro S.L.",
      today,
      1,
      "validado",
      [
        L(
          "CE-6060",
          "Pavimento porcelánico 60x60 Gris",
          "m²",
          480,
          480,
          "03-A-12",
        ),
        L("CE-LX25", "Listello decorado 2,5x60", "uds", 140, 140, "03-A-12"),
        L("CE-AD25", "Adhesivo C2TE 25 kg", "sacos", 96, 96, "03-A-13"),
      ],
    ),
    N(
      "ALB-2026-0404",
      "Pladur Ibérica",
      "FrigoTrans Norte",
      today,
      1,
      "validado",
      [
        L("PL-1200", "Placa de pladur 12 mm", "uds", 180, 180, "05-C-04"),
        L("PL-PE01", "Perfil metálico UA 48", "uds", 220, 220, "05-C-05"),
      ],
    ),
    N(
      "ALB-2026-0405",
      "Yesos Alcarria",
      "Duero Logística",
      today,
      2,
      "pendiente",
      [L("YE-25", "Yeso de proyección 25 kg", "sacos", 320, 320, "02-C-05")],
    ),
    N(
      "ALB-2026-0406",
      "Maderas Duero",
      "Duero Logística",
      today,
      2,
      "validado",
      [
        L("MA-2440", "Listón de pino 24x40", "uds", 600, 600, "06-A-01"),
        L("MA-2200", "Tablero contrachapado 22 mm", "uds", 90, 90, "06-A-02"),
      ],
    ),
    N(
      "ALB-2026-0407",
      "Aislamientos Vigo",
      "FrigoTrans Norte",
      today,
      3,
      "pendiente",
      [
        L("AU-50", "Lana de roca 50 mm", "m²", 540, 540, "04-D-02"),
        L("AU-XPS", "Aislante XPS 20 mm", "m²", 260, 260, "04-D-03"),
      ],
    ),
    N(
      "ALB-2026-0408",
      "Áridos Segura",
      "Transportes Ebro S.L.",
      today,
      3,
      "validado",
      [L("AR-12", "Árido gravilla 12 mm", "t", 18, 18, "01-D-03")],
    ),
    N(
      "ALB-2026-0409",
      "Pinturas Zadorra",
      "FrigoTrans Norte",
      today,
      4,
      "pendiente",
      [
        L("PI-15", "Pintura plástica blanca 15 L", "cubos", 60, 60, "07-A-08"),
        L("PI-AG03", "Barniz acrílico 3 L", "uds", 48, 48, "07-A-08"),
      ],
    ),
    N(
      "ALB-2026-0410",
      "Ferrallas Peñalver",
      "Grúas Vega",
      today,
      4,
      "validado",
      [
        L("FE-12", "Ferralla nervada 12 mm", "barras", 480, 480, "04-B-11"),
        L("FE-8A", "Malla electrosoldada 8 mm", "m²", 320, 320, "04-B-12"),
      ],
    ),
    N(
      "ALB-2026-0411",
      "Ferretería Pisuerga",
      "Duero Logística",
      today,
      5,
      "pendiente",
      [L("FP-CH10", "Taco y tornillo 8x100", "cajas", 55, 55, "01-A-09")],
    ),
    N(
      "ALB-2026-0412",
      "Cerámicas del Ebro",
      "Transportes Ebro S.L.",
      today,
      5,
      "pendiente",
      [
        L("CE-RP80", "Rodapié blanco 80 mm", "uds", 220, 214, "03-A-12"),
        L("CE-3333", "Pavimento gres 33x33 Rojo", "m²", 260, 260, "03-A-14"),
      ],
    ),
    N(
      "ALB-2026-0413",
      "Químicos Ebro",
      "Transportes Ebro S.L.",
      today,
      6,
      "pendiente",
      [
        L(
          "QU-ES22",
          "Espuma de poliuretano 750 ml",
          "uds",
          144,
          144,
          "07-B-02",
        ),
        L("QU-SI31", "Silicona neutra 310 ml", "uds", 210, 210, "07-B-03"),
      ],
    ),
    N(
      "ALB-2026-0414",
      "Cementos del Norte",
      "Grúas Vega",
      today,
      6,
      "incidencia",
      [
        L("CM-25", "Cemento gris CEM II 25 kg", "sacos", 300, 292, "02-B-07"),
        L("CM-425", "Cemento blanco 42,5 kg", "sacos", 120, 120, "02-B-08"),
      ],
    ),
    N(
      "ALB-2026-0415",
      "Pladur Ibérica",
      "FrigoTrans Norte",
      today,
      7,
      "pendiente",
      [
        L("PL-CU05", "Cinta de juntas 90 m", "uds", 130, 130, "05-C-06"),
        L("PL-1200", "Placa de pladur 12 mm", "uds", 120, 118, "05-C-04"),
      ],
    ),
    N(
      "ALB-2026-0416",
      "Maderas Duero",
      "Duero Logística",
      today,
      7,
      "pendiente",
      [
        L("MA-2440", "Listón de pino 24x40", "uds", 420, 420, "06-A-01"),
        L("MA-2200", "Tablero contrachapado 22 mm", "uds", 64, 64, "06-A-02"),
      ],
    ),
  ];

  const shrinkageEvents: ShrinkageEvent[] = [
    {
      id: "MER-01",
      albaranId: "ALB-2026-0403",
      kind: "rotura",
      material: "Cerámica y pavimento",
      costEur: 410,
      known: true,
    },
    {
      id: "MER-02",
      albaranId: "ALB-2026-0414",
      kind: "faltante",
      material: "Cemento y áridos",
      costEur: 295,
      known: true,
    },
    {
      id: "MER-03",
      albaranId: "ALB-2026-0412",
      kind: "faltante",
      material: "Madera y derivados",
      costEur: 155,
      known: true,
    },
    {
      id: "MER-04",
      albaranId: "ALB-2026-0416",
      kind: "desconocida",
      material: "Madera y derivados",
      costEur: 30,
      known: false,
    },
    {
      id: "MER-05",
      albaranId: "ALB-2026-0415",
      kind: "desconocida",
      material: "Pladur y aislamiento",
      costEur: 230,
      known: false,
    },
    {
      id: "MER-06",
      albaranId: "ALB-2026-0413",
      kind: "desconocida",
      material: "Químicos de obra",
      costEur: 120,
      known: false,
    },
  ];

  const machines: Machine[] = [
    { id: "FR-01", kind: "frontal", status: "operativa" },
    { id: "FR-02", kind: "frontal", status: "operativa" },
    { id: "EL-01", kind: "elevadora", status: "operativa" },
    { id: "EL-02", kind: "elevadora", status: "taller" },
    { id: "EL-03", kind: "elevadora", status: "operativa" },
    { id: "EL-04", kind: "elevadora", status: "operativa" },
    { id: "RT-01", kind: "retractil", status: "operativa" },
    { id: "RT-02", kind: "retractil", status: "operativa" },
    { id: "RT-03", kind: "retractil", status: "operativa" },
  ];

  const wasteRecords: WasteRecord[] = [
    {
      id: "RES-01",
      date: today,
      kind: "embalaje",
      quantityKg: 320,
      handler: "EcoGestión Ebro",
      certificateRef: "CERT-2026-114",
    },
    {
      id: "RES-02",
      date: today,
      kind: "madera",
      quantityKg: 180,
      handler: "EcoGestión Ebro",
      certificateRef: "CERT-2026-115",
    },
    {
      id: "RES-03",
      date: yesterday,
      kind: "plastico",
      quantityKg: 95,
      handler: "EcoGestión Ebro",
      certificateRef: "CERT-2026-109",
    },
    {
      id: "RES-04",
      date: yesterday,
      kind: "restos",
      quantityKg: 410,
      handler: "Residuos Vega S.L.",
      certificateRef: "CERT-2026-110",
    },
    {
      id: "RES-05",
      date: yesterday,
      kind: "quimicos",
      quantityKg: 42,
      handler: "Residuos Vega S.L.",
      certificateRef: "CERT-2026-111",
    },
    {
      id: "RES-06",
      date: yesterday,
      kind: "embalaje",
      quantityKg: 260,
      handler: "EcoGestión Ebro",
      certificateRef: "CERT-2026-112",
    },
  ];

  const expenses: Expense[] = [
    {
      id: "G-01",
      date: today,
      category: "mantenimiento",
      concept: "Revisión de la retráctil RT-02",
      amountEur: 180,
    },
    {
      id: "G-02",
      date: today,
      category: "residuos",
      concept: "Retirada de gestor autorizado",
      amountEur: 240,
    },
    {
      id: "G-03",
      date: today,
      category: "suministros",
      concept: "Estanterías para nave 3",
      amountEur: 615,
    },
    {
      id: "G-04",
      date: yesterday,
      category: "mantenimiento",
      concept: "Neumáticos del frontal FR-01",
      amountEur: 90,
    },
    {
      id: "G-05",
      date: yesterday,
      category: "maquinaria",
      concept: "Gasóleo de carretillas",
      amountEur: 320,
    },
    {
      id: "G-06",
      date: yesterday,
      category: "servicios",
      concept: "Limpieza de nave",
      amountEur: 260,
    },
    {
      id: "G-07",
      date: yesterday,
      category: "suministros",
      concept: "Material de señalización",
      amountEur: 145,
    },
    {
      id: "G-08",
      date: yesterday,
      category: "residuos",
      concept: "Contenedor de plástico",
      amountEur: 130,
    },
  ];

  return { notes, shrinkageEvents, machines, wasteRecords, expenses };
}

function shiftDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
