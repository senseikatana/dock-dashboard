---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface: Panel OLA — Recepción

## Scope and mode

The working panel app (routes: Cuadro de mando, Recepción, Incidencias y mermas, Maquinaria, Residuos, Gastos). Visitor mode: Operate — the worker gets the shift's job done.

## Audience, job, action

Goods-reception and OLA back-office worker on rotating shifts at a building-materials warehouse. Job: validate incoming delivery notes (albaranes) fast, catch quantity/quality mismatches, log incidents and shrinkage (known vs unknown), keep machinery, waste and general expenses under control. Main task one click from any screen: "Registrar recepción". Reporting line: OLA manager; internal customer: the sales floor.

## Proof and content

Realistic fictitious data only (suppliers, carriers, bultos, ubicaciones 03-A-12 style), totals computed from rows, dates in order, units on every figure. No real company data, no invented claims, no fabricated proof.

## Constraints

Spanish UI (es-ES). InsForge backend (@insforge/sdk), TDD on domain logic. Standard web controls; the world enters only through type, palette, density and the signature move. App-screen house rules (design-taste app-screens) and Operate mode rules (impeccable) both bind; where they conflict, the stricter wins.

## Chosen direction

"Materia de obra" — the roll's assignment, locked by the user on the decision page: kraft sack paper, brick courses (tongadas), ceramic tile module. Raised into it from declined challengers: the conformity stamp as state anchor (CONFORME / NO CONFORME), code and physical position as one navigation (row → ubicación), the tile-module grid as the visible armature of dense tables.

## Memorable moment

La tongada: table rows laid in brick courses across the ceramic module grid, and the CONFORME stamp landing on a validated albarán line.

## Unresolved decisions

Auth model (InsForge auth vs single demo user); deployment target; whether the Google Sheets companion template ships in the same effort.

## Direction contract

THESIS: The panel reads as the material it handles — rows laid like brick courses on a ceramic module grid, the albarán closed with a stamp — refusing the neutral card kit where every block floats on grey behind an icon in a tinted square.

OWN-WORLD: A cement-paper frame (#E8E4DC) holding one white work sheet; warm ink #2A2320; signal orange #D95D2B as the only chroma — on the mark, the single primary action and the main data series; status pairs olive, amber and rust on pale tints; Archivo for text, Barlow Condensed for every figure and code.

STORY: The worker reads the shift in one screen — what arrived, what is stuck, what it costs — trusts the figures because they sum from the rows, and validates a reception without leaving the screen.

FIRST VIEWPORT: Sidebar in the frame (mark, six modules, shift card); on the sheet a title row with the one primary action right-aligned, then a four-cell KPI strip split by hairlines, then the albaranes table as the largest block with the merma rail (conocidas vs desconocidas) at 286px beside it. The stamp sits on validated rows.

FORM: "Materia de obra", candidate 6 of 7 in my resonance order, taken as the roll's assignment and locked by the user; seed:375f0744584f4090.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
