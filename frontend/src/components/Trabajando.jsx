import React, { useEffect, useState } from "react";
import { MENSAJES_TRABAJANDO } from "../lib/questions";
import { ETIQUETA_ESPECIALISTA } from "../lib/api";

export function Trabajando({ especialista, zona }) {
  const base = MENSAJES_TRABAJANDO[especialista] || ["Trabajando..."];
  const mensajes = base.map((m) =>
    m.includes("la zona") && zona ? m.replace("la zona", zona) : m
  );
  const [idx, setIdx] = useState(0);
  const [progreso, setProgreso] = useState(6);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % mensajes.length), 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [especialista]);

  useEffect(() => {
    const t = setInterval(() => {
      setProgreso((p) => (p < 92 ? p + Math.max(1, Math.round((94 - p) / 12)) : p));
    }, 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-start justify-center h-full max-w-[560px]" data-testid="estado-trabajando">
      <div className="antetitulo mb-3">EL ESPECIALISTA ESTÁ TRABAJANDO</div>
      <h2 className="font-sora text-[34px] font-bold leading-tight mb-8">
        {ETIQUETA_ESPECIALISTA[especialista]}
      </h2>
      <p
        key={idx}
        className="text-[19px] font-medium mb-5 aparecer"
        style={{ color: "var(--texto)" }}
        data-testid="trabajando-mensaje"
      >
        {mensajes[idx]}
      </p>
      <div className="w-full h-[6px] rounded-full overflow-hidden" style={{ background: "var(--suave)" }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progreso}%`, background: "var(--azul)" }}
        />
      </div>
      <p className="mt-4 text-[14px]" style={{ color: "var(--texto-2)" }}>
        Estamos consultando el método y redactando de verdad. Tarda unos segundos.
      </p>
    </div>
  );
}
