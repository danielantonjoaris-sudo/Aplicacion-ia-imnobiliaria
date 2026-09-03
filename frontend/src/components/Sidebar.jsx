import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, LayoutList, Plus, LogOut, Building2 } from "lucide-react";
import { api } from "../lib/api";

export function Sidebar() {
  const [agencia, setAgencia] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/agencias").then((r) => setAgencia(r.data[0] || null)).catch(() => {});
  }, []);

  const linkBase = "flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[16px] transition-colors";

  return (
    <aside
      className="w-[264px] shrink-0 fixed inset-y-0 left-0 flex flex-col border-r z-30"
      style={{ background: "var(--sidebar)", borderColor: "var(--borde)" }}
      data-testid="sidebar"
    >
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-0.5">
          <span className="font-sora text-[22px] font-extrabold" style={{ color: "var(--texto)" }}>Inmo</span>
          <span className="font-sora text-[22px] font-extrabold" style={{ color: "var(--dorado)" }}>Matic</span>
        </div>
      </div>

      <nav className="px-4 space-y-1">
        <NavLink
          to="/"
          data-testid="nav-inicio"
          className={linkBase}
          style={({ isActive }) => ({
            background: isActive ? "var(--acento)" : "transparent",
            color: isActive ? "var(--azul)" : "var(--texto)",
            fontWeight: isActive ? 600 : 400,
          })}
        >
          <Home size={19} /> Inicio
        </NavLink>
        <NavLink
          to="/campanas"
          data-testid="nav-campanas"
          className={linkBase}
          style={({ isActive }) => ({
            background: isActive ? "var(--acento)" : "transparent",
            color: isActive ? "var(--azul)" : "var(--texto)",
            fontWeight: isActive ? 600 : 400,
          })}
        >
          <LayoutList size={19} /> Campañas
        </NavLink>
        <button
          onClick={() => navigate("/nueva/tipo")}
          data-testid="sidebar-nueva-campana"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-white text-[16px] font-semibold mt-2 transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--azul)" }}
        >
          <Plus size={19} /> Nueva campaña
        </button>
      </nav>

      <div className="mt-auto px-5 py-6 border-t" style={{ borderColor: "var(--borde)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "var(--acento)" }}>
            <Building2 size={18} color="#0B4DA8" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[15px] truncate" data-testid="sidebar-agencia">
              {agencia ? agencia.nombre_agencia : "Sin configurar"}
            </div>
            <div className="text-[13px] truncate" style={{ color: "var(--texto-2)" }}>
              {agencia ? agencia.zona : "—"}
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 mt-4 text-[14px]" style={{ color: "var(--texto-2)" }} data-testid="sidebar-salir">
          <LogOut size={16} /> Salir
        </button>
      </div>
    </aside>
  );
}
