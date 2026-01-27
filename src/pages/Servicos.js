import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Servicos.css";

// Se preferir importar a logo:
// import logo from "../assets/logo.png";

function Servicos({ selecionados, setSelecionados }) {
  const navigate = useNavigate();

  const [servicos, setServicos] = useState([]);
  const [meusHorarios, setMeusHorarios] = useState([]);
  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // =====================================
  // 🔹 BUSCAR SERVIÇOS
  // =====================================
  useEffect(() => {
    const carregarServicos = async () => {
      try {
        const res = await api.get("/api/servicos/");
        setServicos(res.data);
      } catch (err) {
        console.error("Erro ao buscar serviços:", err);
        alert("Erro ao carregar serviços");
      }
    };

    carregarServicos();
  }, []);

  // =====================================
  // 🔹 FORMATAR PREÇO
  // =====================================
  const formatarPreco = (preco) =>
    Number(preco).toFixed(2).replace(".", ",");

  // =====================================
  // 🔹 SELECIONAR / DESELECIONAR
  // =====================================
  const toggleSelecionado = (servico) => {
    setSelecionados((prev) =>
      prev.some((s) => s.id === servico.id)
        ? prev.filter((s) => s.id !== servico.id)
        : [...prev, servico]
    );
  };

  // =====================================
  // 🔹 BUSCAR MEUS HORÁRIOS
  // =====================================
  const buscarMeusHorarios = async () => {
    setCarregando(true);

    try {
      const cliente = JSON.parse(
        localStorage.getItem("clienteLogado")
      );

      const telefone = cliente?.telefone;

      if (!telefone) {
        alert("Sessão inválida. Faça login novamente.");
        navigate("/login");
        return;
      }

      const res = await api.get(
        `/api/horarios/meus_horarios/?telefone=${telefone}`
      );

      setMeusHorarios(res.data);
      setMostrarHorarios(true);
    } catch (err) {
      console.error("Erro ao buscar horários:", err);
      alert(
        err.response?.data?.erro ||
          "Erro ao buscar seus horários"
      );
    } finally {
      setCarregando(false);
    }
  };

  // =====================================
  // 🔹 DESMARCAR HORÁRIO
  // =====================================
  const desmarcarHorario = async (id, remarcar = false) => {
    if (!window.confirm("Deseja realmente desmarcar este horário?"))
      return;

    try {
      await api.patch(`/api/horarios/${id}/cancelar/`);

      if (remarcar) {
        setMostrarHorarios(false);
        navigate("/agendar");
      } else {
        buscarMeusHorarios();
      }
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.erro ||
          "Erro ao desmarcar horário"
      );
    }
  };

  // =====================================
  // 🔹 CONTINUAR PARA AGENDAR
  // =====================================
  const handleIrAgendar = () => {
    if (selecionados.length === 0) {
      alert("Selecione pelo menos um serviço");
      return;
    }
    navigate("/agendar");
  };

  // =====================================
  // 🔹 RENDER
  // =====================================
  return (
    <div className="servicos-container">
      {/* 🔹 LOGO + TÍTULO */}
      <div className="titulo-servicos">
        <div className="logo-servicos">
          <img
            src="/logo.png"
            alt="Logo da barbearia"
          />
          {/* Se usar import:
          <img src={logo} alt="Logo da barbearia" />
          */}
        </div>

        <h2>
          {selecionados.length > 0
            ? "Serviços selecionados"
            : "Escolha os serviços"}
        </h2>
      </div>

      {/* 🔹 MEUS HORÁRIOS */}
      <button
        className="btn-secondary"
        onClick={buscarMeusHorarios}
        disabled={carregando}
      >
        📅 Meus Horários
      </button>

      {mostrarHorarios && (
        <div className="meus-horarios-box">
          <h3>📅 Meus Horários</h3>

          {meusHorarios.length === 0 ? (
            <p>Você não possui horários ativos.</p>
          ) : (
            meusHorarios.map((h) => (
              <div key={h.id} className="meu-horario-item">
                <p>
                  <strong>{h.data}</strong> às{" "}
                  <strong>{h.hora}</strong>
                </p>

                <div className="meu-horario-acoes">
                  <button
                    className="btn-danger"
                    onClick={() => desmarcarHorario(h.id)}
                  >
                    ❌ Desmarcar
                  </button>

                  <button
                    className="btn-primary"
                    onClick={() =>
                      desmarcarHorario(h.id, true)
                    }
                  >
                    🔁 Desmarcar e marcar novo
                  </button>
                </div>
              </div>
            ))
          )}

          <button
            className="btn-secondary"
            onClick={() => setMostrarHorarios(false)}
          >
            Fechar
          </button>
        </div>
      )}

      {/* 🔹 LISTA DE SERVIÇOS */}
      <div className="servicos-grid">
        {servicos.map((s) => (
          <div
            key={s.id}
            className={`servico-card ${
              selecionados.some((i) => i.id === s.id)
                ? "selecionado"
                : ""
            }`}
            onClick={() => toggleSelecionado(s)}
          >
            <h3>{s.nome}</h3>
            <p>Duração: {s.duracao_minutos} min</p>
            <p>Preço: R$ {formatarPreco(s.preco)}</p>
          </div>
        ))}
      </div>

      {/* 🔹 AÇÕES */}
      <div className="acoes-servicos">
        <button
          className="btn-secondary"
          onClick={() => navigate("/login")}
        >
          Voltar
        </button>

        {selecionados.length > 0 && (
          <button
            className="btn-primary"
            onClick={handleIrAgendar}
          >
            Continuar →
          </button>
        )}
      </div>
    </div>
  );
}

export default Servicos;
