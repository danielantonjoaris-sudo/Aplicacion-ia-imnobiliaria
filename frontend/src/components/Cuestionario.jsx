import React, { useState } from "react";
import { PREGUNTAS } from "../lib/questions";
import { ETIQUETA_ESPECIALISTA } from "../lib/api";
import { Check, ArrowRight } from "lucide-react";

export function Cuestionario({ especialista, onSubmit }) {
  const preguntas = PREGUNTAS[especialista];
  const [resp, setResp] = useState({});
  const [otra, setOtra] = useState({}); // texto de "Otra cosa" por pregunta

  const setSingle = (id, val) => setResp((r) => ({ ...r, [id]: val }));
  const toggleMulti = (id, val) =>
    setResp((r) => {
      const arr = Array.isArray(r[id]) ? [...r[id]] : [];
      const i = arr.indexOf(val);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(val);
      return { ...r, [id]: arr };
    });

  const completo = preguntas.every((p) => {
    if (p.opcional) return true;
    const v = resp[p.id];
    if (p.tipo === "multi") return (Array.isArray(v) && v.length > 0) || (otra[p.id] && otra[p.id].trim());
    return v && String(v).trim();
  });

  const enviar = () => {
    if (!completo) return;
    const salida = {};
    for (const p of preguntas) {
      if (p.tipo === "multi") {
        const arr = Array.isArray(resp[p.id]) ? [...resp[p.id]] : [];
        if (otra[p.id] && otra[p.id].trim()) arr.push(`Otra cosa: ${otra[p.id].trim()}`);
        salida[p.id] = arr;
      } else {
        salida[p.id] = resp[p.id] || "";
      }
    }
    onSubmit(salida);
  };

  const chip = (activo) => ({
    borderColor: activo ? "var(--azul)" : "var(--borde-campo)",
    background: activo ? "var(--acento)" : "white",
    color: activo ? "var(--azul)" : "var(--texto)",
  });

  return (
    <div className="max-w-[720px] aparecer" data-testid={`cuestionario-${especialista}`}>
      <div className="antetitulo mb-2">ESPECIALISTA EN {ETIQUETA_ESPECIALISTA[especialista].toUpperCase()}</div>
      <h2 className="font-sora text-[28px] font-bold mb-6">Cuéntame lo justo y me pongo a trabajar</h2>

      <div className="space-y-7">
        {preguntas.map((p) => (
          /* Cada pregunta es un grupo con su leyenda: antes eran botones sueltos
             y un lector de pantalla recorría diecisiete opciones sin llegar a oír
             nunca a qué pregunta pertenecían. */
          <fieldset key={p.id} className="border-0 p-0 m-0">
            <legend className="block font-semibold text-[17px] mb-1 p-0">
              {p.texto}
              {p.opcional ? (
                <span className="text-[14px] font-normal ml-2" style={{ color: "var(--texto-2)" }}>(opcional)</span>
              ) : (
                <span className="text-[14px] font-normal ml-2" style={{ color: "var(--texto-2)" }}>(obligatoria)</span>
              )}
            </legend>
            {p.tipo === "multi" && (
              <p className="text-[14px] mb-3" style={{ color: "var(--texto-2)" }}>Puedes elegir varias.</p>
            )}
            {p.tipo === "unica" && (
              <p className="text-[14px] mb-3" style={{ color: "var(--texto-2)" }}>Elige una.</p>
            )}

            {p.tipo === "texto" ? (
              <textarea
                data-testid={`campo-${p.id}`}
                rows={3}
                aria-label={p.texto}
                value={resp[p.id] || ""}
                onChange={(e) => setSingle(p.id, e.target.value)}
                placeholder={p.placeholder}
                className="w-full rounded-[8px] border px-4 py-3 text-[16px] outline-none focus:border-[#0B4DA8] mt-1"
                style={{ borderColor: "var(--borde-campo)" }}
              />
            ) : (
              <>
                <div className="flex flex-wrap gap-2.5 mt-1">
                  {p.opciones.map((op) => {
                    const activo = p.tipo === "multi" ? (resp[p.id] || []).includes(op) : resp[p.id] === op;
                    return (
                      <button
                        key={op}
                        type="button"
                        aria-pressed={activo}
                        data-testid={`opcion-${p.id}-${op}`}
                        onClick={() => (p.tipo === "multi" ? toggleMulti(p.id, op) : setSingle(p.id, op))}
                        className="inline-flex items-center gap-2 rounded-full border px-4 text-[15px] font-medium transition-colors"
                        style={{ ...chip(activo), minHeight: 44 }}
                      >
                        {activo && <Check size={15} />}
                        {op}
                      </button>
                    );
                  })}
                </div>
                {p.otra && (
                  /* El campo libre iba dentro de la fila de opciones y parecía una
                     opción más. Ahora va debajo, con su etiqueta. */
                  <div className="mt-3">
                    <label className="block text-[14px] mb-1" style={{ color: "var(--texto-2)" }} htmlFor={`otra-${p.id}`}>
                      ¿Otra cosa? Escríbela
                    </label>
                    <input
                      id={`otra-${p.id}`}
                      data-testid={`otra-${p.id}`}
                      value={otra[p.id] || ""}
                      onChange={(e) => setOtra((o) => ({ ...o, [p.id]: e.target.value }))}
                      placeholder="Lo que no esté en la lista"
                      className="w-full max-w-[420px] rounded-[8px] border px-4 py-2.5 text-[15px] outline-none focus:border-[#0B4DA8]"
                      style={{ borderColor: "var(--borde-campo)", minHeight: 44 }}
                    />
                  </div>
                )}
              </>
            )}
          </fieldset>
        ))}
      </div>

      {!completo && (
        <p className="text-[14px] mt-8 mb-0" style={{ color: "var(--texto-2)" }} data-testid="aviso-incompleto">
          Contesta las preguntas obligatorias para continuar.
        </p>
      )}
      <button
        onClick={enviar}
        disabled={!completo}
        data-testid="enviar-cuestionario"
        className="inline-flex items-center gap-2.5 text-white text-[17px] font-semibold px-7 py-4 rounded-[8px] mt-4 transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        style={{ background: "var(--azul)" }}
      >
        <Check size={20} /> Enviar al especialista <ArrowRight size={19} />
      </button>
    </div>
  );
}
