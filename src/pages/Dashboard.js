import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 📅 DATA SELECIONADA
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split("T")[0]
  );

  const navigate = useNavigate();

  const diasSemana = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  const diaSemana =
    diasSemana[new Date(`${dataSelecionada}T00:00`).getDay()];

  // 🔄 BUSCAR HORÁRIOS (COM FILTRO DE CANCELADOS)
  const fetchHorarios = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/horarios/");

      const filtrados = res.data
        .filter(
          (h) =>
            h.data === dataSelecionada &&
            h.status !== "cancelado" // 🔥 REMOVE CANCELADOS
        )
        .sort((a, b) => a.senha - b.senha);

      setHorarios(filtrados);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar horários:", err);
      setError("Erro ao buscar horários");
    } finally {
      setLoading(false);
    }
  }, [dataSelecionada]);

  // ⏱️ AUTO ATUALIZA
  useEffect(() => {
    fetchHorarios();

    const interval = setInterval(fetchHorarios, 30000);
    return () => clearInterval(interval);
  }, [fetchHorarios]);

  // 🔎 STATUS VISUAL
  const getStatus = (horario) => {
    const agora = new Date();
    const dataHoraAgendada = new Date(
      `${horario.data}T${horario.hora}`
    );

    if (horario.status === "atendido") return "Atendido";
    if (dataHoraAgendada < agora) return "Encerrado";
    if (horario.cliente) return "Agendado";
    return "Disponível";
  };

  if (loading)
    return <p className="no-horarios">Carregando horários...</p>;

  if (error)
    return <p className="no-horarios error">{error}</p>;

  return (
    <div className="dashboard">
      <button className="btn-voltar" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      {/* 🔥 CABEÇALHO ORGANIZADO */}
      <div className="dashboard-header">
        <h1>
          Agenda — {diaSemana}, {dataSelecionada}
        </h1>

        <input
          type="date"
          className="input-data"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
        />
      </div>

      <table className="tabela-horarios">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Cliente</th>
            <th>Serviço</th>
            <th>Senha</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {horarios.length === 0 ? (
            <tr>
              <td colSpan="5" className="no-horarios">
                Nenhum horário para esta data.
              </td>
            </tr>
          ) : (
            horarios.map((h) => {
              const status = getStatus(h);
              const statusClass = `status-${status.toLowerCase()}`;

              return (
                <tr key={h.id} className={statusClass}>
                  <td>{h.hora}</td>
                  <td>{h.cliente ? h.cliente.nome : "—"}</td>
                  <td>
                    {h.servicos?.length
                      ? h.servicos.map((s) => s.nome).join(" + ")
                      : "—"}
                  </td>
                  <td>{h.senha}</td>
                  <td>{status}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
