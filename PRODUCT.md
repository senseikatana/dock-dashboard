# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a warehouse goods-reception and OLA back-office worker at a building-materials distribution company (the role comes from a real OBRAMAT job offer). Their day: goods-in against delivery notes (albaranes), quantity/quality checks, RF scanner and forklift (frontal/elevadora/retráctil) work, rotating shifts Monday–Sunday, plus back-office tasks: documentation, reports and dashboards, contractual follow-up, order tracking, machinery fleet, waste management and general expenses.

Secondary: the company's hiring managers. The product doubles as a portfolio demo offered to show process, cost and time improvements for that exact job.

## Product Purpose

One panel that replaces scattered spreadsheets for warehouse operations: goods reception with delivery notes, conformity and incidents, shrinkage (known vs unknown loss), machinery fleet, waste, general expenses, and a management dashboard. Success means two things at once: usable day-to-day in the role, and presentable as a demo that maps one-to-one onto the tasks named in the job offer.

## Positioning

The only tool that ties goods reception and delivery notes to shrinkage, machinery, waste and costs in a single warehouse panel with a management dashboard. Generic business template packs model sales and inventory; this models the warehouse data model itself (albarán → línea de recepción → conformidad → merma).

## Operating Context

Warehouse office during rotating shifts. Artifacts of the job: delivery notes from carriers, RF scanner reception, incident reports, machinery revision records, waste disposal certificates, expense sheets. The internal customer is the store and sales floor; the reporting line is the OLA manager. Today this work lives in Excel/Sheets.

## Capabilities and Constraints

- Modules: recepción de mercancía (albaranes), incidencias y mermas, maquinaria, residuos, gastos generales, cuadro de mando.
- Backend MUST be Firebase (`firebase` SDK + Firestore): the user explicitly rejected a backend-less demo. Stack on the scaffold: Vite + React + TypeScript + CSS custom-property tokens + Vitest + Playwright.
- All data is fictitious but realistic (building-materials trade vocabulary, plausible suppliers and carriers). No data from OBRAMAT or any real company. Totals must add up from the rows.
- UI language: Spanish (es-ES) — inferred from the job context, to confirm.
- Test-driven development is a working constraint: tests written first and watched fail (Vitest).
- Open decisions: deployment target, whether the Google Sheets companion template ships in the same effort. Authentication is decided: Firebase Auth (email/password) with role-based access (admin / responsable / operario).

## Brand Commitments

Product name: **Dock Dashboard**. Generic identity, deliberately not OBRAMAT's: no reproduction of third-party corporate identity, name or logo anywhere in the product.

## Evidence on Hand

The OBRAMAT job offer text (in session history) whose task list maps directly onto the modules. A pack of business spreadsheet templates on the external drive used to identify the data-model gaps. No customers, testimonials, usage metrics or case studies exist; none may be fabricated.

## Product Principles

1. The data model is the asset; screens and exports are interchangeable layers over it.
2. Every screen maps to a task named in the job offer, or it does not ship.
3. Sample data is believable and internally consistent; totals are computed from rows, never typed.
4. Built for daily ops use: scanability and speed over expression; a demo that impresses is a consequence, not the goal.
5. No fabricated proof anywhere in the product or its presentation.
