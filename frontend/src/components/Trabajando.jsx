import React, { useEffect, useState } from "react";
import { MENSAJES_TRABAJANDO } from "../lib/questions";
import { ETIQUETA_ESPECIALISTA } from "../lib/api";

export function Trabajando({ especialista, zona }) {
  const base = MENSAJES_TRABAJANDO[especialista] || ["Trabajando..."];
  const mensajes = base.map((m) =>
    m.includes("la zona") && zona ? m.replace("la zona", zona) : m
  );
  const [idx, setIdx] = useState(0);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % mensajes.length), 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [especialista]);

  // Antes había una barra que subía sola hasta el 92% y se quedaba clavada:
  // inventaba un progreso que nadie estaba midiendo. Si la llamada tardaba o
  // fallaba, el usuario se quedaba mirando una barra que mentía. Ahora hay una
  // barra indeterminada y un contador real de segundos.
  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
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
      <div
        className="w-full h-[6px] rounded-full overflow-hidden"
        style={{ background: "var(--suave)" }}
        role="progressbar"
        aria-label="Generando el resultado"
        aria-busy="true"
      >
        <div
          className="h-full rounded-full"
          style={{ width: "35%", background: "var(--azul)", animation: "barra-indeterminada 1.4s ease-in-out infinite" }}
        />
      </div>
      <p className="mt-4 text-[14px]" style={{ color: "var(--texto-2)" }} data-testid="trabajando-contador">
        Estamos consultando el método y redactando de verdad.{" "}
        {segundos < 15
          ? "Tarda unos segundos."
          : segundos < 45
          ? `Llevamos ${segundos} segundos.`
          : `Llevamos ${segundos} segundos. Las piezas largas tardan más.`}
      </p>
    </div>
  );
}
