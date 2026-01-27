// frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL:  "/api",  // IP do seu PC rodando Django
});

export default api;
