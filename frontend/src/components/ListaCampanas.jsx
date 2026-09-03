import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { api } from "../lib/api";

const ESTADO = { en_proceso: "Sin terminar", completada: "Completada" };

export function fecha(iso) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

/**
 * La lista de campañas, compartida por Inicio y Campañas.
 *
 * Antes cada fila era un botón con el nombre y la fecha, y como todas las
 * campañas se llaman igual ("Captación en Elche") no había forma de
 * distinguirlas. Ahora se puede borrar, y "En proceso" pasa a "Sin terminar",
 * que es lo que de verdad le pasa a un borrador abandonado.
 */
export function ListaCampanas({ campanas, onCambio }) {
  const navigate = useNavigate();
  const [borrando, setBorrando] = useState(null);

  const abrir = (c) =>
    navigate(c.estado === "completada" ? `/campana/${c.id}` : `/asistente/${c.id}`);

  const borrar = async (e, c) => {
    e.stopPropagation();
    if (!window.confirm(`¿Borrar "${c.nombre}"? Se borra con todo su contenido.`)) return;
    setBorrando(c.id);
    try {
      await api.delete(`/campanas/${c.id}`);
      onCambio?.();
    } finally {
      setBorrando(null);
    }
  };

  return (
    <ul className="space-y-3 list-none p-0 m-0" data-testid="lista-campanas">
      {campanas.map((c) => (
        <li key={c.id}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => abrir(c)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), abrir(c))}
            data-testid={`campana-item-${c.id}`}
            className="w-full text-left flex items-center justify-between gap-3 rounded-[12px] border px-5 py-4 sm:px-6 sm:py-5 bg-white cursor-pointer transition-transform hover:-translate-y-0.5"
            style={{ borderColor: "var(--borde)", boxShadow: "0 4px 12px rgba(19,32,50,0.05)" }}
          >
            <div className="min-w-0">
              <div className="font-sora font-semibold text-[17px] sm:text-[18px] truncate">{c.nombre}</div>
              <div className="text-[14px]" style={{ color: "var(--texto-2)" }}>
                {fecha(c.creado_en)}
                {c.estado !== "completada" && ` · paso ${c.paso_actual || 1} de 4`}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[13px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap"
                style={{
                  background: c.estado === "completada" ? "rgba(44,150,93,0.12)" : "var(--suave)",
                  color: c.estado === "completada" ? "#1F6E44" : "var(--texto-2)",
                }}
              >
                {ESTADO[c.estado] || c.estado}
              </span>
              <button
                type="button"
                onClick={(e) => borrar(e, c)}
                disabled={borrando === c.id}
                aria-label={`Borrar ${c.nombre}`}
                data-testid={`borrar-campana-${c.id}`}
                className="flex items-center justify-center rounded-[8px] border"
                style={{ width: 44, height: 44, borderColor: "var(--borde)", color: "var(--texto-2)" }}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
