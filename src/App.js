import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Servicos from "./pages/Servicos";
import Agendar from "./pages/Agendar";
import Dashboard from "./pages/Dashboard";
import MeusHorarios from "./pages/MeusHorarios";

function App() {
  const [clienteLogado, setClienteLogado] = useState(null);
  const [selecionados, setSelecionados] = useState([]);

  // 🔹 restaura sessão
  useEffect(() => {
    const stored = localStorage.getItem("clienteLogado");
    if (stored) {
      setClienteLogado(JSON.parse(stored));
    }
  }, []);

  // 🔹 persiste sessão
  useEffect(() => {
    if (clienteLogado) {
      localStorage.setItem(
        "clienteLogado",
        JSON.stringify(clienteLogado)
      );
    } else {
      localStorage.removeItem("clienteLogado");
      setSelecionados([]);
    }
  }, [clienteLogado]);

  const RotaProtegida = ({ children }) => {
    if (!clienteLogado) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login setClienteLogado={setClienteLogado} />}
        />

        {/* SERVIÇOS */}
        <Route
          path="/"
          element={
            <RotaProtegida>
              <Servicos
                selecionados={selecionados}
                setSelecionados={setSelecionados}
              />
            </RotaProtegida>
          }
        />

        {/* AGENDAR */}
        <Route
          path="/agendar"
          element={
            <RotaProtegida>
              <Agendar
                clienteLogado={clienteLogado}
                selecionados={selecionados}
                setSelecionados={setSelecionados}
              />
            </RotaProtegida>
          }
        />

        {/* MEUS HORÁRIOS */}
        <Route
          path="/meus-horarios"
          element={
            <RotaProtegida>
              <MeusHorarios clienteLogado={clienteLogado} />
            </RotaProtegida>
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <RotaProtegida>
              <Dashboard />
            </RotaProtegida>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
