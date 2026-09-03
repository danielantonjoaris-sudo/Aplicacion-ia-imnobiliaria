import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { api } from "../lib/api";
import { Home, Building2, Check } from "lucide-react";

export default function TipoCampana() {
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const elegirCaptacion = async () => {
    if (cargando) return;
    setCargando(true);
    try {
      const { data: campana } = await api.post("/campanas", { tipo: "captacion" });
      const { data: agencias } = await api.get("/agencias");
      if (agencias.length === 0) {
        navigate(`/nueva/inmobiliaria/${campana.id}`);
      } else {
        navigate(`/asistente/${campana.id}`);
      }
    } catch {
      setCargando(false);
    }
  };

  return (
    <Layout>
      <div className="antetitulo mb-4">PASO 1 DE 3</div>
      <h1 className="font-sora font-extrabold text-[40px] leading-tight mb-3">¿Qué quieres conseguir?</h1>
      <p className="text-[18px] mb-10" style={{ color: "var(--texto-2)" }}>
        Elige el tipo de campaña. Ahora mismo trabajamos la captación de propiedades.
      </p>

      <div className="grid grid-cols-2 gap-6 max-w-[880px]">
        {/* Captación */}
        <button
          onClick={elegirCaptacion}
          disabled={cargando}
          data-testid="tipo-captacion"
          className="text-left rounded-[12px] border-2 p-8 bg-white transition-transform hover:-translate-y-1"
          style={{ borderColor: "var(--azul)", boxShadow: "0 4px 12px rgba(19,32,50,0.06)" }}
        >
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-5"
            style={{ background: "var(--acento)" }}
          >
            <Home size={24} color="#0B4DA8" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[12px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: "var(--azul)", color: "white" }}
            >
              Recomendado
            </span>
          </div>
          <h2 className="font-sora text-[24px] font-bold mb-2 leading-tight">
            Quiero conseguir propiedades para vender
          </h2>
          <p className="text-[16px]" style={{ color: "var(--texto-2)" }}>
            Captación de propietarios en exclusiva. Construimos tu campaña completa.
          </p>
          <div className="mt-6 flex items-center gap-2 font-semibold" style={{ color: "var(--azul)" }}>
            <Check size={18} /> {cargando ? "Creando campaña..." : "Empezar aquí"}
          </div>
        </button>

        {/* Venta (deshabilitada) */}
        <div
          data-testid="tipo-venta-deshabilitado"
          className="text-left rounded-[12px] border p-8 relative"
          style={{ borderColor: "var(--borde)", background: "var(--suave)", opacity: 0.7 }}
        >
          <span
            className="absolute top-6 right-6 text-[12px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ background: "#E7ECF3", color: "var(--texto-2)" }}
          >
            Próximamente
          </span>
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-5"
            style={{ background: "#E7ECF3" }}
          >
            <Building2 size={24} color="#5E6A7B" />
          </div>
          <h2 className="font-sora text-[24px] font-bold mb-2 leading-tight" style={{ color: "var(--texto-2)" }}>
            Tengo un inmueble y quiero venderlo
          </h2>
          <p className="text-[16px]" style={{ color: "var(--texto-2)" }}>
            La campaña de venta de un inmueble concreto llegará muy pronto.
          </p>
        </div>
      </div>
    </Layout>
  );
}
