import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { api } from "../lib/api";
import { ArrowRight } from "lucide-react";

const TAMANOS = ["Solo yo", "2 a 5", "6 a 15", "Más de 15"];

export default function Inmobiliaria() {
  const { campanaId } = useParams();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [zona, setZona] = useState("");
  const [tamano, setTamano] = useState("");
  const [guardando, setGuardando] = useState(false);

  const valido = nombre.trim() && zona.trim() && tamano;

  const guardar = async () => {
    if (!valido || guardando) return;
    setGuardando(true);
    try {
      await api.post("/agencias", { nombre_agencia: nombre.trim(), zona: zona.trim(), tamano_equipo: tamano });
      navigate(`/asistente/${campanaId}`);
    } catch {
      setGuardando(false);
    }
  };

  const inputStyle = {
    borderColor: "var(--borde-campo)",
  };

  return (
    <Layout>
      <div className="max-w-[620px]">
        <div className="antetitulo mb-4">PASO 2 DE 3</div>
        <h1 className="font-sora font-extrabold text-[40px] leading-tight mb-3">Tu inmobiliaria</h1>
        <p className="text-[18px] mb-10" style={{ color: "var(--texto-2)" }}>
          Con estos datos los especialistas hablarán de tu zona y tu equipo, no en genérico.
        </p>

        <div className="space-y-7">
          <div>
            <label className="block font-semibold text-[16px] mb-2">¿Cómo se llama tu inmobiliaria?</label>
            <input
              data-testid="input-nombre-agencia"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-[8px] border px-4 py-3 text-[17px] outline-none focus:border-[#0B4DA8]"
              style={inputStyle}
              placeholder="Fincas Vega"
            />
          </div>

          <div>
            <label className="block font-semibold text-[16px] mb-1">¿En qué zona trabajas?</label>
            <p className="text-[14px] mb-2" style={{ color: "var(--texto-2)" }}>
              Ciudad y barrios o pueblos concretos.
            </p>
            <input
              data-testid="input-zona"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              className="w-full rounded-[8px] border px-4 py-3 text-[17px] outline-none focus:border-[#0B4DA8]"
              style={inputStyle}
              placeholder="Zaragoza — Delicias y Las Fuentes"
            />
          </div>

          <div>
            <label className="block font-semibold text-[16px] mb-2">¿Cuántos sois en la agencia?</label>
            <div className="grid grid-cols-4 gap-3">
              {TAMANOS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTamano(t)}
                  data-testid={`tamano-${t}`}
                  className="rounded-[8px] border px-3 py-3 text-[15px] font-medium transition-colors"
                  style={{
                    borderColor: tamano === t ? "var(--azul)" : "var(--borde-campo)",
                    background: tamano === t ? "var(--acento)" : "white",
                    color: tamano === t ? "var(--azul)" : "var(--texto)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={guardar}
          disabled={!valido || guardando}
          data-testid="guardar-inmobiliaria"
          className="inline-flex items-center gap-2.5 text-white text-[17px] font-semibold px-7 py-4 rounded-[8px] mt-10 transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          style={{ background: "var(--azul)" }}
        >
          {guardando ? "Guardando..." : "Continuar con los especialistas"} <ArrowRight size={20} />
        </button>
      </div>
    </Layout>
  );
}
