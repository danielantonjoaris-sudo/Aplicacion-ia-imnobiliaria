import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { api, ETIQUETA_ESPECIALISTA } from "../lib/api";
import { Save, Check } from "lucide-react";

export default function Prompts() {
  const [prompts, setPrompts] = useState([]);
  const [borradores, setBorradores] = useState({});
  const [guardado, setGuardado] = useState(null);
  const [guardando, setGuardando] = useState(null);

  const cargar = () =>
    api.get("/prompts").then((r) => {
      setPrompts(r.data);
      const b = {};
      r.data.forEach((p) => (b[p.id] = p.contenido));
      setBorradores(b);
    });

  useEffect(() => { cargar(); }, []);

  const guardar = async (id) => {
    setGuardando(id);
    try {
      await api.put(`/prompts/${id}`, { contenido: borradores[id] });
      setGuardado(id);
      setTimeout(() => setGuardado(null), 2500);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <Layout ancho="max-w-[900px]">
      <div className="antetitulo mb-2">ADMINISTRACIÓN</div>
      <h1 className="font-sora font-extrabold text-[40px] leading-tight mb-3">Prompts de sistema</h1>
      <p className="text-[17px] mb-8" style={{ color: "var(--texto-2)" }}>
        Ajusta cómo trabaja cada especialista. Guarda el cambio y vuelve a lanzar el tramo (con «Rehacer») para ver el resultado cambiar.
      </p>

      <div className="space-y-6" data-testid="lista-prompts">
        {prompts.map((p) => (
          <div key={p.id} className="rounded-[12px] border p-6 bg-white" style={{ borderColor: "var(--borde)" }} data-testid={`prompt-${p.especialista}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-sora font-bold text-[20px]">{ETIQUETA_ESPECIALISTA[p.especialista] || p.especialista}</div>
                <div className="text-[13px]" style={{ color: "var(--texto-2)" }}>tipo de campaña: {p.tipo_campana}</div>
              </div>
              <button
                onClick={() => guardar(p.id)}
                disabled={guardando === p.id}
                data-testid={`guardar-prompt-${p.especialista}`}
                className="inline-flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-[8px] disabled:opacity-50"
                style={{ background: guardado === p.id ? "var(--verde)" : "var(--azul)" }}
              >
                {guardado === p.id ? <><Check size={17} /> Guardado</> : <><Save size={17} /> {guardando === p.id ? "Guardando..." : "Guardar"}</>}
              </button>
            </div>
            <textarea
              data-testid={`prompt-textarea-${p.especialista}`}
              rows={10}
              value={borradores[p.id] || ""}
              onChange={(e) => setBorradores({ ...borradores, [p.id]: e.target.value })}
              className="w-full rounded-[8px] border px-4 py-3 text-[15px] font-mono leading-relaxed outline-none focus:border-[#0B4DA8]"
              style={{ borderColor: "var(--borde-campo)" }}
            />
          </div>
        ))}
      </div>
    </Layout>
  );
}
