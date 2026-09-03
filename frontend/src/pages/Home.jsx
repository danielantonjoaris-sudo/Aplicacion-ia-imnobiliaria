import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { api } from "../lib/api";
import { ArrowRight } from "lucide-react";

const ESTADO_ETIQUETA = { en_proceso: "En proceso", completada: "Completada" };

function fecha(iso) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default function Home() {
  const [campanas, setCampanas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/campanas").then((r) => setCampanas(r.data)).catch(() => {});
  }, []);

  const irACampana = (c) => {
    navigate(c.estado === "completada" ? `/campana/${c.id}` : `/asistente/${c.id}`);
  };

  return (
    <Layout>
      <div className="max-w-[720px]">
        <div className="antetitulo mb-4">PLATAFORMA DE MARKETING PARA INMOBILIARIAS</div>
        <h1 className="font-sora font-extrabold leading-[1.05] text-[40px] sm:text-[48px] mb-6">
          Un equipo de especialistas de IA construye tu campaña de captación
        </h1>
        <p className="text-[18px] mb-8" style={{ color: "var(--texto-2)" }}>
          Contesta unas preguntas sencillas. Nuestros cuatro especialistas se encargan del cliente ideal,
          la oferta, los anuncios y la landing. Sin nada que configurar.
        </p>
        <button
          onClick={() => navigate("/nueva/tipo")}
          data-testid="home-crear-campana"
          className="inline-flex items-center gap-2.5 text-white text-[17px] font-semibold px-7 py-4 rounded-[8px] transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--azul)" }}
        >
          Crear campaña <ArrowRight size={20} />
        </button>
      </div>

      {campanas.length > 0 && (
        <div className="mt-16">
          <div className="antetitulo mb-3">TUS CAMPAÑAS</div>
          <h2 className="font-sora text-[26px] font-bold mb-5">Últimas campañas</h2>
          <div className="space-y-3" data-testid="lista-campanas">
            {campanas.map((c) => (
              <button
                key={c.id}
                onClick={() => irACampana(c)}
                data-testid={`campana-item-${c.id}`}
                className="w-full text-left flex items-center justify-between rounded-[12px] border px-6 py-5 bg-white transition-transform hover:-translate-y-0.5"
                style={{ borderColor: "var(--borde)", boxShadow: "0 4px 12px rgba(19,32,50,0.05)" }}
              >
                <div>
                  <div className="font-sora font-semibold text-[18px]">{c.nombre}</div>
                  <div className="text-[14px]" style={{ color: "var(--texto-2)" }}>{fecha(c.creado_en)}</div>
                </div>
                <span
                  className="text-[13px] font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: c.estado === "completada" ? "rgba(44,150,93,0.12)" : "var(--acento)",
                    color: c.estado === "completada" ? "var(--verde)" : "var(--azul)",
                  }}
                >
                  {ESTADO_ETIQUETA[c.estado] || c.estado}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
