import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Resultado, BotonCopiar, contarHuecos } from "../components/resultados/Renderers";
import { Fuentes } from "../components/Fuentes";
import { api, ORDEN, ETIQUETA_ESPECIALISTA } from "../lib/api";
import { Plus, Check, AlertTriangle, Pencil, Trash2 } from "lucide-react";

function elegir(resultados, esp) {
  const list = resultados.filter((r) => r.especialista === esp);
  if (list.length === 0) return null;
  const aprob = list.filter((r) => r.aprobado);
  const pool = aprob.length ? aprob : list;
  return pool.reduce((a, b) => (b.version >= a.version ? b : a));
}

/** Todo el contenido de un especialista como texto plano, para copiarlo entero. */
function aTexto(esp, d) {
  const trozos = [];
  const punto = (t, v) => v && trozos.push(`${t}\n${v}`);
  const lista = (t, v) => v?.length && trozos.push(`${t}\n${v.map((x) => `- ${x}`).join("\n")}`);
  if (esp === "cliente_ideal") {
    punto("PERFIL", d.perfil);
    punto("MOMENTO VITAL", d.momento_vital);
    (d.que_le_preocupa || []).forEach((p) => punto(p.titulo, `«${p.frase_textual}»`));
    lista("QUÉ LE FRENA", d.que_le_frena);
    lista("QUÉ LE HARÍA ACTUAR", d.que_le_haria_actuar);
    lista("DÓNDE ENCONTRARLE", d.donde_encontrarle);
  } else if (esp === "oferta") {
    punto(d.nombre_oferta || "OFERTA", d.promesa_principal);
    (d.que_incluye || []).forEach((i) => punto(i.titulo, i.descripcion));
    punto("GARANTÍA", d.eliminador_de_riesgo);
    punto("POR QUÉ ES CREÍBLE", d.por_que_es_creible);
  } else if (esp === "anuncios") {
    (d.anuncios || []).forEach((a, i) =>
      punto(`ANUNCIO ${i + 1} · ${a.angulo}`, [a.gancho, a.cuerpo, a.llamada_a_la_accion].filter(Boolean).join("\n\n"))
    );
  } else if (esp === "landing") {
    punto(d.hero?.titular || "", d.hero?.subtitular || "");
  }
  return trozos.join("\n\n");
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

  const piezas = useMemo(
    () => ORDEN.map((esp) => ({ esp, res: elegir(resultados, esp) })).filter((x) => x.res),
    [resultados]
  );
  const huecos = useMemo(
    () => piezas.reduce((n, { res }) => n + contarHuecos(res.contenido), 0),
    [piezas]
  );
  const todo = useMemo(
    () =>
      piezas
        .map(({ esp, res }) => `## ${ETIQUETA_ESPECIALISTA[esp].toUpperCase()}\n\n${aTexto(esp, res.contenido)}`)
        .join("\n\n\n"),
    [piezas]
  );

  const renombrar = async () => {
    const nombre = window.prompt("Nombre de la campaña", campana.nombre);
    if (!nombre || nombre === campana.nombre) return;
    const { data } = await api.patch(`/campanas/${campanaId}`, { nombre });
    setCampana(data);
  };

  const borrar = async () => {
    if (!window.confirm(`¿Borrar "${campana.nombre}"? Se borra con todo su contenido.`)) return;
    await api.delete(`/campanas/${campanaId}`);
    navigate("/campanas");
  };

  if (!campana) return <Layout><div style={{ color: "var(--texto-2)" }}>Cargando...</div></Layout>;

  // Índice pegajoso: el documento pasa de ocho mil píxeles y antes no había
  // forma de saber por dónde ibas ni de saltar a una sección.
  const indice = (
    <nav aria-label="Secciones de la campaña">
      <div className="antetitulo mb-3">En esta campaña</div>
      {piezas.map(({ esp, res }) => (
        <a key={esp} href={`#seccion-${esp}`}>
          <span className="block font-semibold">{ETIQUETA_ESPECIALISTA[esp]}</span>
          <span className="block text-[13px] truncate" style={{ opacity: 0.75 }}>
            {res.contenido.titulo_corto}
          </span>
        </a>
      ))}
    </nav>
  );

  return (
    <Layout ancho="max-w-[1040px]" lateralDerecho={indice}>
      <div className="text-[14px] mb-3" style={{ color: "var(--texto-2)" }}>
        <Link to="/campanas" className="hover:underline">Campañas</Link> / {campana.nombre}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div className="min-w-0">
          <div className="antetitulo mb-2 flex items-center gap-2">
            <Check size={15} color="#2C965D" /> TU CAMPAÑA
          </div>
          <h1 className="font-sora font-extrabold text-[30px] sm:text-[40px] leading-tight">{campana.nombre}</h1>
          <p className="text-[17px] mt-2" style={{ color: "var(--texto-2)" }}>
            Tu campaña de captación completa. Revisa los huecos y cópiala donde la necesites.
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

      <div className="flex flex-wrap items-center gap-2 mt-5">
        <BotonCopiar texto={todo} etiqueta="Copiar toda la campaña" />
        <button
          type="button"
          onClick={renombrar}
          data-testid="renombrar-campana"
          className="inline-flex items-center gap-1.5 rounded-[8px] border px-3 text-[13px] font-semibold"
          style={{ borderColor: "var(--borde)", color: "var(--texto-2)", minHeight: 36 }}
        >
          <Pencil size={15} /> Renombrar
        </button>
        <button
          type="button"
          onClick={borrar}
          data-testid="borrar-campana"
          className="inline-flex items-center gap-1.5 rounded-[8px] border px-3 text-[13px] font-semibold"
          style={{ borderColor: "var(--borde)", color: "var(--rojo)", minHeight: 36 }}
        >
          <Trash2 size={15} /> Borrar
        </button>
      </div>

      {huecos > 0 && (
        <div
          className="flex items-start gap-3 rounded-[12px] border p-4 mt-6"
          style={{ background: "#FDF6E3", borderColor: "#E0B94A" }}
          data-testid="aviso-huecos"
        >
          <AlertTriangle size={20} color="#8A6410" className="shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold" style={{ color: "#6B4E0C" }}>
              {huecos === 1 ? "Queda 1 dato por poner" : `Quedan ${huecos} datos por poner`} antes de publicar
            </div>
            <p className="text-[15px] mt-1" style={{ color: "#6B4E0C" }}>
              Los verás resaltados en amarillo. Son datos tuyos que el sistema no se inventa:
              resultados reales, cifras de tu zona o testimonios de tus clientes. Al copiar un
              texto se sustituyen por una línea en blanco.
            </p>
          </div>
        </div>
      )}

      <div className="mt-10 space-y-12">
        {piezas.map(({ esp, res }) => (
          <section key={esp} id={`seccion-${esp}`} data-testid={`seccion-${esp}`} className="scroll-mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="antetitulo">{ETIQUETA_ESPECIALISTA[esp].toUpperCase()}</div>
              {esp !== "landing" && <BotonCopiar texto={aTexto(esp, res.contenido)} />}
            </div>
            <h2 className="font-sora text-[22px] sm:text-[26px] font-bold mb-5">{res.contenido.titulo_corto}</h2>
            <Resultado especialista={esp} data={res.contenido} resultadoId={res.id} />
            <Fuentes fuentes={res.fuentes_usadas} />
          </section>
        ))}
      </div>
    </Layout>
  );
}
