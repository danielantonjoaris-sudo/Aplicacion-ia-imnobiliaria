import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ListaCampanas } from "../components/ListaCampanas";
import { api } from "../lib/api";
import { ArrowRight, Plus } from "lucide-react";

export default function Home() {
  const [campanas, setCampanas] = useState([]);
  const [cargado, setCargado] = useState(false);
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    api
      .get("/campanas")
      .then((r) => setCampanas(r.data))
      .catch(() => {})
      .finally(() => setCargado(true));
  }, []);

  useEffect(cargar, [cargar]);

  // A quien ya tiene campañas no se le vende el producto que ya usa cada vez
  // que entra: se le pone delante su trabajo. La presentación es para quien
  // llega por primera vez.
  const primeraVez = cargado && campanas.length === 0;

  return (
    <Layout>
      {primeraVez ? (
        <div className="max-w-[720px]">
          <div className="antetitulo mb-4">PLATAFORMA DE MARKETING PARA INMOBILIARIAS</div>
          <h1 className="font-sora font-extrabold leading-[1.05] text-[32px] sm:text-[48px] mb-6">
            Un equipo de especialistas de IA construye tu campaña de captación
          </h1>
          <p className="text-[18px] mb-8" style={{ color: "var(--texto-2)" }}>
            Contesta unas preguntas sencillas. Nuestros cuatro especialistas se encargan del cliente
            ideal, la oferta, los anuncios y la landing. Sin nada que configurar.
          </p>
          <button
            onClick={() => navigate("/nueva/tipo")}
            data-testid="home-crear-campana"
            className="inline-flex items-center gap-2.5 text-white text-[17px] font-semibold px-7 py-4 rounded-[8px] transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--azul)" }}
          >
            Crear mi primera campaña <ArrowRight size={20} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <div className="antetitulo mb-2">TUS CAMPAÑAS</div>
              <h1 className="font-sora font-extrabold text-[30px] sm:text-[40px] leading-tight">
                Últimas campañas
              </h1>
            </div>
            <button
              onClick={() => navigate("/nueva/tipo")}
              data-testid="home-crear-campana"
              className="inline-flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-[8px]"
              style={{ background: "var(--azul)" }}
            >
              <Plus size={18} /> Nueva campaña
            </button>
          </div>
          {!cargado ? (
            <p className="text-[17px]" style={{ color: "var(--texto-2)" }}>Cargando...</p>
          ) : (
            <ListaCampanas campanas={campanas} onCambio={cargar} />
          )}
        </>
      )}
    </Layout>
  );
}
