import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Resultado } from "../components/resultados/Renderers";
import { Fuentes } from "../components/Fuentes";
import { api, ORDEN, ETIQUETA_ESPECIALISTA } from "../lib/api";
import { Plus, Check } from "lucide-react";

function elegir(resultados, esp) {
  const list = resultados.filter((r) => r.especialista === esp);
  if (list.length === 0) return null;
  const aprob = list.filter((r) => r.aprobado);
  const pool = aprob.length ? aprob : list;
  return pool.reduce((a, b) => (b.version >= a.version ? b : a));
}

export default function Campana() {
  const { campanaId } = useParams();
  const navigate = useNavigate();
  const [campana, setCampana] = useState(null);
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/campanas/${campanaId}`),
      api.get(`/campanas/${campanaId}/resultados`),
    ]).then(([c, r]) => {
      setCampana(c.data);
      setResultados(r.data);
    });
  }, [campanaId]);

  if (!campana) return <Layout><div style={{ color: "var(--texto-2)" }}>Cargando...</div></Layout>;

  return (
    <Layout ancho="max-w-[980px]">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="antetitulo mb-2 flex items-center gap-2">
            <Check size={15} color="#2C965D" /> TU CAMPAÑA
          </div>
          <h1 className="font-sora font-extrabold text-[40px] leading-tight">{campana.nombre}</h1>
          <p className="text-[17px] mt-2" style={{ color: "var(--texto-2)" }}>
            Tu campaña de captación completa, lista para usar.
          </p>
        </div>
        <button
          onClick={() => navigate("/nueva/tipo")}
          data-testid="crear-otra-campana"
          className="inline-flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-[8px] shrink-0"
          style={{ background: "var(--azul)" }}
        >
          <Plus size={18} /> Crear otra campaña
        </button>
      </div>

      <div className="mt-10 space-y-12">
        {ORDEN.map((esp) => {
          const res = elegir(resultados, esp);
          if (!res) return null;
          return (
            <section key={esp} data-testid={`seccion-${esp}`}>
              <div className="antetitulo mb-1">{ETIQUETA_ESPECIALISTA[esp].toUpperCase()}</div>
              <h2 className="font-sora text-[26px] font-bold mb-5">{res.contenido.titulo_corto}</h2>
              <Resultado especialista={esp} data={res.contenido} resultadoId={res.id} />
              <Fuentes fuentes={res.fuentes_usadas} />
            </section>
          );
        })}
      </div>
    </Layout>
  );
}
