import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ListaCampanas } from "../components/ListaCampanas";
import { api } from "../lib/api";
import { Plus } from "lucide-react";

export default function Campanas() {
  const [campanas, setCampanas] = useState([]);
  const [cargado, setCargado] = useState(false);
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    api
      .get("/campanas")
      .then((r) => setCampanas(r.data))
      .catch(() => {})
      .finally(() => setCargado(true));
  }, []);

  useEffect(cargar, [cargar]);

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="antetitulo mb-2">TUS CAMPAÑAS</div>
          <h1 className="font-sora font-extrabold text-[30px] sm:text-[40px] leading-tight">Campañas</h1>
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

      {/* Mientras carga no se afirma que no hay ninguna: esa frase aparecía
          durante un instante en cada navegación y era falsa. */}
      {!cargado ? (
        <p className="text-[17px]" style={{ color: "var(--texto-2)" }}>Cargando...</p>
      ) : campanas.length === 0 ? (
        <div
          className="rounded-[12px] border p-8 text-center"
          style={{ borderColor: "var(--borde)", background: "var(--suave)" }}
        >
          <h2 className="font-sora text-[20px] font-bold mb-2">Todavía no hay ninguna campaña</h2>
          <p className="text-[16px] mb-5" style={{ color: "var(--texto-2)" }}>
            Una campaña son cuatro piezas encadenadas: a quién captas, qué le ofreces, los
            anuncios y la página que los recibe. Se tarda unos minutos.
          </p>
          <button
            onClick={() => navigate("/nueva/tipo")}
            className="inline-flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-[8px]"
            style={{ background: "var(--azul)" }}
          >
            <Plus size={18} /> Crear la primera
          </button>
        </div>
      ) : (
        <ListaCampanas campanas={campanas} onCambio={cargar} />
      )}
    </Layout>
  );
}
