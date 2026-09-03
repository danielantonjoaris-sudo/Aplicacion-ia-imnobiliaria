"""Datos de arranque: prompts de sistema y base de conocimiento."""

_BASE_PROMPT = """Eres un especialista en marketing inmobiliario para el mercado ESPAÑOL. Escribes en español de España, natural, sin anglicismos de marketing y sin sonar a traducción. Trabajas con dos ideas del método: los NIVELES DE CONSCIENCIA del propietario (inconsciente del problema, consciente del problema, consciente de la solución, consciente de tu propuesta) y la construcción de un MECANISMO ÚNICO con nombre propio que explique por qué tu forma de vender funciona.

Reglas que no incumples:
- Sé concreto con la zona y el perfil: nombra barrios, pueblos y situaciones reales de esa zona. Nada de frases de relleno que valgan para cualquier inmobiliaria.
- Apóyate en los fragmentos del método que recibes; que se note que los usas.
- Marca con [Supuesto] cualquier dato que te estés inventando (una cifra, un barrio que no te han dado, un dato de mercado).
- Prohibido el lenguaje corporativo vacío: nada de "soluciones a medida", "tu socio de confianza" ni "pasión por el sector".
- Devuelves EXCLUSIVAMENTE el objeto JSON con el esquema exacto que se te pide, sin texto alrededor y sin markdown.
"""

PROMPTS = [
    {
        "especialista": "cliente_ideal",
        "tipo_campana": "captacion",
        "contenido": _BASE_PROMPT + """
Tu trabajo: construir el retrato del PROPIETARIO ideal a captar (el que quiere vender y aún no te ha llamado). Piensa en su momento vital, en el nivel de consciencia en el que está y en lo que de verdad le quita el sueño. Las frases de "que_le_preocupa" tienen que sonar a algo que ese propietario diría en voz alta, en primera persona. "donde_encontrarle" debe ser accionable para la zona concreta.
""",
    },
    {
        "especialista": "oferta",
        "tipo_campana": "captacion",
        "contenido": _BASE_PROMPT + """
Tu trabajo: diseñar la OFERTA de captación en exclusiva. Convierte lo que hace la agencia en un MECANISMO ÚNICO con nombre propio, creíble y fácil de recordar. La promesa principal debe atacar la objeción real del propietario (la comisión, el miedo a atarse, la desconfianza tras una mala experiencia). El "eliminador_de_riesgo" es la garantía que desarma la objeción. Explica por qué es creíble sin prometer imposibles.
""",
    },
    {
        "especialista": "anuncios",
        "tipo_campana": "captacion",
        "contenido": _BASE_PROMPT + """
Tu trabajo: escribir EXACTAMENTE 5 anuncios para captar propietarios, cada uno desde un ángulo y un nivel de consciencia distinto. El gancho vive en las tres primeras líneas: tiene que frenar el scroll de alguien que ni siquiera se había planteado vender contigo. Adelántate a la objeción en vez de esconderla. Respeta el tono elegido y la acción que debe hacer el propietario. Nada de titulares genéricos tipo "vende tu casa con nosotros".
""",
    },
    {
        "especialista": "landing",
        "tipo_campana": "captacion",
        "contenido": _BASE_PROMPT + """
Tu trabajo: definir la LANDING de captación. Una sola acción por página. Pide solo los datos imprescindibles: cada campo de más espanta al propietario. Los beneficios se escriben desde lo que gana el propietario, no desde lo que hace la agencia. La prueba social debe ser de la ZONA concreta, no un testimonio genérico. Si no te dan testimonios, redacta uno creíble y márcalo con es_ejemplo=true.
""",
    },
]

FRAGMENTOS = [
    # ---- cliente_ideal ----
    {
        "fuente": "Método InmoMatic",
        "tipo": "clase",
        "titulo": "Clase 2 — Los cinco momentos que disparan la decisión de vender",
        "temas": ["cliente_ideal"],
        "tipo_campana": "captacion",
        "contenido": "Casi nadie vende una vivienda por gusto; vende porque la vida le empuja. Hay cinco momentos que concentran la mayoría de las captaciones en exclusiva: una herencia que hay que repartir entre hermanos, una separación que obliga a liquidar el piso común, una mudanza por trabajo o por familia, una segunda residencia que se ha convertido en gasto y sofoco, y el jubilado que quiere pasar de un piso grande a algo pequeño y sin escaleras. Entender en cuál de esos momentos está el propietario cambia todo el mensaje: al que hereda le hablas de acompañamiento entre herederos y de papeleo; al que se separa, de rapidez y discreción; al de la segunda residencia, de dejar de pagar por algo que no usa. El error del sector es tratar a todos como 'un propietario que quiere vender'. No existe. Existe una persona en un momento concreto de su vida, y ese momento es el que decide si te llama a ti o sigue mirando el portal con la casa colgada seis meses. Detecta el momento y háblale de su momento, no de tus servicios.",
    },
    {
        "fuente": "Método InmoMatic",
        "tipo": "clase",
        "titulo": "Clase 4 — Por qué el propietario que lo intenta solo no te llama",
        "temas": ["cliente_ideal"],
        "tipo_campana": "captacion",
        "contenido": "El propietario que ha colgado su piso en los portales por su cuenta no es que desconfíe de ti: es que cree que ya lo tiene resuelto. Ha puesto cuatro fotos, un precio que le dijo el vecino y espera. Está en el nivel de consciencia más difícil: consciente del objetivo (vender) pero inconsciente del problema (que lo está haciendo mal). Llamarle para ofrecerle 'tus servicios de intermediación' le suena a que quieres cobrarle una comisión por algo que él ya está haciendo gratis. Lo que le mueve no es tu argumentario, es la fricción acumulada: las visitas de curiosos, los que regatean sin intención de comprar, las llamadas a deshoras, los meses pasando sin una oferta seria. Tu mensaje no debe atacar su decisión de hacerlo solo, sino nombrar esa fricción antes que él y ofrecerle un dato que no tiene: cuántas visitas reales necesita su tipo de piso para cerrar, o por qué su anuncio se ha hundido en el portal. Le cambias de idea con información que le falta, no con una oferta comercial.",
    },
    {
        "fuente": "Método InmoMatic",
        "tipo": "ponencia",
        "titulo": "Clase 6 — El propietario que ya estuvo con otra agencia y le fue mal",
        "temas": ["cliente_ideal"],
        "tipo_campana": "captacion",
        "contenido": "Un propietario al que se le ha caducado el encargo con otra inmobiliaria es oro y es un campo de minas a la vez. Oro porque ya ha aceptado trabajar con un profesional: no tienes que convencerle de que las agencias sirven. Campo de minas porque llega quemado: le prometieron y no cumplieron, le colgaron el cartel y desapareció, le pidieron exclusiva y no hubo ni una visita en dos meses. Si repites el mismo discurso de la agencia anterior ('somos expertos de la zona, tenemos cartera de compradores'), le confirmas que todos sois iguales. La palanca aquí es la transparencia radical: reconoce lo que probablemente le pasó, explícale qué se hizo mal y comprométete a lo contrario por escrito. No prometas más, promete distinto y medible: informe cada quince días, un número de visitas garantizado, salir del contrato cuando quiera. Este propietario no compra promesas, compra pruebas de que esta vez será diferente.",
    },
    # ---- oferta ----
    {
        "fuente": "Método InmoMatic",
        "tipo": "clase",
        "titulo": "Clase 9 — La garantía que desarma la objeción del precio",
        "temas": ["oferta"],
        "tipo_campana": "captacion",
        "contenido": "La objeción que hunde la mayoría de las captaciones no es 'no quiero vender', es 'no quiero pagar un 3, un 5 o un 7 por ciento a una inmobiliaria'. El error es defender la comisión explicando todo lo que haces; cuanto más lo justificas, más caro suena. La garantía le da la vuelta: cuando trasladas el riesgo de tu bolsillo al del propietario, la comisión deja de ser un gasto y pasa a ser una apuesta compartida. 'Si no vendo en X días, no cobro' funciona porque el propietario piensa: si tan seguro está, algo tendrá. 'No cobro nada por adelantado' elimina el miedo a pagar por nada. 'Contrato sin permanencia' quita la sensación de trampa. La garantía no es un truco de marketing: es la forma más honesta de decir que confías en tu propio trabajo. Eso sí, solo puedes garantizar lo que controlas. Garantiza actividad (visitas, informes, difusión), no un resultado que depende del mercado, o acabarás incumpliendo y perdiendo lo único que vale: tu palabra.",
    },
    {
        "fuente": "Método InmoMatic",
        "tipo": "clase",
        "titulo": "Clase 11 — Por qué la valoración gratuita ya no diferencia a nadie",
        "temas": ["oferta"],
        "tipo_campana": "captacion",
        "contenido": "Ofrecer 'valoración gratuita y sin compromiso' era una ventaja hace quince años. Hoy la ofrece todo el mundo, incluidos los portales con un botón automático, así que ha dejado de ser un motivo para elegirte: es el mínimo que se espera. Si tu oferta empieza y termina en la valoración gratis, para el propietario eres intercambiable con las otras cuatro inmobiliarias de su calle. Lo que sí diferencia es convertir esa valoración en un diagnóstico con nombre y con entregable: no 'te digo cuánto vale', sino 'te entrego un informe de por qué tu piso lleva seis meses sin venderse y qué tres cosas cambiaríamos'. Le das algo tangible que se puede quedar aunque no te contrate. Eso construye autoridad y reciprocidad al mismo tiempo. La regla es sencilla: si algo lo ofrece gratis cualquiera, no lo pongas en el centro de tu oferta; ponlo como el primer paso de un mecanismo propio que sí es tuyo.",
    },
    {
        "fuente": "Método InmoMatic",
        "tipo": "ponencia",
        "titulo": "Clase 13 — Cómo construir un mecanismo propio con nombre",
        "temas": ["oferta"],
        "tipo_campana": "captacion",
        "contenido": "El propietario no compara servicios sueltos, compara métodos. Si le enseñas una lista de cosas que haces (fotos, portales, filtro de compradores, acompañamiento en notaría), tiene que evaluarlas una a una y compararlas con las de la competencia. Si le das un mecanismo con nombre propio —por ejemplo 'El Sistema de Venta en 45 días' o 'El Método Tres Filtros'—, deja de comparar servicios y empieza a comprar un proceso. El nombre hace tres cosas: convierte lo intangible en algo que se recuerda y se recomienda al cuñado, ordena tus servicios en pasos con una lógica ('primero diagnosticamos, luego preparamos, luego filtramos'), y te posiciona como el dueño de una forma de hacer las cosas, no como uno más que también hace fotos. El nombre no puede ser humo: cada paso tiene que corresponder a algo real que haces. Un buen mecanismo es tu argumentario ordenado y bautizado, y es lo que hace que dos agencias con los mismos servicios no valgan lo mismo a ojos del propietario.",
    },
    # ---- anuncios ----
    {
        "fuente": "Método InmoMatic",
        "tipo": "clase",
        "titulo": "Clase 16 — Los niveles de consciencia aplicados al propietario español",
        "temas": ["anuncios"],
        "tipo_campana": "captacion",
        "contenido": "No le puedes hablar igual a un propietario que ni se plantea vender que a uno que ya está pidiendo valoraciones. Trabajamos cuatro niveles. Inconsciente del problema: cree que su piso se venderá solo colgándolo; aquí el anuncio abre los ojos con un dato ('el 70% de los pisos que se cuelgan sin preparar bajan de precio a los tres meses' [Supuesto si no hay dato local]). Consciente del problema: sabe que algo no funciona pero no sabe qué; aquí el anuncio nombra el problema concreto y promete un diagnóstico. Consciente de la solución: sabe que necesita una agencia pero duda de cuál; aquí compites con tu mecanismo y tu garantía. Consciente de tu propuesta: ya te conoce y le falta el empujón; aquí va la oferta directa y la urgencia real. El error del sector es escribir todos los anuncios para el último nivel, cuando la mayoría de propietarios está en los dos primeros. Reparte tus cinco anuncios entre niveles y multiplicarás a cuánta gente llegas.",
    },
    {
        "fuente": "Método InmoMatic",
        "tipo": "clase",
        "titulo": "Clase 18 — El gancho vive en las tres primeras líneas",
        "temas": ["anuncios"],
        "tipo_campana": "captacion",
        "contenido": "En el feed, un propietario decide en un segundo y medio si sigue leyendo o pasa de largo. Todo tu anuncio depende de las tres primeras líneas, porque el resto ni se ve si esas fallan. Las tres líneas que funcionan no hablan de ti, hablan de él y de su situación: mencionan su zona ('Si tienes un piso en Delicias que no acaba de venderse...'), tocan una tensión concreta ('...y ya estás cansado de enseñárselo a curiosos que solo vienen a cotillear') y prometen algo distinto en la tercera. Evita empezar por el nombre de la agencia, por 'somos líderes' o por una foto de fachada bonita sin contexto: eso es hablar de ti antes de haberte ganado el segundo de atención. Un buen gancho se puede leer en voz alta y suena a algo que le dirías a un vecino en el portal, no a un folleto. Si las tres primeras líneas no harían que TÚ pararas, reescríbelas antes de tocar nada más.",
    },
    {
        "fuente": "Método InmoMatic",
        "tipo": "qa",
        "titulo": "Clase 20 — Adelantarse a la objeción funciona mejor que esconderla",
        "temas": ["anuncios"],
        "tipo_campana": "captacion",
        "contenido": "El instinto dice que si el propietario teme la comisión, mejor no mencionarla en el anuncio. Es al revés. La objeción que no nombras no desaparece: se queda en su cabeza mientras lee y contamina todo lo demás. Cuando eres tú quien la pone sobre la mesa antes que él ('Sí, cobramos honorarios, y te vamos a explicar por qué te sale más caro venderlo solo'), pasan dos cosas: le quitas el arma y ganas credibilidad, porque solo se atreve a nombrar la pega quien tiene una buena respuesta. Lo mismo con la exclusiva ('Pedimos exclusiva, y en treinta segundos entiendes por qué te conviene a ti, no a nosotros') o con el miedo a atarse. Adelantarte no es regodearte en lo negativo: es tocar la objeción una vez, con seguridad, y girar inmediatamente hacia el beneficio. Un anuncio que se atreve a nombrar la duda del propietario vende más confianza que diez anuncios que solo cuentan maravillas.",
    },
    # ---- landing ----
    {
        "fuente": "Método InmoMatic",
        "tipo": "clase",
        "titulo": "Clase 23 — Una sola acción por página",
        "temas": ["landing"],
        "tipo_campana": "captacion",
        "contenido": "La landing de captación tiene un único trabajo: conseguir que el propietario deje sus datos para que le llames. Cada elemento que compite con esa acción la debilita. El error habitual es meter en la misma página el teléfono, el WhatsApp, el formulario, un enlace al catálogo de pisos en venta, las redes sociales y un botón de 'conócenos'. El propietario, ante tantas salidas, elige la más fácil: irse. Una landing que convierte tiene una sola llamada a la acción, repetida arriba y abajo, y todo lo demás está al servicio de esa acción: el titular la justifica, los beneficios la hacen deseable, la prueba social la hace segura. Nada de menú de navegación que le invite a pasearse. Si el objetivo es que pida una valoración, no le des la opción de descargarse una guía en la misma página: divide y perderás. La disciplina de quitar es lo que sube la conversión, no la de añadir. Menos botones, más solicitudes.",
    },
    {
        "fuente": "Método InmoMatic",
        "tipo": "clase",
        "titulo": "Clase 25 — Qué datos pedir y cuáles espantan al propietario",
        "temas": ["landing"],
        "tipo_campana": "captacion",
        "contenido": "Cada campo del formulario es una fricción, y el propietario abandona cuando le pides más de lo que está dispuesto a dar a cambio de lo que ofreces. La regla es proporcionalidad: si ofreces una valoración, con nombre, teléfono y dirección del inmueble basta, porque sin la dirección no puedes valorar y el propietario lo entiende. Pedirle el email además del teléfono ya empieza a rascar; pedirle metros, año de construcción, número de habitaciones y cuándo quiere vender en el primer formulario es hacerle rellenar una ficha catastral antes de fiarse de ti. Esos datos se recogen en la llamada, no en la landing. Hay campos que directamente espantan: el DNI, el rango de hipoteca pendiente, preguntas que huelen a que le vas a vender algo. Pide lo mínimo para poder dar el siguiente paso y deja claro qué va a pasar cuando envíe ('te llamamos en 24 horas, sin compromiso'). Un formulario corto con expectativa clara convierte más que uno largo que promete el oro y el moro.",
    },
    {
        "fuente": "Método InmoMatic",
        "tipo": "documento",
        "titulo": "Clase 27 — La prueba social de zona concreta frente al testimonio genérico",
        "temas": ["landing"],
        "tipo_campana": "captacion",
        "contenido": "Un testimonio que dice 'Muy profesionales, todo perfecto. — María G.' no convence a nadie, porque podría estar inventado y no le dice nada al propietario sobre su caso. La prueba social que mueve es la que el propietario reconoce como suya: la zona, el tipo de piso y el resultado concreto. 'Vendimos el piso de la familia Ruiz en la calle Sagunto en 38 días, un tercero sin ascensor que llevaba ocho meses colgado' vale cien veces más que cinco estrellas genéricas, porque el propietario del barrio piensa 'ese es como el mío'. La especificidad es lo que hace creíble el testimonio: nombres de calle, plazos reales, el problema que tenía la vivienda antes. Si además puedes enseñar una foto real o el nombre completo con permiso, mejor. Cuando no tengas testimonios reales todavía, redacta uno de ejemplo verosímil y márcalo con claridad como ejemplo, nunca lo hagas pasar por real: una prueba social falsa descubierta destruye más confianza que la que construye. La prueba social es un espejo; el propietario tiene que verse en él.",
    },
]
