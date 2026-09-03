# InmoMatic — PRD

## Problema original
Plataforma web (español de España) donde una agencia inmobiliaria contesta preguntas
sencillas y un equipo de 4 especialistas de IA construye su campaña de marketing de
captación completa. Cada especialista consulta una base de conocimiento (método) y cita
sus fuentes. Usuario: agente inmobiliario con poca cultura digital. Se demuestra en directo
ante 50 personas (proyectado), legible desde lejos, sin scroll horizontal.

## Arquitectura
- Backend FastAPI (`/app/backend`), modular:
  - `db.py` conexión Mongo + serializador (`limpiar`).
  - `llm.py` módulo único de LLM (Claude Sonnet 4.6 vía Emergent Universal Key) con
    `generar_json` (reintenta 1 vez y valida claves).
  - `retrieval.py` `recuperar_conocimiento(db, tema, tipo_campana, consulta)` — búsqueda
    por texto (la Universal Key no expone embeddings; fallback contemplado por la spec).
  - `specialists.py` `ejecutar_especialista(...)` función pura por parámetros. Anuncios se
    generan como 5 llamadas cortas en paralelo (asyncio.gather) para evitar el timeout de
    ingress (~60s).
  - `seed_data.py` 4 prompts_sistema + 12 fragmentos de base_conocimiento.
- Frontend React (`/app/frontend/src`): Sidebar + páginas Home, Campanas, TipoCampana,
  Inmobiliaria, Asistente (2 columnas, sin scroll en 1920x1080), Campana, Conocimiento,
  Prompts. Resultados renderizados por campos (nunca markdown en bruto).
- MongoDB colecciones (español): agencias, campanas, inmuebles, respuestas, resultados,
  base_conocimiento, prompts_sistema.

## Integraciones
- LLM: Claude Sonnet 4.6 (Emergent Universal Key, `EMERGENT_LLM_KEY` en backend/.env).
- Embeddings OpenAI: NO disponibles en la Universal Key de este entorno → recuperación por
  texto dentro de `recuperar_conocimiento` (encapsulado, nada cambia fuera).

## Implementado (03/06/2026)
- Flujo completo captación: tipo → datos inmobiliaria → 4 tramos (cliente ideal, oferta,
  anuncios x5, landing) con generación real por LLM, JSON validado y fuentes citadas.
- Rehacer crea versión nueva sin borrar la anterior; Aprobar avanza el tramo.
- Reutilizar cliente_ideal/oferta aprobados de campañas anteriores.
- Animación "trabajando" con mensajes rotativos + barra de progreso azul.
- Pantalla final con las 4 secciones y landing renderizada como vista previa real.
- Admin /conocimiento (CRUD fragmentos) y /prompts (editar prompts de sistema).
- Estética exacta: Sora/Manrope, paleta cerrada, dorado solo en marca/antetítulos.

## Estado / verificación
- Backend probado (testing agent 10/11; el fallo de anuncios por timeout se corrigió con
  generación paralela → ~20-26s). Flujo completo verificado por API y UI.
- Sin login (por diseño). Datos de arranque limpios y presentables.

## Backlog (no construido, anotado por la spec)
- P1: Flujo de venta de inmueble (hoy tarjeta "Próximamente").
- P2: Colección `inmuebles` creada pero sin uso en esta fase.
- P2: Migrar `@app.on_event('startup')` a lifespan.
