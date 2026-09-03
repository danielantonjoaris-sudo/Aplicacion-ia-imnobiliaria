"""
InmoMatic · Renderizador de landings.

Convierte la salida estructurada del especialista de landing (un diccionario que
cumple el esquema acordado) en un documento HTML completo y autónomo, dibujado
con LA MARCA DE LA AGENCIA INMOBILIARIA, no con la de InmoMatic.

    html = render_landing(datos, agencia, marca)

El agente escribe; esto dibuja. Así la landing sale siempre con la misma calidad
y, si el diseño hay que mejorarlo, se toca una función y se arreglan todas.

Sin dependencias: solo biblioteca estándar. El HTML que produce es un único
archivo que se abre con doble clic y funciona, sin servidor y sin build.

Uso rápido para probarlo:
    python render_landing.py > prueba.html
"""

from __future__ import annotations

import html as _html
import json
import re
from typing import Any


# ---------------------------------------------------------------- utilidades

def esc(valor: Any) -> str:
    """Escapa para HTML. Nunca devuelve None."""
    if valor is None:
        return ""
    return _html.escape(str(valor), quote=True)


def _hex_norm(color: str | None, por_defecto: str) -> str:
    """Normaliza #abc, #aabbcc, aabbcc a #AABBCC. Si no vale, el de por defecto."""
    if not color:
        return por_defecto
    m = re.fullmatch(r"#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})", str(color).strip())
    if not m:
        return por_defecto
    v = m.group(1)
    if len(v) == 3:
        v = "".join(c * 2 for c in v)
    return "#" + v.upper()


def _rgb(color: str) -> tuple[int, int, int]:
    c = _hex_norm(color, "#000000")
    return int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)


def _hex(r: float, g: float, b: float) -> str:
    clamp = lambda v: max(0, min(255, int(round(v))))
    return "#" + "".join(f"{clamp(v):02X}" for v in (r, g, b))


def mezclar(a: str, b: str, t: float) -> str:
    """Interpola dos colores. t=0 devuelve a, t=1 devuelve b."""
    ra, ga, ba = _rgb(a)
    rb, gb, bb = _rgb(b)
    return _hex(ra + (rb - ra) * t, ga + (gb - ga) * t, ba + (bb - ba) * t)


def _luminancia(color: str) -> float:
    def canal(v: float) -> float:
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = _rgb(color)
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)


def contraste(a: str, b: str) -> float:
    """Ratio de contraste WCAG entre dos colores. De 1 a 21."""
    la, lb = _luminancia(a), _luminancia(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


# ------------------------------------------------------------------- estilos

ESTILOS = ("editorial", "minimal", "brutalista", "calido", "tecnico", "clasico")

FUENTES_POR_ESTILO = {
    "editorial":  ("Fraunces", "Inter"),
    "minimal":    ("Inter", "Inter"),
    "brutalista": ("Space Grotesk", "Space Grotesk"),
    "calido":     ("Lora", "Nunito Sans"),
    "tecnico":    ("IBM Plex Sans", "IBM Plex Sans"),
    "clasico":    ("Cormorant Garamond", "Libre Franklin"),
}

# Familias que se pueden pedir a Google Fonts con seguridad. Una familia
# desconocida invalida la petición entera, así que lo que no esté aquí se usa
# por nombre con su pila de reserva y no se pide.
FUENTES_GOOGLE = {
    "Inter", "Fraunces", "Space Grotesk", "Lora", "Nunito Sans", "IBM Plex Sans",
    "IBM Plex Mono", "Cormorant Garamond", "Libre Franklin", "Libre Baskerville",
    "Playfair Display", "DM Sans", "DM Serif Display", "EB Garamond", "Montserrat",
    "Poppins", "Raleway", "Lato", "Open Sans", "Roboto", "Work Sans", "Manrope",
    "Karla", "Jost", "Source Sans 3", "Source Serif 4", "Merriweather", "Spectral",
    "Newsreader", "Instrument Serif", "Prata", "Bodoni Moda", "Bebas Neue", "Anton",
    "Oswald", "Archivo", "Barlow", "Rubik", "Figtree", "Outfit", "Plus Jakarta Sans",
    "Urbanist", "Sora", "Epilogue", "Public Sans", "Mulish", "Quicksand", "Cinzel",
    "Marcellus", "Literata", "Noto Sans", "Noto Serif", "PT Sans", "PT Serif",
    "Fira Sans", "JetBrains Mono", "Lexend", "Heebo", "Assistant", "Ubuntu",
    "Bitter", "Domine", "Cardo", "Alegreya", "Vollkorn", "Tenor Sans",
}

_SERIF = re.compile(
    r"serif|garamond|playfair|fraunces|lora|georgia|times|merriweather|cormorant|"
    r"baskerville|crimson|spectral|newsreader|prata|bodoni|didot|caslon|literata|"
    r"domine|cardo|alegreya|vollkorn|bitter|tenor|marcellus|cinzel|book",
    re.I,
)


def _pila(fuente: str) -> str:
    """Nombre de fuente más su pila de reserva, según sea serifa o de palo."""
    nombre = re.sub(r"[\"']", "", str(fuente or "")).strip() or "Inter"
    es_serif = bool(_SERIF.search(nombre)) and not re.search(r"sans", nombre, re.I)
    reserva = ('Georgia, "Times New Roman", serif' if es_serif
               else 'system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif')
    return f"'{nombre}', {reserva}"


def _url_fuentes(*nombres: str) -> str:
    unicas = []
    for n in nombres:
        n = re.sub(r"[\"']", "", str(n or "")).strip()
        if n and n in FUENTES_GOOGLE and n not in unicas:
            unicas.append(n)
    if not unicas:
        return ""
    familias = "&".join(
        "family=" + n.replace(" ", "+") + ":wght@400;600;700" for n in unicas
    )
    return f"https://fonts.googleapis.com/css2?{familias}&display=swap"


# -------------------------------------------------------------------- marca

MARCA_POR_DEFECTO = {
    "colores": {"fondo": "#FFFFFF", "texto": "#141414",
                "acento": "#0B4DA8", "secundario": "#5E6A7B"},
    "tipografia": {"titulos": "Inter", "cuerpo": "Inter"},
    "estilo": "minimal",
    "logo": "",
}


def normalizar_marca(marca: dict | None) -> dict:
    """
    Deja cualquier marca en una forma dibujable: hex válidos, contraste mínimo
    garantizado y fuentes con nombre. Nunca lanza: corrige.

    El contraste se corrige aquí y no en el prompt del agente a propósito. Una
    landing ilegible no puede depender del criterio de un modelo.
    """
    marca = marca or {}
    estilo = marca.get("estilo") if marca.get("estilo") in ESTILOS else "minimal"
    col = marca.get("colores") or {}

    fondo = _hex_norm(col.get("fondo"), "#FFFFFF")
    texto = _hex_norm(col.get("texto"), "#141414")
    if contraste(texto, fondo) < 4.5:
        texto = "#1A1A1A" if _luminancia(fondo) > 0.4 else "#F5F3EE"

    acento = _hex_norm(col.get("acento"), texto)
    if contraste(acento, fondo) < 1.6:      # un acento casi igual al fondo no se ve
        acento = texto

    secundario = _hex_norm(col.get("secundario"), mezclar(texto, fondo, 0.42))
    if contraste(secundario, fondo) < 3:
        secundario = mezclar(texto, fondo, 0.42)

    tip = marca.get("tipografia") or {}
    t_def, c_def = FUENTES_POR_ESTILO[estilo]
    titulos = re.sub(r"[\"']", "", str(tip.get("titulos") or t_def)).strip() or t_def
    cuerpo = re.sub(r"[\"']", "", str(tip.get("cuerpo") or c_def)).strip() or c_def

    logo = str(marca.get("logo") or "").strip()
    if not re.match(r"^https?://\S{1,500}$", logo):
        logo = ""

    return {
        "estilo": estilo,
        "logo": logo,
        "colores": {
            "fondo": fondo, "texto": texto, "acento": acento,
            "secundario": secundario,
            "acento_suave": mezclar(acento, fondo, 0.86),
        },
        "tipografia": {"titulos": titulos, "cuerpo": cuerpo},
    }


def _derivados(marca: dict) -> dict:
    """Tonos que necesita el dibujo y que no se guardan."""
    c = marca["colores"]
    fondo, texto, acento = c["fondo"], c["texto"], c["acento"]
    # El texto del botón: el de mayor contraste sobre el acento.
    candidatos = ["#FFFFFF", "#111111", fondo, texto]
    acento_texto = max(candidatos, key=lambda x: contraste(x, acento))
    r, g, b = _rgb(texto)
    return {
        "linea": mezclar(texto, fondo, 0.82),
        "linea_fuerte": mezclar(texto, fondo, 0.6),
        "panel": mezclar(fondo, texto, 0.07 if _luminancia(fondo) < 0.3 else 0.035),
        "acento_texto": acento_texto,
        "rejilla": f"rgba({r},{g},{b},0.055)",
    }


# ------------------------------------------------------------------ el dibujo

def _parrafos(lista: Any) -> str:
    if not isinstance(lista, list):
        return ""
    return "\n".join(f"<p>{esc(p)}</p>" for p in lista if str(p).strip())


def _testimonio(prueba: dict) -> str:
    """
    El testimonio admite dos formas: cadena suelta o
    {"texto", "autor", "es_ejemplo"}. Si es de ejemplo se marca con un
    distintivo visible, para que nadie publique un testimonio inventado
    creyendo que es real.
    """
    t = prueba.get("testimonio")
    if not t:
        return ""
    if isinstance(t, str):
        texto, autor, ejemplo = t, "", False
    else:
        texto = t.get("texto") or ""
        autor = t.get("autor") or ""
        ejemplo = bool(t.get("es_ejemplo"))
    if not str(texto).strip():
        return ""
    aviso = ('<span class="aviso-ejemplo">EJEMPLO · SUSTITÚYELO POR UNO REAL</span>'
             if ejemplo else "")
    firma = f"<cite>{esc(autor)}</cite>" if autor else ""
    return f'<blockquote class="cita">{aviso}{esc(texto)}{firma}</blockquote>'


def _slug(texto: str, tope: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", str(texto or "landing").lower()).strip("-")
    return (s or "landing")[:tope]


def render_landing(datos: dict, agencia: dict | None = None,
                   marca: dict | None = None) -> str:
    """
    Devuelve el documento HTML completo de la landing.

    datos   -- salida del especialista de landing (esquema acordado)
    agencia -- {"nombre", "ciudad", "telefono", "email"}
    marca   -- la marca de la agencia; si falta, se usa la guardada en `datos`
               y, si tampoco está, una neutra (nunca la de InmoMatic)
    """
    datos = datos or {}
    agencia = agencia or {}
    marca = normalizar_marca(marca or datos.get("marca") or MARCA_POR_DEFECTO)
    c, v = marca["colores"], _derivados(marca)
    t = marca["tipografia"]

    f_titulos, f_cuerpo = _pila(t["titulos"]), _pila(t["cuerpo"])
    url_fuentes = _url_fuentes(t["titulos"], t["cuerpo"])

    nombre = esc(agencia.get("nombre") or "Inmobiliaria")
    ciudad = esc(agencia.get("ciudad") or "")

    hero = datos.get("hero") or {}
    boton = esc(hero.get("boton") or "Pedir el informe")
    seo = datos.get("seo") or {}
    garantia = datos.get("garantia") or {}
    incluye = datos.get("incluye") or {}
    prueba = datos.get("prueba") or {}
    form = datos.get("formulario") or {}
    hay_garantia = bool(str(garantia.get("titulo") or "").strip())
    bonus = [b for b in (incluye.get("bonus") or []) if b]

    cabecera = (
        f'<div class="logo"><img src="{esc(marca["logo"])}" alt="{nombre}"></div>'
        if marca["logo"] else
        f'<div class="marca">{nombre}'
        + (f"<small>{ciudad}</small>" if ciudad else "")
        + "</div>"
    )

    pasos = "\n".join(
        f'<li><span class="num">{i:02d}</span><div>'
        f'<h3>{esc(p.get("titulo"))}</h3><p>{esc(p.get("texto"))}</p>'
        f"</div></li>"
        for i, p in enumerate((datos.get("mecanismo") or {}).get("pasos") or [], 1)
    )
    entregables = "\n".join(
        f'<li><span class="m"></span><div><b>{esc(e.get("nombre"))}</b> '
        f'<span>{esc(e.get("texto"))}</span></div></li>'
        for e in (incluye.get("entregables") or [])
    )
    bloque_bonus = ""
    if bonus:
        filas = "".join(
            f'<li><span class="m"></span><div><b>{esc(b.get("nombre"))}</b> '
            f'<span>{esc(b.get("texto"))}</span></div></li>' for b in bonus
        )
        bloque_bonus = (f'<div class="bonus"><h3>Incluido sin coste</h3>'
                        f'<ul class="lista">{filas}</ul></div>')
    objeciones = "\n".join(
        f'<details><summary>{esc(o.get("pregunta"))}</summary>'
        f'<p>{esc(o.get("respuesta"))}</p></details>'
        for o in (datos.get("objeciones") or [])
    )
    opciones = "".join(
        f"<option>{esc(o)}</option>" for o in (form.get("opciones_cualificacion") or [])
    )
    cond = (garantia.get("condiciones") or []) if hay_garantia else []
    bloque_cond = ""
    if cond:
        bloque_cond = ('<div class="cond"><h3>Lo que necesitamos de ti</h3><ul>'
                       + "".join(f"<li>{esc(x)}</li>" for x in cond) + "</ul></div>")

    css = _CSS % {
        "fondo": c["fondo"], "texto": c["texto"], "acento": c["acento"],
        "suave": c["acento_suave"], "sec": c["secundario"],
        "linea": v["linea"], "linea_fuerte": v["linea_fuerte"],
        "panel": v["panel"], "acento_texto": v["acento_texto"],
        "rejilla": v["rejilla"], "ft": f_titulos, "fc": f_cuerpo,
    }

    fuentes = ""
    if url_fuentes:
        fuentes = (
            '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            f'<link href="{esc(url_fuentes)}" rel="stylesheet">'
        )

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(seo.get("titulo") or hero.get("titular") or nombre)}</title>
<meta name="description" content="{esc(seo.get("descripcion"))}">
<meta property="og:title" content="{esc(hero.get("titular"))}">
<meta property="og:description" content="{esc(seo.get("descripcion"))}">
<meta name="theme-color" content="{c["acento"]}">
{fuentes}
<script>
  // Rellena esto antes de publicar la página.
  window.LANDING_CONFIG = {{ META_PIXEL_ID: '', PRIVACY_URL: '', GRACIAS_URL: '', WHATSAPP: '' }};
</script>
<style>
{css}
</style>
</head>
<body data-estilo="{esc(marca["estilo"])}">
<header><div class="wrap">{cabecera}</div></header>

<div class="hero"><div class="wrap">
  <span class="eyebrow">{esc(hero.get("entradilla"))}</span>
  <h1>{esc(hero.get("titular"))}</h1>
  <p class="sub">{esc(hero.get("subtitular"))}</p>
  <a class="btn" href="#formulario">{boton}</a>
  <p class="nota">{esc(hero.get("nota"))}</p>
</div></div>

<section><div class="wrap prosa">
  <h2>{esc((datos.get("problema") or {}).get("titulo"))}</h2>
  {_parrafos((datos.get("problema") or {}).get("parrafos"))}
</div></section>

<section><div class="wrap">
  <h2>{esc((datos.get("mecanismo") or {}).get("titulo") or "Cómo trabajamos")}</h2>
  <p class="intro">{esc((datos.get("mecanismo") or {}).get("intro"))}</p>
  <ol class="pasos">
{pasos}
  </ol>
</div></section>

<section><div class="wrap">
  <h2>{esc(incluye.get("titulo") or "Qué incluye")}</h2>
  <ul class="lista">
{entregables}
  </ul>
  {bloque_bonus}
</div></section>

<section><div class="wrap prosa">
  <h2>{esc(prueba.get("titulo"))}</h2>
  <p>{esc(prueba.get("texto"))}</p>
  {f'<div class="fotos">[FOTOS] {esc(prueba.get("hueco_fotos"))}</div>' if prueba.get("hueco_fotos") else ""}
  {_testimonio(prueba)}
</div></section>

{f'''<section><div class="wrap">
  <h2>{esc(garantia.get("titulo"))}</h2>
  <div class="garantia"><blockquote>{esc(garantia.get("texto"))}</blockquote>
  {bloque_cond}
  </div>
</div></section>''' if hay_garantia else ""}

<section><div class="wrap">
  <h2>Preguntas que nos hacen</h2>
{objeciones}
</div></section>

<section class="cierre" id="formulario"><div class="wrap">
  <h2>{esc((datos.get("cierre") or {}).get("titulo"))}</h2>
  <p>{esc((datos.get("cierre") or {}).get("texto"))}</p>
  <form class="form" id="form" name="landing-{esc(_slug(datos.get("nombre_landing")))}" novalidate>
    <h3>{esc(form.get("titulo") or boton)}</h3>
    <label for="f-nombre">Nombre</label>
    <input id="f-nombre" name="nombre" autocomplete="name" required>
    <label for="f-email">Email</label>
    <input id="f-email" name="email" type="email" autocomplete="email" required>
    <label for="f-tel">Teléfono</label>
    <input id="f-tel" name="telefono" type="tel" autocomplete="tel" required>
    <label for="f-sit">{esc(form.get("pregunta_cualificacion") or "Tu situación")}</label>
    <select id="f-sit" name="situacion" required>
      <option value="">Elige una opción</option>{opciones}
    </select>
    <div class="cons">
      <input type="checkbox" id="f-cons" name="consent" required>
      <label for="f-cons">{esc(form.get("consentimiento"))}
        <a href="#" id="privacy-link" target="_blank" rel="noopener">Política de privacidad</a>
      </label>
    </div>
    <button type="submit" class="btn">{esc(form.get("boton") or boton)}</button>
    <p class="ok" id="ok">Recibido. Te llamamos en menos de 24 horas laborables.</p>
  </form>
</div></section>

<footer><div class="wrap">© {nombre}{f" · {ciudad}" if ciudad else ""}</div></footer>

<script>
(function () {{
  var C = window.LANDING_CONFIG || {{}};
  var l = document.getElementById('privacy-link');
  if (l && C.PRIVACY_URL) l.href = C.PRIVACY_URL;
  if (C.META_PIXEL_ID) {{
    !function(f,b,e,v,n,t,s){{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)}};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', C.META_PIXEL_ID); fbq('track', 'PageView');
  }}
  var f = document.getElementById('form');
  f.addEventListener('submit', function (e) {{
    e.preventDefault();
    var ok = true;
    f.querySelectorAll('[required]').forEach(function (el) {{
      var v = el.type === 'checkbox' ? el.checked : el.value.trim();
      el.classList.toggle('mal', !v);
      if (!v) ok = false;
    }});
    if (!ok) return;
    if (typeof fbq === 'function') fbq('track', 'Lead');
    f.querySelector('button').disabled = true;
    document.getElementById('ok').style.display = 'block';
    if (C.GRACIAS_URL) setTimeout(function () {{ location.href = C.GRACIAS_URL; }}, 800);
  }});
}})();
</script>
</body>
</html>"""


# El CSS vive aparte para que el cuerpo de la función se lea. Usa marcadores de
# formato de Python por nombre (%(nombre)s), no llaves, para no chocar con CSS.
_CSS = """  :root{--fondo:%(fondo)s;--texto:%(texto)s;--acento:%(acento)s;--suave:%(suave)s;--sec:%(sec)s;--linea:%(linea)s;--linea-fuerte:%(linea_fuerte)s;--panel:%(panel)s;--acento-texto:%(acento_texto)s;--radio:2px;--borde:1px;--max:760px;--ease:cubic-bezier(.16,1,.3,1);--ft:%(ft)s;--fc:%(fc)s}
  *{box-sizing:border-box}html{scroll-behavior:smooth}
  body{margin:0;background:var(--fondo);color:var(--texto);font-family:var(--fc);font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
  h1,h2,h3{font-family:var(--ft);font-weight:600;line-height:1.15;margin:0}p{margin:0}a{color:inherit}
  ::selection{background:var(--acento);color:var(--acento-texto)}
  /* Medida de lectura contenida a proposito: 60-70 caracteres por linea. */
  .wrap{max-width:var(--max);margin:0 auto;padding:0 24px}
  header{padding:20px 0;border-bottom:1px solid var(--linea)}
  .marca{font-family:var(--ft);font-size:19px;font-weight:600}
  .marca small{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--sec);font-weight:500;margin-top:2px}
  .logo img{display:block;max-height:44px;max-width:220px}
  .hero{padding:52px 0 60px}
  .eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:var(--sec);margin-bottom:18px}
  .eyebrow::before{content:"";width:22px;height:3px;background:var(--acento)}
  .hero h1{font-size:clamp(30px,5.4vw,46px);max-width:17ch}
  .hero .sub{margin-top:18px;font-size:18px;color:var(--sec);max-width:52ch}
  .btn{display:inline-flex;align-items:center;justify-content:center;min-height:52px;font-weight:600;font-size:17px;padding:16px 32px;border-radius:var(--radio);border:2px solid var(--acento);background:var(--acento);color:var(--acento-texto);text-decoration:none;cursor:pointer;transition:opacity .15s var(--ease),transform .15s var(--ease)}
  .btn:hover{opacity:.9}.btn:active{transform:translateY(1px)}
  .hero .btn{margin-top:28px}.nota{margin-top:12px;font-size:14px;color:var(--sec)}
  section{padding:56px 0;border-top:1px solid var(--linea)}
  section h2{font-size:clamp(23px,3.4vw,30px);max-width:24ch}
  section .intro{margin-top:14px;color:var(--sec);max-width:56ch}
  .prosa p{margin-top:16px;max-width:62ch;color:var(--sec)}
  .pasos{list-style:none;margin:28px 0 0;padding:0;border-top:1px solid var(--linea)}
  .pasos li{display:flex;gap:22px;padding:22px 0;border-bottom:1px solid var(--linea)}
  .num{font-size:26px;font-weight:700;line-height:1;color:var(--acento);flex:none;min-width:44px;font-variant-numeric:tabular-nums}
  .pasos h3{font-size:18px;font-weight:600;margin:0 0 5px}
  .pasos p{color:var(--sec);font-size:16px;max-width:52ch}
  .lista{list-style:none;margin:24px 0 0;padding:0;display:grid;gap:14px}
  .lista li{display:flex;gap:12px;align-items:flex-start}
  .lista .m{flex:none;width:14px;height:3px;background:var(--acento);margin-top:12px}
  .lista span{color:var(--sec)}
  .bonus{margin-top:28px;padding:22px 24px;background:var(--suave);border:var(--borde) solid var(--linea-fuerte);border-radius:var(--radio)}
  .bonus h3{font-size:13px;letter-spacing:.1em;text-transform:uppercase;margin:0 0 12px}
  .fotos{margin-top:24px;padding:36px 24px;border:2px dashed var(--linea-fuerte);text-align:center;font-size:15px;color:var(--sec)}
  .cita{margin:24px 0 0;padding:22px 26px;border-left:3px solid var(--acento);background:var(--panel);font-family:var(--ft);font-size:19px;line-height:1.45}
  .cita cite{display:block;margin-top:12px;font-family:var(--fc);font-style:normal;font-size:14px;color:var(--sec)}
  .aviso-ejemplo{display:inline-block;margin-bottom:12px;padding:3px 10px;background:#FDECC8;color:#8A6410;font-family:var(--fc);font-size:11px;font-weight:700;letter-spacing:.08em;border-radius:2px}
  .garantia{margin-top:24px;background:var(--suave);border:var(--borde) solid var(--linea-fuerte);border-radius:var(--radio);padding:28px}
  .garantia blockquote{margin:0;font-family:var(--ft);font-size:clamp(18px,2.4vw,22px);font-weight:600;line-height:1.35}
  .garantia .cond{margin-top:18px;padding-top:16px;border-top:1px solid var(--linea-fuerte)}
  .garantia .cond h3{font-size:13px;margin:0 0 10px;text-transform:uppercase;letter-spacing:.08em}
  .garantia ul{margin:0;padding-left:18px;font-size:15px}
  details{border-bottom:1px solid var(--linea);padding:16px 0}
  details:first-of-type{border-top:1px solid var(--linea);margin-top:24px}
  summary{cursor:pointer;font-weight:600;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px;min-height:44px;align-items:center;padding:4px 0}
  summary::-webkit-details-marker{display:none}
  summary::after{content:"+";font-size:22px;color:var(--acento)}
  details[open] summary::after{content:"\\2212"}
  details p{margin-top:10px;color:var(--sec);max-width:62ch}
  .cierre{text-align:center}.cierre h2{margin:0 auto;max-width:20ch}
  .cierre>.wrap>p{margin:16px auto 0;color:var(--sec);max-width:46ch}
  .form{margin:36px auto 0;max-width:520px;text-align:left;border:var(--borde) solid var(--linea-fuerte);border-radius:var(--radio);background:var(--fondo);padding:30px}
  .form h3{font-family:var(--ft);font-size:21px;margin:0 0 18px}
  .form label{display:block;font-size:14px;font-weight:600;margin:16px 0 6px}
  .form input,.form select{width:100%%;font-family:var(--fc);font-size:16px;min-height:48px;padding:12px 14px;border:1px solid var(--linea-fuerte);border-radius:var(--radio);background:var(--fondo);color:var(--texto)}
  .form input:focus,.form select:focus{outline:2px solid var(--acento);outline-offset:1px}
  .form .mal{border-color:#B3261E}
  .form .cons{display:flex;gap:10px;align-items:flex-start;margin-top:18px}
  .form .cons label{margin:0;font-weight:400;font-size:13px;color:var(--sec);line-height:1.5}
  .form .cons input{width:24px;height:24px;min-height:0;flex:none;margin-top:1px;accent-color:var(--acento)}
  .form .btn{width:100%%;margin-top:20px}
  .ok{display:none;margin-top:16px;font-weight:600;color:var(--acento)}
  footer{padding:28px 0;border-top:1px solid var(--linea);font-size:14px;color:var(--sec);text-align:center}
  @media(max-width:640px){.wrap{padding:0 20px}.hero{padding:32px 0 44px}.hero h1{font-size:29px;max-width:none;text-wrap:balance}section{padding:44px 0}.btn{width:100%%}.pasos li{gap:14px}.num{font-size:22px;min-width:34px}.form{padding:22px 18px}}

  body[data-estilo=editorial]{--radio:0}
  body[data-estilo=editorial] h1,body[data-estilo=editorial] section h2{font-weight:500;letter-spacing:-.01em}
  body[data-estilo=editorial] .eyebrow{font-family:var(--ft);font-style:italic;font-weight:400;font-size:17px}
  body[data-estilo=editorial] .num{font-family:var(--ft);font-size:32px;font-weight:500}
  body[data-estilo=editorial] .cita{background:transparent;font-style:italic}

  body[data-estilo=minimal]{--radio:4px}
  body[data-estilo=minimal] h1,body[data-estilo=minimal] h2{letter-spacing:-.02em}
  body[data-estilo=minimal] .eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:12px}
  body[data-estilo=minimal] .btn{border-width:1px}
  body[data-estilo=minimal] .cita{background:transparent;border:1px solid var(--linea);border-left:3px solid var(--acento)}

  body[data-estilo=brutalista]{--radio:0;--borde:2px}
  body[data-estilo=brutalista] header{border-bottom:2px solid var(--texto)}
  body[data-estilo=brutalista] section{border-top:3px solid var(--texto)}
  body[data-estilo=brutalista] h1{font-weight:700;letter-spacing:-.02em}
  body[data-estilo=brutalista] .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-weight:700;font-size:13px}
  body[data-estilo=brutalista] .btn{background:var(--texto);color:var(--fondo);border-color:var(--texto);box-shadow:6px 6px 0 var(--acento)}
  body[data-estilo=brutalista] .btn:hover{opacity:1;transform:translate(-2px,-2px);box-shadow:8px 8px 0 var(--acento)}
  body[data-estilo=brutalista] .bonus,body[data-estilo=brutalista] .garantia,body[data-estilo=brutalista] .form,body[data-estilo=brutalista] .cita,body[data-estilo=brutalista] .fotos{border:2px solid var(--texto)}
  body[data-estilo=brutalista] .form{box-shadow:8px 8px 0 var(--acento)}

  body[data-estilo=calido]{--radio:16px}
  body[data-estilo=calido] section{border-top:0;padding-top:28px}
  body[data-estilo=calido] .btn{border-radius:999px;box-shadow:0 14px 28px -14px var(--acento)}
  body[data-estilo=calido] .bonus,body[data-estilo=calido] .garantia,body[data-estilo=calido] .cita,body[data-estilo=calido] .fotos,body[data-estilo=calido] .form{border-radius:var(--radio);border-color:var(--linea)}
  body[data-estilo=calido] .pasos{border-top:0;display:grid;gap:10px}
  body[data-estilo=calido] .pasos li{background:var(--panel);border:0;border-radius:14px;padding:20px 22px}
  body[data-estilo=calido] .form input,body[data-estilo=calido] .form select{border-radius:10px}

  body[data-estilo=tecnico]{--radio:0;--borde:1.5px;background-image:linear-gradient(to right,%(rejilla)s 1px,transparent 1px),linear-gradient(to bottom,%(rejilla)s 1px,transparent 1px);background-size:36px 36px}
  body[data-estilo=tecnico] header,body[data-estilo=tecnico] section{border-color:var(--texto)}
  body[data-estilo=tecnico] .eyebrow,body[data-estilo=tecnico] .form label{font-family:ui-monospace,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.1em;font-size:12px}
  body[data-estilo=tecnico] .num{font-size:13px;font-weight:600;padding:5px 8px;border:1.5px solid var(--texto);min-width:0;height:fit-content;letter-spacing:.08em}
  body[data-estilo=tecnico] .bonus,body[data-estilo=tecnico] .garantia,body[data-estilo=tecnico] .form,body[data-estilo=tecnico] .fotos,body[data-estilo=tecnico] .cita{border:1.5px solid var(--texto)}

  body[data-estilo=clasico]{--radio:0}
  body[data-estilo=clasico] header,body[data-estilo=clasico] .hero{text-align:center}
  body[data-estilo=clasico] .logo img{margin:0 auto}
  body[data-estilo=clasico] .hero h1,body[data-estilo=clasico] .hero .sub{margin-left:auto;margin-right:auto}
  body[data-estilo=clasico] .eyebrow{justify-content:center;text-transform:uppercase;letter-spacing:.22em;font-size:12px;font-weight:500}
  body[data-estilo=clasico] .eyebrow::before{display:none}
  body[data-estilo=clasico] section{border-top:3px double var(--linea-fuerte)}
  body[data-estilo=clasico] section h2,body[data-estilo=clasico] section .intro{text-align:center;margin-left:auto;margin-right:auto}
  body[data-estilo=clasico] h1,body[data-estilo=clasico] section h2{font-weight:500}
  body[data-estilo=clasico] .btn{letter-spacing:.08em;text-transform:uppercase;font-size:15px}
  body[data-estilo=clasico] .cita{text-align:center;font-style:italic;background:transparent;border:0;border-top:1px solid var(--linea);border-bottom:1px solid var(--linea)}
"""


# ------------------------------------------------------------------- prueba

EJEMPLO = {
    "nombre_landing": "Chalets sin vender · propietarios particulares",
    "seo": {"titulo": "Tu chalet lleva meses sin venderse. Te decimos por qué",
            "descripcion": "Informe escrito con los motivos concretos por los que tu chalet no recibe ofertas. Te lo quedas aunque no nos contrates."},
    "hero": {
        "entradilla": "Para quien lleva más de dos meses con el anuncio publicado",
        "titular": "Tu chalet lleva meses publicado y no llega ninguna oferta seria",
        "subtitular": "Te entregamos por escrito los tres motivos concretos por los que no se está vendiendo. Te lo quedas aunque no nos contrates.",
        "boton": "Pedir el informe",
        "nota": "Sin compromiso. Respondemos en menos de 24 horas.",
    },
    "problema": {
        "titulo": "Al principio llamaban, y ahora no llama nadie",
        "parrafos": [
            "Publicaste el anuncio y las primeras semanas hubo movimiento. Visitas, alguna llamada, gente preguntando.",
            "Ahora pasan las semanas y no suena el teléfono. Y cuando suena, es alguien que quiere rebajarte cincuenta mil euros sin haber pisado la casa.",
            "Lo normal es pensar que es el mercado, o la época del año. Casi nunca lo es.",
        ],
    },
    "mecanismo": {
        "titulo": "Sistema Venta Activa",
        "intro": "Tres pasos, y el primero no te cuesta nada.",
        "pasos": [
            {"titulo": "Diagnóstico escrito", "texto": "Sabes en qué posición está tu anuncio y cómo se está vendiendo lo parecido a lo tuyo."},
            {"titulo": "Relanzamiento", "texto": "Tu casa vuelve al mercado con presentación nueva y campañas segmentadas."},
            {"titulo": "Filtro y seguimiento", "texto": "Solo pisan tu casa compradores verificados, y cada quince días recibes datos por escrito."},
        ],
    },
    "incluye": {
        "titulo": "Qué incluye",
        "entregables": [
            {"nombre": "Diagnóstico por escrito", "texto": "Los motivos concretos por los que no se ha vendido."},
            {"nombre": "Presentación nueva", "texto": "Fotografía profesional y, si el inmueble lo justifica, vídeo."},
            {"nombre": "Filtro de compradores", "texto": "Verificamos capacidad de compra antes de cada visita."},
            {"nombre": "Informe cada quince días", "texto": "Impresiones, visitas y comparativa de precio. No llamadas de cortesía."},
        ],
        "bonus": [],
    },
    "prueba": {
        "titulo": "Cómo trabajamos",
        "texto": "[DATO PENDIENTE: años de actividad y operaciones cerradas en la zona]",
        "hueco_fotos": "Pon aquí tres o cuatro fotos de viviendas que hayáis vendido en la zona.",
        "testimonio": "",
    },
    "garantia": {
        "titulo": "Si no vendemos, no cobramos",
        "texto": "No hay anticipo ni gastos de gestión. El único momento en que ganamos dinero es cuando tú cierras la venta.",
        "condiciones": ["Precio de salida acordado por escrito entre los dos",
                        "Acceso para las visitas con 24 horas de aviso"],
    },
    "objeciones": [
        {"pregunta": "¿Tengo que firmar una exclusiva larga?", "respuesta": "No. El contrato no tiene permanencia forzada y puedes cancelarlo cuando quieras, sin penalización."},
        {"pregunta": "¿El informe me obliga a algo?", "respuesta": "A nada. Te lo entregamos por escrito y es tuyo, contrates o no."},
        {"pregunta": "¿Qué pasa cuando dejo mis datos?", "respuesta": "Te llamamos en menos de 24 horas laborables para hacerte cuatro preguntas sobre la vivienda. Con eso preparamos el informe."},
    ],
    "cierre": {
        "titulo": "Sabe mejor por qué no se vende que seguir esperando",
        "texto": "Cada mes que pasa son gastos que sigues pagando por una casa que ya no quieres.",
        "boton": "Pedir el informe",
    },
    "formulario": {
        "titulo": "Pide tu informe",
        "pregunta_cualificacion": "¿Cuánto lleva publicado?",
        "opciones_cualificacion": ["Menos de un mes", "Entre uno y tres meses",
                                   "Más de tres meses", "Lo he retirado del mercado"],
        "boton": "Pedir el informe",
        "consentimiento": "Acepto que se traten mis datos para responderme.",
    },
}

EJEMPLO_AGENCIA = {"nombre": "Fincas del Vinalopó", "ciudad": "Elche"}
EJEMPLO_MARCA = {
    "colores": {"fondo": "#F6F1E7", "texto": "#2B2A26",
                "acento": "#B5562A", "secundario": "#7A756B"},
    "tipografia": {"titulos": "Fraunces", "cuerpo": "Inter"},
    "estilo": "editorial",
}

if __name__ == "__main__":
    print(render_landing(EJEMPLO, EJEMPLO_AGENCIA, EJEMPLO_MARCA))
