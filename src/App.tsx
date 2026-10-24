import { useMemo } from "react";
import { Route, Routes } from "react-router-dom";

import { Shell } from "./components/Shell";
import { FirebaseWarehouseRepository } from "./data/firebaseRepository";
import { CuadroDeMando } from "./screens/CuadroDeMando";
import { Gastos } from "./screens/Gastos";
import { Incidencias } from "./screens/Incidencias";
import { Maquinaria } from "./screens/Maquinaria";
import { Recepcion } from "./screens/Recepcion";
import { Residuos } from "./screens/Residuos";

const today = new Date().toISOString().slice(0, 10);

export function App() {
  const repository = useMemo(() => new FirebaseWarehouseRepository(), []);

  return (
    <Shell freshness="Datos del turno · 13:52">
      <Routes>
        <Route
          path="/"
          element={<Recepcion repository={repository} today={today} />}
        />
        <Route
          path="/cuadro-de-mando"
          element={<CuadroDeMando repository={repository} today={today} />}
        />
        <Route
          path="/incidencias"
          element={<Incidencias repository={repository} today={today} />}
        />
        <Route
          path="/maquinaria"
          element={<Maquinaria repository={repository} today={today} />}
        />
        <Route
          path="/residuos"
          element={<Residuos repository={repository} today={today} />}
        />
        <Route
          path="/gastos"
          element={<Gastos repository={repository} today={today} />}
        />
      </Routes>
    </Shell>
  );
}
