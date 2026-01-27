import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import JunoCalendar from "./JunoCalendar";
import "./Agendar.css";

function Agendar({ clienteLogado, selecionados }) {
  const navigate = useNavigate();

  const [horarios, setHorarios] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [diaFechado, setDiaFechado] = useState(false);
  const [agendamentoConcluido, setAgendamentoConcluido] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔐 Proteção de rota
  useEffect(() => {
    if (!clienteLogado || !selecionados || selecionados.length === 0) {
      navigate("/");
    }
  }, [clienteLogado, selecionados, navigate]);

  // 📅 Buscar horários disponíveis
  useEffect(() => {
    if (!selecionados?.length) return;

    const buscarHorarios = async () => {
      try {
        setLoading(true);

        const duracaoTotal =
          selecionados.reduce((acc, s) => acc + s.duracao_minutos, 0) +
          (selecionados.length - 1) * 15;

        const res = await api.get(
          `/api/horarios/disponiveis/?data=${dataSelecionada}&duracao=${duracaoTotal}`
        );

        if (res.data.fechado) {
          setDiaFechado(true);
          setHorarios([]);
          return;
        }

        setDiaFechado(false);

        const agora = new Date();

        const lista = (res.data.horarios_disponiveis || []).map((hora) => {
          const dataHora = new Date(`${dataSelecionada}T${hora}`);
          return {
            hora,
            indisponivel: dataHora <= agora,
          };
        });

        setHorarios(lista);
        setHorarioSelecionado("");
      } catch (err) {
        console.error("Erro ao buscar horários:", err);
        alert("Erro ao buscar horários disponíveis.");
      } finally {
        setLoading(false);
      }
    };

    buscarHorarios();
  }, [dataSelecionada, selecionados]);

  // ✅ CONFIRMAR AGENDAMENTO
  const handleAgendar = async () => {
    if (!horarioSelecionado) {
      alert("Escolha um horário.");
      return;
    }

    const telefone = clienteLogado?.telefone;

    if (!telefone) {
      alert("Telefone do cliente não encontrado.");
      return;
    }

    const payload = {
      data: dataSelecionada,
      hora: horarioSelecionado,
      telefone: String(telefone),
      servicos_id: selecionados.map((s) => s.id),
    };

    try {
      await api.post("/api/horarios/agendar/", payload);
      setAgendamentoConcluido(true);
    } catch (err) {
      console.error("Erro ao agendar:", err.response?.data || err);
      alert(
        err.response?.data?.erro ||
          "Erro ao agendar. Tente outro horário."
      );
    }
  };

  const formatarData = (dataISO) => {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="agendar-container">
      <div className="agendar-card">
        <div className="agendar-left">
          {/* LOGO vinda da pasta PUBLIC */}
          <div className="agendar-logo">
            <img src="/logo.png" alt="Logo" />
          </div>

          <p>
            Olá, <strong>{clienteLogado?.nome}</strong>
          </p>

          <label>Escolha a data:</label>
          <JunoCalendar
            dataSelecionada={dataSelecionada}
            setDataSelecionada={setDataSelecionada}
          />

          <button
            className="btn-secondary"
            onClick={() => navigate("/")}
          >
            ⬅ Voltar para Serviços
          </button>

          <button
            className="btn-dashboard"
            onClick={() => navigate("/dashboard")}
            style={{ marginTop: "10px" }}
          >
            📊 Ver Dashboard
          </button>
        </div>

        <div className="agendar-right">
          {agendamentoConcluido ? (
            <div className="agendamento-concluido">
              <h3>✅ Agendamento Concluído!</h3>
              <p>
                {formatarData(dataSelecionada)} às{" "}
                <strong>{horarioSelecionado}</strong>
              </p>
            </div>
          ) : diaFechado ? (
            <div className="dia-fechado-message">
              <h3>📅 Dia Fechado</h3>
              <p>Não há horários disponíveis.</p>
            </div>
          ) : (
            <>
              <h3>
                Horários disponíveis — {formatarData(dataSelecionada)}
              </h3>

              {loading ? (
                <p>Carregando horários...</p>
              ) : (
                <div className="horarios-grid">
                  {horarios.length === 0 ? (
                    <p>Nenhum horário disponível</p>
                  ) : (
                    horarios.map((h) => (
                      <button
                        key={h.hora}
                        disabled={h.indisponivel}
                        onClick={() => setHorarioSelecionado(h.hora)}
                        className={`hora-btn ${
                          horarioSelecionado === h.hora
                            ? "selecionado"
                            : ""
                        }`}
                      >
                        {h.hora}
                      </button>
                    ))
                  )}
                </div>
              )}

              <button
                className="btn-confirmar"
                onClick={handleAgendar}
                disabled={!horarioSelecionado}
              >
                Confirmar Agendamento
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Agendar;
