import React from "react";
import { Sidebar } from "./Sidebar";

export function Layout({ children, ancho = "max-w-[1080px]" }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[264px] px-12 py-12">
        <div className={ancho}>{children}</div>
      </main>
    </div>
  );
}
