import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

/**
 * Estructura de la aplicación.
 *
 * En escritorio la barra lateral es fija. Por debajo de 1024px sale de pantalla
 * y se abre con el botón de menú: antes ocupaba 264px de una pantalla de 375 y
 * el contenido quedaba fuera, sin forma de alcanzarlo.
 */
export function Layout({ children, ancho = "max-w-[1080px]", lateralDerecho = null }) {
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();

  // Al cambiar de página el cajón se cierra solo.
  useEffect(() => setAbierto(false), [pathname]);

  // Con el cajón abierto no se desplaza el fondo, y Escape lo cierra.
  useEffect(() => {
    const alPulsar = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", alPulsar);
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <div className="flex min-h-screen">
      <a href="#contenido" className="saltar">Saltar al contenido</a>

      <Sidebar abierto={abierto} onCerrar={() => setAbierto(false)} />

      {abierto && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(19,32,50,0.45)" }}
          onClick={() => setAbierto(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 min-w-0 lg:ml-[264px]">
        <header
          className="lg:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: "var(--pagina)", borderColor: "var(--borde)" }}
        >
          <button
            type="button"
            onClick={() => setAbierto(true)}
            aria-label="Abrir el menú"
            aria-expanded={abierto}
            data-testid="abrir-menu"
            className="flex items-center justify-center rounded-[8px] border"
            style={{ width: 44, height: 44, borderColor: "var(--borde)" }}
          >
            <Menu size={22} />
          </button>
          <span className="font-sora text-[18px] font-extrabold">
            Inmo<span style={{ color: "var(--dorado)" }}>Matic</span>
          </span>
        </header>

        <main id="contenido" className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {lateralDerecho ? (
            <div className={`${ancho} lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10`}>
              <div className="indice-doc">{lateralDerecho}</div>
              <div className="min-w-0">{children}</div>
            </div>
          ) : (
            <div className={ancho}>{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
