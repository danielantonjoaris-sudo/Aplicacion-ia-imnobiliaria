import React from "react";

// Renderiza texto con **negritas** y viñetas simples como HTML seguro para nuestro contenido.
function formatear(linea) {
  let s = linea
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/^\s*[-*•]\s+/, "• ");
  // Los huecos que el agente deja marcados salen resaltados y no como texto
  // plano dentro de la frase: es un dato que falta, no una frase terminada.
  // El escapado ya se ha hecho arriba, así que aquí no entra HTML del modelo.
  s = s.replace(
    /\[(RELLENA|Supuesto|DATO PENDIENTE)([^\]]*)\]/gi,
    (_, etiqueta, resto) =>
      `<mark class="hueco" title="Dato que tienes que poner tú antes de publicar">${etiqueta}${resto}</mark>`
  );
  return s;
}

export function RichText({ text, className = "" }) {
  if (text === undefined || text === null || text === "") return null;
  const lineas = String(text).split(/\n+/).filter((l) => l.trim() !== "");
  return (
    <div className={className}>
      {lineas.map((l, i) => (
        <p key={i} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: formatear(l) }} />
      ))}
    </div>
  );
}
