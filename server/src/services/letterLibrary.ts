export interface CuratedLetter {
  category: string;
  title: string;
  content: string;
}

export const CURATED_LETTERS: CuratedLetter[] = [
  // 1. Amor profundo
  {
    category: "Amor profundo",
    title: "El infinito en tu mirada",
    content: "Hoy quiero recordarte lo muchísimo que te amo. Eres una parte preciosa de mi vida, mi lugar seguro y esa persona que hace que hasta los días más normales tengan algo especial. Quiero seguir eligiéndote, cuidándote y construyendo recuerdos contigo. Mi amor por ti no es solamente de hoy: es una promesa que quiero demostrarte cada día."
  },
  {
    category: "Amor profundo",
    title: "Raíces en el alma",
    content: "Amarte se ha convertido en la certeza más dulce y serena de mi existencia. No es un impulso pasajero ni una emoción que el viento pueda disipar; es un arraigo hondo, como el de los árboles centenarios que encuentran en la tierra su única razón de ser. Gracias por ser el refugio donde mi corazón descansa."
  },
  {
    category: "Amor profundo",
    title: "Más allá del tiempo",
    content: "A veces me detengo a pensar en cómo era mi vida antes de encontrarte, y todo parecía un preludio en silencio esperando tu melodía. Tu presencia no llena vacíos: ilumina rincones enteros que ni siquiera sabía que estaban a oscuras. Te amo con una profundidad que las palabras apenas logran esbozar."
  },
  {
    category: "Amor profundo",
    title: "La gravedad de nosotros",
    content: "Así como los planetas giran en armonía alrededor del sol sin cuestionar su órbita, mi mundo entero encontró su centro el día que entraste en él. Eres la fuerza que equilibra mis dudas y multiplica mis alegrías. Mi amor por ti es eterno y absoluto."
  },

  // 2. Ternura y cariño
  {
    category: "Ternura y cariño",
    title: "La caricia de tu sonrisa",
    content: "Basta ver tu sonrisa para que cualquier preocupación se desvanezca como niebla con el sol de la mañana. Tienes esa ternura única que desarma mis miedos y me devuelve la calma. Solo quería desearte un despertar tan dulce y luminoso como lo eres tú para mí."
  },
  {
    category: "Ternura y cariño",
    title: "El calor de tus abrazos",
    content: "Si pudiera detener el tiempo en un solo instante, elegiría ese segundo justo en el que me abrazas y el resto del mundo desaparece. En tus brazos no existe el frío, ni la prisa, ni el cansancio. Que hoy sientas todo el calor de mi corazón acompañando cada uno de tus pasos."
  },
  {
    category: "Ternura y cariño",
    title: "Detalles que enamoran",
    content: "Amo la forma en que tus ojos brillan cuando algo te emociona, el tono suave con el que me hablas y esa manera tan tuya de llenar de dulzura los pequeños momentos. Eres mi pensamiento más bonito de esta mañana y de todas las que vendrán."
  },
  {
    category: "Ternura y cariño",
    title: "Cuidar de tu paz",
    content: "Hoy le pido a la vida que te trate con la misma delicadeza y amor con la que tú tratas a todo lo que te rodea. Mereces risas sinceras, abrazos largos y la tranquilidad de saber cuánto te adoro en cada instante."
  },

  // 3. Gratitud por tener a esa persona
  {
    category: "Gratitud por tener a esa persona",
    title: "El mayor de mis regalos",
    content: "Despertar sabiendo que existes y que compartimos este camino es el motivo más grande de gratitud que tengo. Gracias por tu paciencia, por tu risa compartida y por enseñarme que el amor verdadero es cómplice, bondadoso y ligero."
  },
  {
    category: "Gratitud por tener a esa persona",
    title: "Gracias por coincidir",
    content: "En un universo con miles de millones de almas y posibilidades infinitas, haber coincidido contigo en este punto exacto del tiempo es el milagro más hermoso de mi vida. Gracias por elegirme cada día, tanto como yo te elijo a ti."
  },
  {
    category: "Gratitud por tener a esa persona",
    title: "Tu luz cotidiana",
    content: "Agradezco los cafés compartidos, las miradas que no necesitan explicación y la paz que me da escuchar tu respiración. Tenerte en mi vida no es casualidad; es el regalo más preciado que cuido con devoción en mi corazón."
  },
  {
    category: "Gratitud por tener a esa persona",
    title: "Gratitud serena",
    content: "Hoy doy gracias por todo lo que eres y por todo lo que provocas en mí. Gracias por convertir las dificultades en aprendizajes y las tardes sencillas en recuerdos inolvidables. Eres una bendición diaria."
  },

  // 4. Promesas de amor
  {
    category: "Promesas de amor",
    title: "Promesa en cada amanecer",
    content: "Te prometo que en cada amanecer renovaré mi compromiso de cuidarte, de escucharte con atención sincera y de buscar maneras de arrancarte una sonrisa. Mi promesa no depende del clima ni de los días fáciles: es un puente firme tendido hacia ti para siempre."
  },
  {
    category: "Promesas de amor",
    title: "Ser tu puerto seguro",
    content: "Te prometo que cuando las tormentas de la rutina o la incertidumbre se acerquen, en mí siempre encontrarás un puerto en calma. No prometo que nunca habrá vientos difíciles, pero sí que jamás tendrás que navegarlos en soledad."
  },
  {
    category: "Promesas de amor",
    title: "Crecer a tu lado",
    content: "Prometo aprender contigo, celebrar tus victorias como mías y tenderte la mano antes de que la pidas. Prometo que nuestro amor no será una rutina, sino un jardín que regaremos con paciencia, ilusión y respeto todos los días."
  },
  {
    category: "Promesas de amor",
    title: "Pacto de sinceridad",
    content: "Te prometo verdad en mis palabras, calidez en mis miradas y una lealtad que no conoce fisuras. Eres mi elección incondicional hoy, mañana y hasta donde la vida nos permita soñar."
  },

  // 5. Recuerdos y momentos especiales
  {
    category: "Recuerdos y momentos especiales",
    title: "El primer instante",
    content: "Todavía guardo nítido el recuerdo de la primera vez que conversamos. Había una magia sutil flotando en el aire, una sospecha bendita de que mi vida estaba a punto de cambiar para siempre. Y qué dicha haber acertado."
  },
  {
    category: "Recuerdos y momentos especiales",
    title: "Aquella risa interminable",
    content: "Hoy recordé aquella tarde en la que reímos hasta que nos dolió el estómago por una tontería. Esos instantes sin pretensiones, donde solo somos nosotros dos siendo libres y felices, son los tesoros más valiosos que atesoro en mi memoria."
  },
  {
    category: "Recuerdos y momentos especiales",
    title: "El hilo de nuestra historia",
    content: "Cada paso que hemos dado juntos ha ido tejiendo una historia que ningún libro podría igualar. Desde las primeras miradas tímidas hasta esta complicidad profunda que hoy nos une, cada recuerdo contigo es una joya brillante."
  },

  // 6. Admiración por su personalidad
  {
    category: "Admiración por su personalidad",
    title: "La belleza de tu fuerza",
    content: "No solo amo cómo te ves; me fascina tu valentía ante los retos, tu inteligencia serena y esa bondad genuina con la que tratas al mundo. Tienes un corazón noble y brillante que inspira a cualquiera que tenga la fortuna de conocerte."
  },
  {
    category: "Admiración por su personalidad",
    title: "Tu luz auténtica",
    content: "Admiro tu autenticidad inquebrantable. En un mundo donde muchos pretenden ser lo que no son, tú te muestras con una verdad cristalina y hermosa. Tu fortaleza silenciosa y tu generosidad me enamoran más con cada día que pasa."
  },
  {
    category: "Admiración por su personalidad",
    title: "Tu manera de ver el mundo",
    content: "Me encanta cómo encuentras poesía en lo cotidiano y cómo defiendes con pasión aquello en lo que crees. Estar a tu lado es aprender constantemente a mirar la vida con ojos más amables y sabios."
  },

  // 7. Apoyo en los días difíciles
  {
    category: "Apoyo en los días difíciles",
    title: "Estoy aquí para ti",
    content: "Si hoy sientes que el día pesa un poco más de lo habitual, recuerda que no tienes que ser fuerte todo el tiempo. Respira hondo. Estoy aquí para sostener tu mano, para escuchar tu silencio o para recordarte lo inmensamente capaz que eres."
  },
  {
    category: "Apoyo en los días difíciles",
    title: "Después de la lluvia",
    content: "Ninguna tormenta es eterna, y por muy gris que pinte el cielo, tu sol interior siempre vuelve a brillar. Tómate el tiempo que necesites; aquí estaré esperándote con un abrazo tibio y todo mi amor para aligerar la carga."
  },
  {
    category: "Apoyo en los días difíciles",
    title: "Tu refugio incondicional",
    content: "Cuando sientas cansancio, no dudes en apoyarte en mí. No hay error que pueda disminuir lo que vales, ni problema que juntos no podamos resolver paso a paso. Recuerda que mi amor te acompaña en cada segundo."
  },

  // 8. Motivación para comenzar el día
  {
    category: "Motivación para comenzar el día",
    title: "Despierta y brilla",
    content: "¡Buenos días, mi cielo! Hoy tienes una nueva página en blanco para llenar con tu energía luminosa. Sal y cómete el mundo con esa determinación que te caracteriza, sabiendo que desde temprano hay un corazón que late orgulloso de ti."
  },
  {
    category: "Motivación para comenzar el día",
    title: "La fuerza de tus alas",
    content: "Que este nuevo día te regale motivos para sonreír, puertas abiertas y satisfacciones merecidas. Confía en tu talento y en tu intuición: eres capaz de lograr cosas extraordinarias. Te amo y te admiro profundamente."
  },
  {
    category: "Motivación para comenzar el día",
    title: "Un café y todo mi amor",
    content: "Ojalá pudiera llevarte un café humeante y un beso en la frente antes de que comience tu rutina. Que hoy sientas mi cariño como un impulso invisible que te acompañe en cada tarea. ¡Que tengas un día maravilloso!"
  },

  // 9. Sueños y planes juntos
  {
    category: "Sueños y planes juntos",
    title: "El mapa que dibujamos",
    content: "Me llena de ilusión pensar en todos los lugares que aún no conocemos y que recorreremos tomados de la mano. Cada sueño compartido es una semilla que plantamos hoy y que veremos florecer en nuestro mañana."
  },
  {
    category: "Sueños y planes juntos",
    title: "Construyendo nuestro hogar",
    content: "Más allá de las paredes o las ciudades, he descubierto que mi verdadero hogar es donde tú estés. Sueño con los años que vendrán, con las risas compartidas y con la paz de envejecer sabiendo que elegimos el amor cada día."
  },
  {
    category: "Sueños y planes juntos",
    title: "Aventuras por escribir",
    content: "El futuro no me da miedo porque sé quién camina a mi lado. Tengo tantas ganas de seguir compartiendo proyectos, viajes inesperados, mañanas perezosas y grandes victorias contigo. Lo mejor de nuestra historia apenas comienza."
  },

  // 10. Amor a distancia
  {
    category: "Amor a distancia",
    title: "El mismo cielo",
    content: "Aunque los kilómetros nos separen físicamente en este instante, basta con mirar hacia arriba para recordar que compartimos el mismo cielo, el mismo sol y el mismo latido. La distancia solo hace que el anhelo de abrazarte sea más profundo y valioso."
  },
  {
    category: "Amor a distancia",
    title: "Un puente de pensamientos",
    content: "No hay mapa capaz de medir la cercanía de dos almas que se aman con verdad. Cada pensamiento mío vuela hacia ti con la velocidad de la luz para recordarte que estás en mí, hoy y en cada fracción de segundo."
  },

  // 11. Mensajes poéticos
  {
    category: "Mensajes poéticos",
    title: "Constelación en tu pecho",
    content: "Si la noche fuera eterna, bastaría el fulgor de tus ojos para inventar el día. En la quietud de tu regazo encontré la rima secreta que le faltaba a mi propia voz. Eres la poesía viva que el destino compuso para mí."
  },
  {
    category: "Mensajes poéticos",
    title: "El secreto del viento",
    content: "Le pedí al viento del alba que rozara tus mejillas con suavidad de pétalo, llevándote en su brisa el eco de mi suspiro más sincero: te amo con la delicadeza del rocío y la constancia de las olas del mar."
  },
  {
    category: "Mensajes poéticos",
    title: "Jardín eterno",
    content: "Cada caricia tuya es una flor que brota en la aridez del tiempo. Por ti aprendí que florecer no es cuestión de primaveras, sino de coincidir con quien hace que el alma desborde de vida."
  },

  // 12. Pequeñas promesas cotidianas
  {
    category: "Pequeñas promesas cotidianas",
    title: "Promesas simples",
    content: "Prometo guardarte el último pedazo del postre, escucharte aunque ya conozca la historia, recordarte lo hermosa que estás en tus días despeinados y no soltar tu mano en los paseos largos. En esas pequeñeces habita mi devoción."
  },
  {
    category: "Pequeñas promesas cotidianas",
    title: "La ternura de lo simple",
    content: "Prometo darte siempre un beso de buenos días, celebrar tus pequeños triunfos cotidianos y buscar tu mirada en las habitaciones llenas de gente para recordarte con un guiño que solo existes tú para mí."
  },

  // 13. Celebración de la relación
  {
    category: "Celebración de la relación",
    title: "Nuestro propio mundo",
    content: "Hemos creado un universo con nuestras propias bromas, nuestros silencios cómodos y nuestros códigos secretos. Celebrar nuestro amor no necesita fechas en el calendario: cada día a tu lado es una fiesta que merece aplausos y gratitud."
  },
  {
    category: "Celebración de la relación",
    title: "Equipo invencible",
    content: "Me encanta el equipo que formamos. Cómo nos complementamos, cómo nos cuidamos las espaldas y cómo convertimos cualquier obstáculo en una anécdota. Gracias por ser mi compañera, mi cómplice y el amor de mi vida."
  },

  // 14. Mensajes especiales para fechas importantes
  {
    category: "Mensajes especiales para fechas importantes",
    title: "Un hito de amor",
    content: "Hoy es un día especial para detener el reloj y mirar con ternura todo el camino recorrido. Cada paso, cada risa y cada lágrima compartida han hecho más sólida esta unión sagrada. Brindo por nosotros y por todo lo hermoso que aún nos espera."
  },
  {
    category: "Mensajes especiales para fechas importantes",
    title: "Celebrando tu existir",
    content: "En este día memorable, quiero renovar todos y cada uno de mis votos de ternura. Gracias por existir, por regalarme tu compañía y por ser la melodía más hermosa que jamás escuché. Te amo con todo mi ser."
  }
];
