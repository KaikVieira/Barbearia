import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login({ setClienteLogado }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const navigate = useNavigate();

  // 📞 remove tudo que não for número
  const normalizarTelefone = (tel) => tel.replace(/\D/g, "");

  const handleLogin = async () => {
    if (!nome || !telefone) {
      alert("Informe nome e telefone");
      return;
    }

    const telefoneLimpo = normalizarTelefone(telefone);

    if (telefoneLimpo.length < 10) {
      alert("Informe um telefone válido");
      return;
    }

    try {
      // 🔹 1. busca cliente pelo telefone
      const res = await api.get(
        `/api/clientes/por_telefone/?telefone=${telefoneLimpo}`
      );

      let cliente;

      if (res.data.existe) {
        // ✅ cliente já existe
        cliente = res.data.cliente;
      } else {
        // 🔹 cria cliente se não existir
        const novo = await api.post("/api/clientes/", {
          nome,
          telefone: telefoneLimpo,
        });

        cliente = novo.data;
      }

      // 🔐 salva sessão
      setClienteLogado(cliente);
      localStorage.setItem(
        "clienteLogado",
        JSON.stringify(cliente)
      );

      navigate("/");
    } catch (err) {
      console.error("Erro no login:", err);
      alert("Erro ao logar ou cadastrar cliente.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* 🔹 LOGO (vem da pasta public) */}
        <div className="login-logo">
          <img src="/logo.png" alt="Logo" />
        </div>

        <h2>Bem-vindo 👋</h2>
        <p>Entre com seu telefone</p>

        <input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="input-field"
        />

        <input
          type="text"
          placeholder="Telefone / WhatsApp"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="input-field"
        />

        <button
          className="btn-primary"
          onClick={handleLogin}
        >
          Entrar / Cadastrar
        </button>
      </div>
    </div>
  );
}

export default Login;
