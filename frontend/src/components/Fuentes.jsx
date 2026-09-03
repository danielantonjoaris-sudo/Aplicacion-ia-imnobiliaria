import React from "react";
import { BookOpen } from "lucide-react";

export function Fuentes({ fuentes }) {
  if (!fuentes || fuentes.length === 0) return null;
  return (
    <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--borde)" }} data-testid="fuentes-usadas">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={15} color="#5E6A7B" />
        <span className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--texto-2)" }}>
          Basado en el método
        </span>
      </div>
      <ul className="space-y-1">
        {fuentes.map((f, i) => (
          <li key={i} className="text-[13px]" style={{ color: "var(--texto-2)" }}>
            <span style={{ color: "var(--texto)" }}>{f.titulo}</span> — {f.fuente}
          </li>
        ))}
      </ul>
    </div>
  );
}
