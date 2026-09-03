import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Cuestionario } from "../components/Cuestionario";
import { Trabajando } from "../components/Trabajando";
import { Resultado } from "../components/resultados/Renderers";
import { Fuentes } from "../components/Fuentes";
import { Modal } from "../components/Modal";
import { api, ORDEN, ETIQUETA_ESPECIALISTA } from "../lib/api";
import { Check, RefreshCw, Maximize2, AlertTriangle, Sparkles, FilePlus2 } from "lucide-react";

const PUEDE_REUTILIZAR = { cliente_ideal: true, oferta: true, anuncios: false, landing: false };

function latestPorEspecialista(resultados, esp) {
  const list = resultados.filter((r) => r.especialista === esp);
  if (list.length === 0) return null;
  return list.reduce((a, b) => (b.version >= a.version ? b : a));
}

export default function Asistente() {
  const { campanaId } = useParams();
  const navigate = useNavigate();

  const [campana, setCampana] = useState(null);
  const [agencia, setAgencia] = useState({});
  const [resultados, setResultados] = useState([]);
  const [guardados, setGuardados] = useState([]);
  const [vista, setVista] = useState("carga"); // carga|reuse|form|working|result|error
  const [reuseDismissed, setReuseDismissed] = useState(false);
  const [ultimasRespuestas, setUltimasRespuestas] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [verCompleto, setVerCompleto] = useState(false);
  const [aprobando, setAprobando] = useState(false);

  const paso = campana?.paso_actual || 1;
  const especialista = ORDEN[paso - 1];
  const resultActual = especialista ? latestPorEspecialista(resultados, especialista) : null;

  const cargar = useCallback(async () => {
    const [c, r] = await Promise.all([
      api.get(`/campanas/${campanaId}`),
      api.get(`/campanas/${campanaId}/resultados`),
    ]);
    setCampana(c.data);
    setResultados(r.data);
    if (c.data.agencia_id) {
      const ags = await api.get("/agencias");
      setAgencia(ags.data[0] || {});
    }
    return c.data;
  }, [campanaId]);

  useEffect(() => {
    cargar().then((c) => {
      if (c.estado === "completada") navigate(`/campana/${c.id}`);
    });
  }, [cargar, navigate]);

  // Cargar guardados del especialista actual (para reutilizar).
  useEffect(() => {
    if (!especialista) return;
    if (PUEDE_REUTILIZAR[especialista]) {
      api
        .get(`/especialistas/${especialista}/guardados`, { params: { campana_id: campanaId } })
        .then((r) => setGuardados(r.data))
        .catch(() => setGuardados([]));
    } else {
      setGuardados([]);
    }
    setReuseDismissed(false);
    setVerCompleto(false);
  }, [especialista, campanaId]);

  // Determinar la vista cuando no estamos en un estado transitorio.
  useEffect(() => {
    if (!campana) return;
    if (vista === "working" || vista === "error") return;
    const res = latestPorEspecialista(resultados, especialista);
    if (res) setVista("result");
    else if (PUEDE_REUTILIZAR[especialista] && guardados.length > 0 && !reuseDismissed) setVista("reuse");
    else setVista("form");
    // eslint-disable-next-line
  }, [campana, resultados, especialista, guardados, reuseDismissed]);

  const ejecutar = async (respuestas) => {
    setUltimasRespuestas(respuestas);
    setVista("working");
    setErrorMsg("");
    try {
      await api.post(`/especialistas/${especialista}/${campanaId}`, { respuestas });
      await cargar();
      setVista("result");
    } catch (e) {
      setErrorMsg(e?.response?.data?.detail || "No se pudo generar el resultado. Inténtalo de nuevo.");
      setVista("error");
    }
  };

  const rehacer = () => {
    if (ultimasRespuestas) ejecutar(ultimasRespuestas);
    else setVista("form");
  };

  const aprobar = async () => {
    if (!resultActual || aprobando) return;
    setAprobando(true);
    try {
      await api.post(`/resultados/${resultActual.id}/aprobar`);
      const c = await cargar();
      setAprobando(false);
      if (especialista === "landing") {
        navigate(`/campana/${c.id}`);
      }
    } catch {
      setAprobando(false);
    }
  };

  const usarGuardado = async (id) => {
    setVista("working");
    try {
      await api.post(`/campanas/${campanaId}/usar-guardado`, { resultado_id: id });
      await cargar();
      setVista("form"); // avanza al siguiente tramo
    } catch {
      setVista("form");
    }
  };

  // ---- Columna izquierda: progreso ----
  const ColumnaProgreso = () => (
    <div
      className="w-[300px] shrink-0 border-r px-7 py-8 flex flex-col"
      style={{ background: "var(--suave)", borderColor: "var(--borde)" }}
    >
      <div className="antetitulo mb-1">TU CAMPAÑA</div>
      <h2 className="font-sora text-[20px] font-bold mb-8">Los especialistas</h2>
      <div className="space-y-2">
        {ORDEN.map((esp, i) => {
          const num = i + 1;
          let estado = "pendiente";
          if (num < paso) estado = "terminado";
          else if (num === paso) estado = vista === "working" ? "trabajando" : "en_curso";
          const activo = estado === "en_curso" || estado === "trabajando";
          return (
            <div
              key={esp}
              data-testid={`progreso-${esp}-${estado}`}
              className="flex items-center gap-3 px-3 py-3 rounded-[8px] transition-colors"
              style={{ background: activo ? "var(--acento)" : "transparent" }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0 ${
                  estado === "trabajando" ? "pulso" : ""
                }`}
                style={{
                  background:
                    estado === "terminado" ? "var(--verde)" : activo ? "var(--azul)" : "#E1E8F1",
                  color: estado === "terminado" || activo ? "white" : "var(--texto-2)",
                }}
              >
                {estado === "terminado" ? <Check size={17} /> : num}
              </div>
              <div>
                <div
                  className="text-[16px]"
                  style={{
                    color: estado === "pendiente" ? "var(--texto-2)" : "var(--texto)",
                    fontWeight: activo ? 700 : 500,
                  }}
                >
                  {ETIQUETA_ESPECIALISTA[esp]}
                </div>
                {estado === "trabajando" && (
                  <div className="text-[12px]" style={{ color: "var(--azul)" }}>Trabajando...</div>
                )}
                {estado === "en_curso" && (
                  <div className="text-[12px]" style={{ color: "var(--azul)" }}>En curso</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const cabeceraResultado = () => {
    const c = resultActual?.contenido || {};
    return c.titulo_corto || ETIQUETA_ESPECIALISTA[especialista];
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="ml-[264px] flex-1 flex overflow-hidden">
        <ColumnaProgreso />

        {/* Columna derecha */}
        <div className="flex-1 px-12 py-10 overflow-hidden flex flex-col" data-testid="asistente-panel">
          {vista === "carga" && (
            <div className="text-[17px]" style={{ color: "var(--texto-2)" }}>Cargando...</div>
          )}

          {vista === "reuse" && (
            <div className="max-w-[720px] aparecer">
              <div className="antetitulo mb-2">ESPECIALISTA EN {ETIQUETA_ESPECIALISTA[especialista].toUpperCase()}</div>
              <h2 className="font-sora text-[28px] font-bold mb-2">Ya tienes trabajo guardado</h2>
              <p className="text-[17px] mb-7" style={{ color: "var(--texto-2)" }}>
                Puedes reutilizar un {ETIQUETA_ESPECIALISTA[especialista].toLowerCase()} de otra campaña o crear uno nuevo.
              </p>
              <div className="space-y-3 mb-6">
                {guardados.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => usarGuardado(g.id)}
                    data-testid={`reutilizar-${g.id}`}
                    className="w-full text-left flex items-center justify-between rounded-[12px] border px-6 py-4 bg-white transition-transform hover:-translate-y-0.5"
                    style={{ borderColor: "var(--borde)" }}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles size={18} color="#0B4DA8" />
                      <span className="font-sora font-semibold text-[17px]">{g.titulo_corto}</span>
                    </div>
                    <span className="text-[14px] font-semibold" style={{ color: "var(--azul)" }}>Usar este</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setReuseDismissed(true)}
                data-testid="crear-nuevo"
                className="inline-flex items-center gap-2.5 font-semibold text-[16px] px-6 py-3.5 rounded-[8px] border transition-colors"
                style={{ borderColor: "var(--azul)", color: "var(--azul)" }}
              >
                <FilePlus2 size={19} /> Crear uno nuevo
              </button>
            </div>
          )}

          {vista === "form" && <Cuestionario especialista={especialista} onSubmit={ejecutar} />}

          {vista === "working" && (
            <div className="flex-1">
              <Trabajando especialista={especialista} zona={agencia?.zona} />
            </div>
          )}

          {vista === "error" && (
            <div className="max-w-[560px] aparecer">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={26} color="#D73337" />
                <h2 className="font-sora text-[26px] font-bold" style={{ color: "var(--rojo)" }}>Algo ha fallado</h2>
              </div>
              <p className="text-[17px] mb-6">{errorMsg}</p>
              <button
                onClick={() => (ultimasRespuestas ? ejecutar(ultimasRespuestas) : setVista("form"))}
                data-testid="reintentar"
                className="inline-flex items-center gap-2.5 text-white font-semibold px-6 py-3.5 rounded-[8px]"
                style={{ background: "var(--azul)" }}
              >
                <RefreshCw size={19} /> Reintentar
              </button>
            </div>
          )}

          {vista === "result" && resultActual && (
            <div className="flex flex-col h-full aparecer">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="antetitulo mb-1">ESPECIALISTA EN {ETIQUETA_ESPECIALISTA[especialista].toUpperCase()}</div>
                  <h2 className="font-sora text-[30px] font-bold leading-tight" data-testid="resultado-titulo">
                    {cabeceraResultado()}
                  </h2>
                  <div className="text-[13px] mt-1" style={{ color: "var(--texto-2)" }}>Versión {resultActual.version}</div>
                </div>
                <button
                  onClick={() => setVerCompleto(true)}
                  data-testid="ver-completo"
                  className="inline-flex items-center gap-2 text-[15px] font-semibold px-4 py-2.5 rounded-[8px] border shrink-0"
                  style={{ borderColor: "var(--borde)", color: "var(--azul)" }}
                >
                  <Maximize2 size={17} /> Ver completo
                </button>
              </div>

              <div className="flex-1 overflow-hidden" data-testid="resultado-contenido">
                <Resultado especialista={especialista} data={resultActual.contenido} resultadoId={resultActual.id} compact />
              </div>

              <Fuentes fuentes={resultActual.fuentes_usadas} />

              <div className="flex items-center gap-3 mt-5 pt-5 border-t" style={{ borderColor: "var(--borde)" }}>
                <button
                  onClick={aprobar}
                  disabled={aprobando}
                  data-testid="aprobar-continuar"
                  className="inline-flex items-center gap-2.5 text-white text-[16px] font-semibold px-6 py-3.5 rounded-[8px] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: "var(--azul)" }}
                >
                  <Check size={19} /> {aprobando ? "Guardando..." : "Aprobar y continuar"}
                </button>
                <button
                  onClick={rehacer}
                  data-testid="rehacer"
                  className="inline-flex items-center gap-2.5 text-[16px] font-semibold px-6 py-3.5 rounded-[8px] border"
                  style={{ borderColor: "var(--borde)", color: "var(--texto)" }}
                >
                  <RefreshCw size={18} /> Rehacer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        abierto={verCompleto}
        onClose={() => setVerCompleto(false)}
        titulo={cabeceraResultado()}
        testid="modal-ver-completo"
      >
        {resultActual && <Resultado especialista={especialista} data={resultActual.contenido} resultadoId={resultActual.id} />}
        {resultActual && <Fuentes fuentes={resultActual.fuentes_usadas} />}
      </Modal>
    </div>
  );
}
