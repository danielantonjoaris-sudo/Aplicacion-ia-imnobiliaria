export const PREGUNTAS = {
  cliente_ideal: [
    {
      id: "tipo_propietario",
      texto: "¿Qué tipo de propietario quieres captar?",
      tipo: "multi",
      opciones: [
        "Ha heredado una vivienda",
        "Se separa o divorcia",
        "Tiene una segunda residencia parada",
        "Lleva meses intentando venderla por su cuenta",
        "Se le ha caducado con otra inmobiliaria",
        "Quiere cambiar de casa",
        "Inversor que rota piso",
      ],
      otra: true,
    },
    {
      id: "tipo_vivienda",
      texto: "¿Qué tipo de vivienda suele tener?",
      tipo: "single",
      opciones: ["Piso en el centro", "Piso en barrio", "Chalet o adosado", "Ático", "Local o solar", "De todo un poco"],
    },
    {
      id: "franja_precio",
      texto: "¿En qué franja de precio se mueve?",
      tipo: "single",
      opciones: ["Menos de 150.000 €", "150.000-250.000 €", "250.000-400.000 €", "Más de 400.000 €"],
    },
  ],
  oferta: [
    {
      id: "que_das",
      texto: "¿Qué le das al propietario que otros no le dan?",
      tipo: "multi",
      opciones: [
        "Valoración gratuita y sin compromiso",
        "Fotos y vídeo profesionales",
        "Home staging virtual",
        "Publicación en todos los portales",
        "Filtro de compradores para que no le entre cualquiera",
        "Acompañamiento en notaría y papeleo",
        "Informe mensual de cómo va su venta",
      ],
      otra: true,
    },
    {
      id: "tiempo_venta",
      texto: "¿Cuánto tardas de media en vender?",
      tipo: "single",
      opciones: ["Menos de 30 días", "1 a 3 meses", "3 a 6 meses", "Depende mucho"],
    },
    {
      id: "compromiso",
      texto: "¿Puedes comprometerte a algo por escrito?",
      tipo: "multi",
      opciones: [
        "Si no vendo en X días, no cobro",
        "Contrato sin permanencia, puede salir cuando quiera",
        "No cobro nada por adelantado",
        "Prefiero no comprometerme a nada",
      ],
    },
  ],
  anuncios: [
    {
      id: "accion",
      texto: "¿Qué quieres que haga la gente que vea el anuncio?",
      tipo: "single",
      opciones: [
        "Pedir una valoración gratis de su casa",
        "Descargar una guía para vender mejor",
        "Que me llamen o me escriban por WhatsApp",
        "Reservar una visita a su vivienda",
      ],
    },
    {
      id: "tono",
      texto: "¿Cómo quieres sonar?",
      tipo: "single",
      opciones: ["Cercano y de barrio", "Profesional y serio", "Directo y sin rodeos", "Experto de la zona"],
    },
    {
      id: "resultado_real",
      texto: "¿Tienes algún resultado real que podamos contar?",
      tipo: "texto",
      opcional: true,
      placeholder: "vendí 14 pisos en Chamberí el año pasado",
    },
  ],
  landing: [
    {
      id: "datos",
      texto: "¿Qué datos quieres pedirle?",
      tipo: "multi",
      opciones: ["Nombre", "Teléfono", "Email", "Dirección del inmueble", "Metros cuadrados", "Cuándo quiere vender"],
    },
    {
      id: "testimonios",
      texto: "¿Tienes reseñas o testimonios de clientes?",
      tipo: "texto",
      opcional: true,
      placeholder: "Pega aquí una reseña real. Si lo dejas vacío, generamos un ejemplo y lo marcamos como tal.",
    },
  ],
};

export const MENSAJES_TRABAJANDO = {
  cliente_ideal: [
    "Consultando el método de captación...",
    "Analizando propietarios de la zona...",
    "Identificando el momento vital...",
    "Construyendo el perfil...",
    "Redactando lo que le preocupa...",
  ],
  oferta: [
    "Consultando el método...",
    "Revisando la objeción de la comisión...",
    "Diseñando el mecanismo con nombre propio...",
    "Afinando la garantía...",
    "Redactando la propuesta...",
  ],
  anuncios: [
    "Consultando el método...",
    "Repartiendo los niveles de consciencia...",
    "Escribiendo los ganchos...",
    "Adelantándose a las objeciones...",
    "Rematando las llamadas a la acción...",
  ],
  landing: [
    "Consultando el método...",
    "Eligiendo la única acción de la página...",
    "Seleccionando los datos a pedir...",
    "Preparando la prueba social de la zona...",
    "Montando la landing...",
  ],
};
