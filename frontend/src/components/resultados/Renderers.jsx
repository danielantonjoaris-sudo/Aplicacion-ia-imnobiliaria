import React from "react";
import { Copy, Check as CheckIcon } from "lucide-react";
import { RichText } from "../RichText";

const Etiqueta = ({ children }) => (
  <div className="antetitulo mb-2">{children}</div>
);

/**
 * Botón de copiar. Todo lo que produce esta aplicación existe para pegarse en
 * otro sitio (Idealista, Meta, el CRM), y hasta ahora no había ni una sola
 * forma de sacarlo salvo seleccionar a mano nueve pantallas de texto.
 *
 * Al copiar se limpian los huecos [RELLENA: ...]: se sustituyen por una línea
 * en blanco, para que nadie publique un marcador por descuido.
 */
export function BotonCopiar({ texto, etiqueta = "Copiar", className = "" }) {
  const [copiado, setCopiado] = React.useState(false);
  const copiar = async () => {
    try {
      const limpio = String(texto || "").replace(/\[(?:RELLENA|Supuesto|DATO PENDIENTE)[^\]]*\]/gi, "________");
      await navigator.clipboard.writeText(limpio.trim());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      setCopiado(false);
    }
  };
  return (
    <button
      type="button"
      onClick={copiar}
      className={`inline-flex items-center gap-1.5 rounded-[8px] border px-3 text-[13px] font-semibold transition-colors ${className}`}
      style={{ borderColor: "var(--borde)", color: copiado ? "var(--verde)" : "var(--texto-2)", minHeight: 36 }}
    >
      {copiado ? <CheckIcon size={15} /> : <Copy size={15} />}
      {copiado ? "Copiado" : etiqueta}
    </button>
  );
}

/** Cuenta los huecos que la agencia tiene que rellenar antes de publicar. */
export function contarHuecos(obj) {
  const texto = JSON.stringify(obj || {});
  return (texto.match(/\[(?:RELLENA|Supuesto|DATO PENDIENTE)[^\]]*\]/gi) || []).length;
}

/** El texto de un anuncio, listo para pegar en el administrador de Meta. */
function textoAnuncio(a) {
  return [a.gancho, a.cuerpo, a.llamada_a_la_accion].filter(Boolean).join("\n\n");
}

const Lista = ({ items }) => (
  <ul className="space-y-1.5">
    {(items || []).map((t, i) => (
      <li key={i} className="flex gap-2.5" style={{ color: "var(--texto)" }}>
        <span style={{ color: "var(--azul)" }} className="font-bold">›</span>
        <span>{t}</span>
      </li>
    ))}
  </ul>
);

export function ClienteIdeal({ data, compact }) {
  const preocupa = data.que_le_preocupa || [];
  const preocupaMostrar = compact ? preocupa.slice(0, 2) : preocupa;
  return (
    <div className="space-y-6">
      <div>
        <Etiqueta>El perfil</Etiqueta>
        <RichText text={data.perfil} className="text-[17px]" />
      </div>
      {data.momento_vital && (
        <div>
          <Etiqueta>Momento vital</Etiqueta>
          <RichText text={data.momento_vital} className="text-[17px]" />
        </div>
      )}
      <div>
        <Etiqueta>Qué le preocupa</Etiqueta>
        <div className="space-y-3">
          {preocupaMostrar.map((p, i) => (
            <div key={i} className="rounded-[12px] p-4" style={{ background: "var(--suave)" }}>
              <div className="font-sora font-semibold text-[16px] mb-1">{p.titulo}</div>
              <p className="italic" style={{ color: "var(--texto-2)" }}>
                «{String(p.frase_textual || "").replace(/^[«"]|["»]$/g, "")}»
              </p>
            </div>
          ))}
        </div>
      </div>
      {!compact && (
        <>
          <div>
            <Etiqueta>Qué le frena</Etiqueta>
            <Lista items={data.que_le_frena} />
          </div>
          <div>
            <Etiqueta>Qué le haría actuar</Etiqueta>
            <Lista items={data.que_le_haria_actuar} />
          </div>
          <div>
            <Etiqueta>Dónde encontrarle</Etiqueta>
            <Lista items={data.donde_encontrarle} />
          </div>
        </>
      )}
    </div>
  );
}

export function Oferta({ data, compact }) {
  const incluye = data.que_incluye || [];
  return (
    <div className="space-y-6">
      <div>
        <Etiqueta>La oferta</Etiqueta>
        <h3 className="font-sora text-[26px] font-bold" style={{ color: "var(--azul)" }}>
          {data.nombre_oferta}
        </h3>
        <RichText text={data.promesa_principal} className="text-[18px] mt-1" />
      </div>
      <div>
        <Etiqueta>Qué incluye</Etiqueta>
        <div className="grid grid-cols-2 gap-3">
          {incluye.map((it, i) => (
            <div key={i} className="rounded-[12px] p-4 border" style={{ borderColor: "var(--borde)" }}>
              <div className="font-sora font-semibold text-[16px] mb-1">{it.titulo}</div>
              {!compact && <RichText text={it.descripcion} className="text-[15px]" />}
            </div>
          ))}
        </div>
      </div>
      <div>
        <Etiqueta>La garantía que elimina el riesgo</Etiqueta>
        <div className="rounded-[12px] p-4" style={{ background: "var(--acento)" }}>
          <RichText text={data.eliminador_de_riesgo} className="text-[17px]" />
        </div>
      </div>
      {!compact && (
        <div>
          <Etiqueta>Por qué es creíble</Etiqueta>
          <RichText text={data.por_que_es_creible} className="text-[17px]" />
        </div>
      )}
    </div>
  );
}

export function Anuncios({ data, compact }) {
  const anuncios = data.anuncios || [];
  // Los cinco anuncios son una secuencia (la escalera de consciencia). En dos
  // columnas se leían 1|2 / 3|4 / 5, con el último huérfano y más de mil píxeles
  // de zigzag entre uno y otro. En columna única el orden vuelve a ser el
  // contenido.
  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      {anuncios.map((a, i) => (
        <div
          key={i}
          id={`anuncio-${i + 1}`}
          className="rounded-[12px] border p-4 sm:p-5"
          style={{ borderColor: "var(--borde)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold"
                style={{ background: "var(--acento)", color: "var(--azul)" }}
              >
                {i + 1}
              </span>
              <span
                className="text-[12px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: "var(--acento)", color: "var(--azul)" }}
              >
                {a.angulo}
              </span>
            </div>
            {!compact && <BotonCopiar texto={textoAnuncio(a)} etiqueta="Copiar el anuncio" />}
          </div>
          <div className="font-sora font-semibold text-[16px] leading-snug mb-2">{a.gancho}</div>
          {!compact && (
            <>
              <RichText text={a.cuerpo} className="text-[15px] mb-3" />
              <div className="text-[13px] font-bold" style={{ color: "var(--azul)" }}>
                {a.llamada_a_la_accion}
              </div>
              <p
                className="text-[13px] italic mt-3 pt-3 border-t"
                style={{ color: "var(--texto-2)", borderColor: "var(--borde)" }}
              >
                <span className="not-italic font-semibold">Por qué funciona: </span>
                {a.por_que_funciona}
              </p>
            </>
          )}
          {compact && (
            <div className="text-[13px] font-bold" style={{ color: "var(--azul)" }}>
              {a.llamada_a_la_accion}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// La landing no se dibuja aquí: el backend la genera como HTML completo con la
// marca de la agencia, y aquí se enseña de verdad, con lo que hace falta para
// llevársela. Ver una maqueta aproximada no sirve: hay que ver la página.
export function LandingPreview({ data, resultadoId, compact }) {
  const [copiado, setCopiado] = React.useState(false);
  const base = `${process.env.REACT_APP_BACKEND_URL}/api/resultados/${resultadoId}`;

  const copiar = async () => {
    try {
      const res = await fetch(`${base}/landing.html`);
      await navigator.clipboard.writeText(await res.text());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  // Sin id no se puede pedir el HTML: se cae a la maqueta antigua.
  if (!resultadoId) return <LandingMaqueta data={data} compact={compact} />;

  return (
    <div data-testid="landing-preview">
      <div className="flex flex-wrap gap-2 mb-3">
        <a
          href={`${base}/landing/descargar`}
          className="rounded-[8px] px-4 py-2.5 text-[14px] font-semibold text-white"
          style={{ background: "var(--azul)" }}
          data-testid="landing-descargar"
        >
          Descargar la página
        </a>
        <a
          href={`${base}/landing.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[8px] border px-4 py-2.5 text-[14px] font-semibold"
          style={{ borderColor: "var(--borde)" }}
        >
          Abrir en pestaña nueva
        </a>
        <button
          type="button"
          onClick={copiar}
          className="rounded-[8px] border px-4 py-2.5 text-[14px] font-semibold"
          style={{ borderColor: "var(--borde)" }}
        >
          {copiado ? "Copiado" : "Copiar el HTML"}
        </button>
      </div>
      <p className="text-[13px] mb-3" style={{ color: "var(--texto-2)" }}>
        Vista previa real, con la marca de tu agencia. Es un solo archivo: se abre con doble
        clic y funciona. Rellena el bloque LANDING_CONFIG antes de publicarla.
      </p>
      <div className="rounded-[12px] border overflow-hidden" style={{ borderColor: "var(--borde)" }}>
        <iframe
          src={`${base}/landing.html`}
          title="Vista previa de la landing"
          className="w-full block"
          style={{ height: compact ? "420px" : "70vh", border: 0 }}
        />
      </div>
    </div>
  );
}

function LandingMaqueta({ data, compact }) {
  const beneficios = data.beneficios || [];
  const campos = data.campos_formulario || [];
  const t = data.testimonio || {};
  const escala = compact ? "text-[15px]" : "text-[17px]";
  return (
    <div className="rounded-[12px] border overflow-hidden" style={{ borderColor: "var(--borde)" }} data-testid="landing-preview">
      {/* Hero */}
      <div className="px-8 py-8" style={{ background: "var(--suave)" }}>
        <div className="antetitulo mb-2">VALORACIÓN GRATUITA</div>
        <h2 className={`font-sora font-bold leading-tight ${compact ? "text-[24px]" : "text-[32px]"}`}>
          {data.titular}
        </h2>
        <p className={`mt-2 ${escala}`} style={{ color: "var(--texto-2)" }}>
          {data.subtitular}
        </p>
      </div>
      {/* Beneficios + formulario */}
      <div className="px-8 py-6 grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          {beneficios.map((b, i) => (
            <div key={i}>
              <div className="font-sora font-semibold text-[16px] mb-0.5">{b.titulo}</div>
              <p className={compact ? "text-[14px]" : "text-[15px]"} style={{ color: "var(--texto-2)" }}>
                {b.texto}
              </p>
            </div>
          ))}
          {(t.texto) && (
            <div className="rounded-[12px] p-4 mt-2" style={{ background: "var(--suave)" }}>
              {t.es_ejemplo && (
                <span
                  className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
                  style={{ background: "#FDECC8", color: "#8A6410" }}
                  data-testid="testimonio-ejemplo"
                >
                  Ejemplo · sustitúyelo por uno real
                </span>
              )}
              <p className="italic" style={{ color: "var(--texto)" }}>«{t.texto}»</p>
              <p className="text-[14px] mt-1 font-semibold" style={{ color: "var(--texto-2)" }}>— {t.autor}</p>
            </div>
          )}
        </div>
        {/* Formulario */}
        <div className="col-span-2">
          <div className="rounded-[12px] border p-5" style={{ borderColor: "var(--borde)" }}>
            <div className="font-sora font-semibold text-[16px] mb-3">Pide tu valoración</div>
            <div className="space-y-2.5">
              {campos.map((c, i) => (
                <div
                  key={i}
                  className="w-full rounded-[8px] border px-3 py-2 text-[14px]"
                  style={{ borderColor: "var(--borde-campo)", color: "var(--texto-2)" }}
                >
                  {c}
                </div>
              ))}
            </div>
            <button
              className="w-full mt-4 rounded-[8px] py-3 font-semibold text-white text-[15px]"
              style={{ background: "var(--azul)" }}
            >
              {data.llamada_a_la_accion}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Resultado({ especialista, data, resultadoId, compact }) {
  if (!data) return null;
  if (especialista === "cliente_ideal") return <ClienteIdeal data={data} compact={compact} />;
  if (especialista === "oferta") return <Oferta data={data} compact={compact} />;
  if (especialista === "anuncios") return <Anuncios data={data} compact={compact} />;
  if (especialista === "landing")
    return <LandingPreview data={data} resultadoId={resultadoId} compact={compact} />;
  return null;
}
