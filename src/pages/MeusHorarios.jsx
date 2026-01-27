import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./MeusHorarios.css";

function MeusHorarios({ clienteLogado }) {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const telefone =
    clienteLogado?.cliente?.telefone || clienteLogado?.telefone;

  // ⏰ verifica se horário já passou (+1 min)
  const horarioExpirado = (data, hora) => {
    const agora = new Date();

    const [ano, mes, dia] = data.split("-");
    const [h, m] = hora.split(":");

    const dataHora = new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia),
      Number(h),
      Number(m),
      0
    );

    dataHora.setMinutes(dataHora.getMinutes() + 1);

    return agora > dataHora;
  };

  // 🔹 buscar horários e FILTRAR os antigos
  const buscarHorarios = useCallback(async () => {
    if (!telefone) {
      console.error("Telefone não encontrado");
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(
        `/api/horarios/meus_horarios/?telefone=${telefone}`
      );

      const lista = Array.isArray(res.data) ? res.data : [];

      // 🚀 REMOVE HORÁRIOS ANTIGOS AQUI
      const horariosValidos = lista.filter(
        (h) => !horarioExpirado(h.data, h.hora)
      );

      setHorarios(horariosValidos);
    } catch (err) {
      console.error("Erro ao buscar horários:", err);
    } finally {
      setLoading(false);
    }
  }, [telefone]);

  useEffect(() => {
    buscarHorarios();
  }, [buscarHorarios]);

  // ❌ desmarcar
  const desmarcarHorario = async (id) => {
    if (
      !window.confirm("Deseja realmente desmarcar este horário?")
    )
      return;

    try {
      await api.patch(`/api/horarios/${id}/cancelar/`);
      setHorarios((prev) =>
        prev.filter((h) => h.id !== id)
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao desmarcar horário.");
    }
  };

  // 🔁 remarcar
  const remarcarHorario = async (id) => {
    if (
      !window.confirm(
        "Deseja cancelar este horário e marcar outro?"
      )
    )
      return;

    try {
      await api.patch(`/api/horarios/${id}/cancelar/`);
      navigate("/agendar");
    } catch (err) {
      console.error(err);
      alert("Erro ao remarcar horário.");
    }
  };

  if (loading) {
    return (
      <div className="meus-horarios-container">
        <p>Carregando horários...</p>
      </div>
    );
  }

  return (
    <div className="meus-horarios-container">
      <h2>📅 Meus Horários</h2>

      {horarios.length === 0 ? (
        <p>Você não possui horários ativos.</p>
      ) : (
        horarios.map((h) => (
          <div className="horario-card" key={h.id}>
            <p>
              <strong>Data:</strong>{" "}
              {new Date(h.data).toLocaleDateString("pt-BR")}
              <br />
              <strong>Hora:</strong> {h.hora}
            </p>

            <div className="acoes">
              <button
                className="btn-danger"
                onClick={() => desmarcarHorario(h.id)}
              >
                ❌ Desmarcar
              </button>

              <button
                className="btn-primary"
                onClick={() => remarcarHorario(h.id)}
              >
                🔁 Marcar novo horário
              </button>
            </div>
          </div>
        ))
      )}

      <button
        className="btn-secondary"
        onClick={() => navigate("/")}
      >
        ⬅ Voltar
      </button>
    </div>
  );
}

export default MeusHorarios;
