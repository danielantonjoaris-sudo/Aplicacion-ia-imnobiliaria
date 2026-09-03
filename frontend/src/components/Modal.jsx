import React from "react";
import { X } from "lucide-react";

export function Modal({ abierto, onClose, titulo, children, testid }) {
  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-auto"
      style={{ background: "rgba(19,32,50,0.45)" }}
      onClick={onClose}
      data-testid={testid}
    >
      <div
        className="bg-white rounded-[12px] w-full max-w-[860px] my-8 border"
        style={{ borderColor: "var(--borde)", boxShadow: "0 12px 40px rgba(19,32,50,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "var(--borde)" }}>
          <h3 className="font-sora text-2xl font-bold">{titulo}</h3>
          <button
            onClick={onClose}
            data-testid="modal-cerrar"
            className="p-2 rounded-[8px] hover:bg-[#F2F5FB] transition-colors"
            aria-label="Cerrar"
          >
            <X size={22} color="#5E6A7B" />
          </button>
        </div>
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
  );
}
