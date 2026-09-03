import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { api } from "../lib/api";
import { Plus } from "lucide-react";

const ESTADO = { en_proceso: "En proceso", completada: "Completada" };

function fecha(iso) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default function Campanas() {
  const [campanas, setCampanas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/campanas").then((r) => setCampanas(r.data)).catch(() => {});
  }, []);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="antetitulo mb-2">TUS CAMPAÑAS</div>
          <h1 className="font-sora font-extrabold text-[40px] leading-tight">Campañas</h1>
        </div>
        <button
          onClick={() => navigate("/nueva/tipo")}
          data-testid="campanas-nueva"
          className="inline-flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-[8px]"
          style={{ background: "var(--azul)" }}
        >
          <Plus size={18} /> Nueva campaña
        </button>
      </div>

      {campanas.length === 0 ? (
        <p className="text-[17px]" style={{ color: "var(--texto-2)" }}>Todavía no has creado ninguna campaña.</p>
      ) : (
        <div className="space-y-3" data-testid="lista-campanas">
          {campanas.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(c.estado === "completada" ? `/campana/${c.id}` : `/asistente/${c.id}`)}
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
                {ESTADO[c.estado] || c.estado}
              </span>
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}
