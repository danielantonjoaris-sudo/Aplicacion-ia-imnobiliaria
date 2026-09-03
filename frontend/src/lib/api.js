import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const ORDEN = ["cliente_ideal", "oferta", "anuncios", "landing"];
export const ETIQUETA_ESPECIALISTA = {
  cliente_ideal: "Cliente Ideal",
  oferta: "Oferta",
  anuncios: "Anuncios",
  landing: "Landing",
};
