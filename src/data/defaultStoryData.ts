import { GalleryResource, StoryConfig } from '../types/story';
import { VOICE_PROFILES_REGISTRY } from './voiceProfiles';

export const PROVIDED_SHREK_IMAGES = {
  introScene: 'https://github.com/daviiddazas/Shreck2/blob/main/1.jpg?raw=true',
  shrekPoseA:
    'https://github.com/daviiddazas/Shreck2/blob/main/59f877cd3cec115efb362383.png?raw=true',
  shrekPoseB:
    'https://github.com/daviiddazas/Shreck2/blob/main/59f8782b3cec115efb362386.png?raw=true',
  gato: 'https://github.com/daviiddazas/Shreck2/blob/main/Gato.jpg?raw=true',
  hada: 'https://github.com/daviiddazas/Shreck2/blob/main/ada.jpg?raw=true',
  bebes: 'https://github.com/daviiddazas/Shreck2/blob/main/bebes.jpg?raw=true',
  burro: 'https://github.com/daviiddazas/Shreck2/blob/main/burro.jpg?raw=true',
  fionaCombate:
    'https://github.com/daviiddazas/Shreck2/blob/main/fiona%20combate.png?raw=true',
  fiona: 'https://github.com/daviiddazas/Shreck2/blob/main/fiona.jpg?raw=true',
  jengiAlt: 'https://github.com/daviiddazas/Shreck2/blob/main/jegi%202.png?raw=true',
  jengi: 'https://github.com/daviiddazas/Shreck2/blob/main/jengi.png?raw=true',
  principe:
    'https://github.com/daviiddazas/Shreck2/blob/main/principe.jpg?raw=true',
  shrek2:
    'https://github.com/daviiddazas/Shreck2/blob/main/shreck%202.jpg?raw=true',
  shrekMain:
    'https://github.com/daviiddazas/Shreck2/blob/main/shreck.webp?raw=true',
} as const;

export const TEACHER_IMAGE_GALLERY: GalleryResource[] = [
  { id: 'img-1', label: 'Escena de cuento', url: PROVIDED_SHREK_IMAGES.introScene },
  { id: 'img-shrek-main', label: 'Shrek en el pantano', url: PROVIDED_SHREK_IMAGES.shrekMain },
  { id: 'img-shrek-2', label: 'Shrek retrato', url: PROVIDED_SHREK_IMAGES.shrek2 },
  { id: 'img-shrek-a', label: 'Shrek aventura', url: PROVIDED_SHREK_IMAGES.shrekPoseA },
  { id: 'img-shrek-b', label: 'Shrek guardia', url: PROVIDED_SHREK_IMAGES.shrekPoseB },
  { id: 'img-burro', label: 'Burro', url: PROVIDED_SHREK_IMAGES.burro },
  { id: 'img-fiona', label: 'Princesa Fiona', url: PROVIDED_SHREK_IMAGES.fiona },
  { id: 'img-fiona-combate', label: 'Fiona en combate', url: PROVIDED_SHREK_IMAGES.fionaCombate },
  { id: 'img-gato', label: 'Gato con Botas', url: PROVIDED_SHREK_IMAGES.gato },
  { id: 'img-hada', label: 'Hada Madrina', url: PROVIDED_SHREK_IMAGES.hada },
  { id: 'img-principe', label: 'Príncipe Encantador', url: PROVIDED_SHREK_IMAGES.principe },
  { id: 'img-jengi', label: 'Jengibre (Jengi)', url: PROVIDED_SHREK_IMAGES.jengi },
  { id: 'img-jengi-2', label: 'Jengibre expresión', url: PROVIDED_SHREK_IMAGES.jengiAlt },
  { id: 'img-bebes', label: 'Bebés ogro y familia', url: PROVIDED_SHREK_IMAGES.bebes },
];

export const DEFAULT_SCENE_STYLE_INSTRUCTIONS = `Actúa como director y elenco de doblaje dando vida a una historia interactiva de Shrek en español latinoamericano natural y neutral.
[Instrucciones de estilo]
Cada personaje debe conservar su identidad vocal única (género, registro, ritmo, calidez y personalidad), evitando entonaciones idénticas o robóticas.
Usa pausas naturales, respiraciones breves y transiciones espontáneas como en una escena de cine animado.
No leas los nombres de los personajes ni las acotaciones entre paréntesis; úsalas solo para modular la interpretación.`;

export const DEFAULT_SCENE_SCRIPT = `Narrador: (Cálido y cinematográfico, preparando la escena) Cuando Shrek llegó al pantano, encontró a un visitante que parecía tener muchas cosas que contar.
Burro: (Rápido, emocionado y con mucha energía) ¡Shrek! ¡Amigo! ¡Tenemos que hablar! ¡Y tengo muchísimas cosas que contarte!
Shrek: (Grave, lento y algo impaciente) ¿No puedes tener un solo minuto de tranquilidad?
Burro: (Espontáneo y bromista, cambiando de tono al instante) ¡Claro que sí! Bueno... ¡quizás después!`;

export const FULL_CAST_SCENE_SCRIPT = `Narrador: (Medio-grave, cálido y cinematográfico) En el corazón del pantano, todos los habitantes del reino se reunieron para probar su voz.
Shrek: (Grave, seco y algo impaciente) ¿Una reunión en mi pantano? Genial... justo lo que necesitaba antes de desayunar.
Burro: (Medio-agudo, rápido y entusiasta) ¡Ay, Shrek, no seas amargado! ¡Si esto va a sonar increíble, hasta podemos cantar después!
Fiona: (Femenina media, clara y firme) Ordenémonos un momento. Si cada quien habla claro y con firmeza, esta historia va a cobrar vida.
Gato con Botas: (Medio, cálido, pausado y teatral) Por supuesto, mi señora... Aunque admito que una pizca de misterio y elegancia siempre eleva la escena.
Lord Farquaad: (Medio-agudo, tenso y autoritario) ¡Silencio! Exijo precisión absoluta. En mis dominios nadie improvisa sin mi autorización.
Hada Madrina: (Femenina suave, melosa y calculadora) Querido, no te alteres... Con un poco de encanto y las palabras justas, todos terminan haciendo lo que conviene.
Príncipe Encantador: (Medio-agudo, pulido y vanidoso) Francamente, es obvio quién tiene la voz más deslumbrante y refinada de todo Muy Muy Lejano.
Jengibre: (Agudo, rápido, nervioso y valiente) ¡Oye, no me subestimen por ser pequeño! ¡Soy rápido, valiente y tengo más carácter que medio castillo!`;

export const DEFAULT_STORY_CONFIG: StoryConfig = {
  version: 5,
  bookTitle: 'SHREK',
  bookSubtitle: 'UN VIAJE POR LOS REINOS DE MUY MUY LEJANO',
  coverTagline: 'Cada historia tiene un comienzo. Cada camino es una nueva aventura.',
  openingNarration:
    'Érase una vez, en un reino muy, muy lejano, un ogro que disfrutaba de la calma de su pantano. Pero aquella mañana, su historia estaba a punto de cambiar para siempre.',
  characterVoices: structuredClone(VOICE_PROFILES_REGISTRY),
  audioSettings: {
    masterVolume: 0.82,
    musicEnabled: true,
    sfxEnabled: true,
    voiceEnabled: true,
    autoNarrate: true,
    geminiBoardEnabled: false,
    customAmbientMusicUrl: '',
    customDiscoverySfxUrl: '',
  },
  stations: [
    {
      id: 1,
      canvasOrder: 1,
      canvasTitle: '1. PROPÓSITO',
      realmId: 'pantano',
      realmName: 'El Pantano de Shrek',
      worldPosition: { x: -17.5, z: 9.5 },
      narratorIntro:
        'Cuando Shrek regresó al pantano, encontró a un visitante que parecía tener muchas cosas que contar. Aquí comienza el propósito de nuestra historia.',
      narratorActingInstruction:
        'Narración cálida y cercana, con pausa breve antes del diálogo para despertar curiosidad.',
      modalTitle: '1. Propósito',
      modalSummary:
        'Contenido provisional de orientación: define aquí por qué existe esta narrativa transmedia, qué transformación busca lograr y cuál es la intención central del proyecto.',
      imageUrl: PROVIDED_SHREK_IMAGES.shrekMain,
      videoUrl: '',
      intervention: {
        characterId: 'burro',
        characterName: 'Burro',
        dialogue:
          '¡Shrek! ¡Amigo! ¡Tenemos que hablar! ¡Y tengo muchísimas cosas que contarte!',
        actingInstruction:
          'Velocidad rápida, entusiasmo alto y entonación ascendente de compañero inseparable.',
        portraitUrl: PROVIDED_SHREK_IMAGES.burro,
        customAudioUrl: '',
      },
      dialogueTurns: [
        {
          characterId: 'burro',
          characterName: 'Burro',
          dialogue:
            '¡Shrek! ¡Amigo! ¡Tenemos que hablar! ¡Y tengo muchísimas cosas que contarte!',
          actingInstruction:
            'Habla rápido, con entusiasmo desbordante, energía brillante y espontaneidad.',
          portraitUrl: PROVIDED_SHREK_IMAGES.burro,
        },
        {
          characterId: 'shrek',
          characterName: 'Shrek',
          dialogue: '¿No puedes tener un solo minuto de tranquilidad?',
          actingInstruction:
            'Ritmo lento, registro grave y ronco, con impaciencia seca pero natural.',
          portraitUrl: PROVIDED_SHREK_IMAGES.shrekPoseA,
        },
        {
          characterId: 'burro',
          characterName: 'Burro',
          dialogue: '¡Claro que sí! Bueno... ¡quizás después de conseguir unos waffles!',
          actingInstruction:
            'Cambio rápido de emoción: entusiasta, bromista y suelto.',
          portraitUrl: PROVIDED_SHREK_IMAGES.burro,
        },
      ],
    },
    {
      id: 2,
      canvasOrder: 2,
      canvasTitle: '2. AUDIENCIA',
      realmId: 'bosque_encantado',
      realmName: 'El Bosque Encantado',
      worldPosition: { x: -12.5, z: 4.0 },
      narratorIntro:
        'Al adentrarse en el Bosque Encantado, las criaturas murmuraron entre la niebla. Toda aventura necesita saber quién la escucha.',
      narratorActingInstruction:
        'Ritmo ligeramente más lento, tono misterioso y envolvente entre árboles.',
      modalTitle: '2. Audiencia',
      modalSummary:
        'Contenido provisional de orientación: describe el público principal del relato, sus intereses, hábitos mediáticos y cómo se conecta emocionalmente con el universo narrativo.',
      imageUrl: PROVIDED_SHREK_IMAGES.introScene,
      videoUrl: '',
      intervention: {
        characterId: 'shrek',
        characterName: 'Shrek',
        dialogue:
          'Los ogros somos como las cebollas... y nuestra audiencia también tiene sus capas. No esperes discursos bonitos, pero sí algo de verdad.',
        actingInstruction:
          'Voz grave y pausada, humor seco e ironía tranquila con un matiz sincero al final.',
        portraitUrl: PROVIDED_SHREK_IMAGES.shrekPoseA,
        customAudioUrl: '',
      },
    },
    {
      id: 3,
      canvasOrder: 3,
      canvasTitle: '3. MENSAJES CLAVE',
      realmId: 'duloc',
      realmName: 'El Reino de Duloc',
      worldPosition: { x: -14.0, z: -4.5 },
      narratorIntro:
        'Tras cruzar las murallas ordenadas de Duloc, quedó claro que en ese reino cada palabra respondía a un mandato estricto.',
      narratorActingInstruction:
        'Narración articulada con leve ironía frente a la rigidez del reino.',
      modalTitle: '3. Mensajes Clave',
      modalSummary:
        'Contenido provisional de orientación: resume las ideas principales, valores o premisas esenciales que el público debe recordar al recorrer los diferentes canales de la historia.',
      imageUrl: PROVIDED_SHREK_IMAGES.shrek2,
      videoUrl: '',
      intervention: {
        characterId: 'farquaad',
        characterName: 'Lord Farquaad',
        dialogue:
          '¡Atención! Bienvenidos a Duloc, donde cada detalle obedece a la perfección... es decir, a mí. Recuerda el mensaje exacto y no desentones.',
        actingInstruction:
          'Registro medio-agudo y controlado, tono autoritario, presumido y exageradamente formal.',
        portraitUrl: PROVIDED_SHREK_IMAGES.shrekPoseB,
        customAudioUrl: '',
      },
    },
    {
      id: 4,
      canvasOrder: 4,
      canvasTitle: '4. HISTORIA',
      realmId: 'castillo_fiona',
      realmName: 'El Castillo de Fiona',
      worldPosition: { x: -6.5, z: -9.5 },
      narratorIntro:
        'Sobre la roca custodiada por la dragona, el viento anunciaba que la verdadera historia estaba lejos de ser un cuento común.',
      narratorActingInstruction:
        'Tono cinematográfico con pausa de expectativa antes de presentar el conflicto.',
      modalTitle: '4. Historia',
      modalSummary:
        'Contenido provisional de orientación: sintetiza el arco dramático principal, el conflicto detonante, los giros clave y el hilo conductor que une todos los capítulos.',
      imageUrl: PROVIDED_SHREK_IMAGES.fiona,
      videoUrl: '',
      intervention: {
        characterId: 'fiona',
        characterName: 'Fiona',
        dialogue:
          'No te fíes solo de las torres ni de los cuentos de siempre; detrás de cada puerta hay una decisión real.',
        actingInstruction:
          'Voz femenina cálida y firme; reduce levemente la velocidad para transmitir seriedad sin perder cercanía.',
        portraitUrl: PROVIDED_SHREK_IMAGES.fiona,
        customAudioUrl: '',
      },
      dialogueTurns: [
        {
          characterId: 'fiona',
          characterName: 'Fiona',
          dialogue:
            'No te fíes solo de las torres ni de los cuentos de siempre; detrás de cada puerta hay una decisión real.',
          actingInstruction:
            'Voz femenina media, clara y firme; transmite preocupación serena sin perder determinación.',
          portraitUrl: PROVIDED_SHREK_IMAGES.fiona,
        },
        {
          characterId: 'shrek',
          characterName: 'Shrek',
          dialogue:
            'Mientras no tengamos que resolverlo cantando... cuenta conmigo para seguir adelante.',
          actingInstruction:
            'Tono grave y seco con humor cómplice, bajando la guardia con ternura discreta.',
          portraitUrl: PROVIDED_SHREK_IMAGES.shrekPoseA,
        },
      ],
    },
    {
      id: 5,
      canvasOrder: 5,
      canvasTitle: '5. PERSONAJES Y LUGARES',
      realmId: 'bosque_hadas',
      realmName: 'El Bosque de los Cuentos de Hadas',
      worldPosition: { x: -1.5, z: -2.0 },
      narratorIntro:
        'Entre setas gigantes y faroles mágicos surgió una sombra ágil con sombrero emplumado. Cada mundo cobra vida por quienes lo recorren.',
      narratorActingInstruction:
        'Baja un poco el ritmo para crear misterio antes de la entrada teatral.',
      modalTitle: '5. Personajes y Lugares',
      modalSummary:
        'Contenido provisional de orientación: presenta a los protagonistas, aliados, antagonistas y los escenarios emblemáticos que dan identidad y memoria al universo narrativo.',
      imageUrl: PROVIDED_SHREK_IMAGES.gato,
      videoUrl: '',
      intervention: {
        characterId: 'gato',
        characterName: 'Gato con Botas',
        dialogue:
          'Despacio, amigo... Todo gran viaje exige aliados leales, acero firme y un poco de misterio. Permíteme guiarte por este capítulo.',
        actingInstruction:
          'Interpretación teatral, cálida, elegante y segura, con pausas expresivas.',
        portraitUrl: PROVIDED_SHREK_IMAGES.gato,
        customAudioUrl: '',
      },
    },
    {
      id: 6,
      canvasOrder: 6,
      canvasTitle: '6. CAMPAÑA TRANSMEDIA',
      realmId: 'muy_muy_lejano',
      realmName: 'Muy Muy Lejano',
      worldPosition: { x: 2.5, z: 6.5 },
      narratorIntro:
        'En las avenidas brillantes de Muy Muy Lejano, cada historia se transformaba en un espectáculo planeado al milímetro.',
      narratorActingInstruction:
        'Narración luminosa con ligero matiz de sospecha elegante.',
      modalTitle: '6. Campaña Transmedia',
      modalSummary:
        'Contenido provisional de orientación: detalla cómo se distribuye la historia a través de distintos medios (web, audio, video, juego, redes o actividades en aula) sin repetirse.',
      imageUrl: PROVIDED_SHREK_IMAGES.hada,
      videoUrl: '',
      intervention: {
        characterId: 'hada',
        characterName: 'Hada Madrina',
        dialogue:
          'Querido, todo es cuestión de encanto... y de saber mover cada plataforma exactamente como conviene.',
        actingInstruction:
          'Voz femenina madura y envolvente; dulzura superficial con ironía y persuasión calculadora.',
        portraitUrl: PROVIDED_SHREK_IMAGES.hada,
        customAudioUrl: '',
      },
      dialogueTurns: [
        {
          characterId: 'hada',
          characterName: 'Hada Madrina',
          dialogue:
            'Querido, todo es cuestión de encanto... y de distribuir el mensaje correcto en cada rincón del reino.',
          actingInstruction:
            'Dulzura superficial elegante y controlada, con firmeza persuasiva debajo.',
          portraitUrl: PROVIDED_SHREK_IMAGES.hada,
        },
        {
          characterId: 'principe',
          characterName: 'Príncipe Encantador',
          dialogue:
            'Exacto, madre... Y por supuesto, conmigo al frente de la campaña todo luce infinitamente mejor.',
          actingInstruction:
            'Pulida, vanidosa, confiada y exageradamente elegante.',
          portraitUrl: PROVIDED_SHREK_IMAGES.principe,
        },
      ],
    },
    {
      id: 7,
      canvasOrder: 7,
      canvasTitle: '7. LLAMADO A LA ACCIÓN',
      realmId: 'muy_muy_lejano',
      realmName: 'Plaza Real de Muy Muy Lejano',
      worldPosition: { x: 9.0, z: 8.5 },
      narratorIntro:
        'En la plaza real, la multitud guardó silencio esperando una decisión. Había llegado el instante en que el viajero debía dejar de observar y tomar parte activa en la historia.',
      narratorActingInstruction:
        'Narración cinematográfica firme y expectante; lleva todo el peso de la estación sin intervención adicional.',
      modalTitle: '7. Llamado a la Acción',
      modalSummary:
        'Contenido provisional de orientación: especifica qué acción concreta se espera del estudiante o espectador tras interactuar con la historia (explorar, crear, debatir o compartir).',
      imageUrl: PROVIDED_SHREK_IMAGES.fionaCombate,
      videoUrl: '',
      intervention: {
        characterId: 'fiona',
        characterName: 'Fiona',
        dialogue:
          'Ya vimos bastante desde la orilla. Es momento de dar un paso al frente y decidir el rumbo de esta historia.',
        actingInstruction:
          'Firme, valiente y directa, impulsando a la acción.',
        portraitUrl: PROVIDED_SHREK_IMAGES.fionaCombate,
        customAudioUrl: '',
      },
      // Natural distribution: Narrator carries this stop cleanly without forcing a character dialogue every time
      dialogueTurns: [],
    },
    {
      id: 8,
      canvasOrder: 8,
      canvasTitle: '8. ESTILO Y TONO',
      realmId: 'reino_villanos',
      realmName: 'El Reino de los Villanos',
      worldPosition: { x: 14.5, z: 2.0 },
      narratorIntro:
        'Bajo las torres sombrías del Reino de los Villanos, incluso la vanidad buscaba reflejarse en cada palabra.',
      narratorActingInstruction:
        'Pausa breve y tono narrativo intrigante al entrar al territorio rival.',
      modalTitle: '8. Estilo y Tono',
      modalSummary:
        'Contenido provisional de orientación: define la paleta visual, el registro lingüístico, la música, la ironía o el tono dramático que mantienen la coherencia en toda la experiencia.',
      imageUrl: PROVIDED_SHREK_IMAGES.principe,
      videoUrl: '',
      intervention: {
        characterId: 'principe',
        characterName: 'Príncipe Encantador',
        dialogue:
          'Míralo bien: el porte, la luz correcta, una entonación impecable... El estilo lo es todo, y nadie luce esta historia mejor que yo.',
        actingInstruction:
          'Voz limpia y pulida, presunción teatral y exceso de confianza.',
        portraitUrl: PROVIDED_SHREK_IMAGES.principe,
        customAudioUrl: '',
      },
    },
    {
      id: 9,
      canvasOrder: 9,
      canvasTitle: '9. RESULTADOS',
      realmId: 'reino_villanos',
      realmName: 'La Torre de los Villanos',
      worldPosition: { x: 10.5, z: -6.0 },
      narratorIntro:
        'Frente a la última prueba del camino, un pequeño valiente defendía los logros obtenidos con más corazón que estatura.',
      narratorActingInstruction:
        'Tono ágil y cálido que da paso a una réplica rápida y divertida.',
      modalTitle: '9. Resultados',
      modalSummary:
        'Contenido provisional de orientación: describe los productos esperados, aprendizajes verificables y cambios concretos generados al concluir la experiencia transmedia.',
      imageUrl: PROVIDED_SHREK_IMAGES.jengi,
      videoUrl: '',
      intervention: {
        characterId: 'jengibre',
        characterName: 'Jengibre',
        dialogue:
          '¡Oye, cuidado con mis botones de gomita! Sí, soy pequeño, ¿y qué? ¡Llegar hasta aquí demuestra todo lo que logramos construir!',
        actingInstruction:
          'Voz masculina aguda, rápida, nerviosa y valiente con chispas de humor.',
        portraitUrl: PROVIDED_SHREK_IMAGES.jengiAlt,
        customAudioUrl: '',
      },
    },
    {
      id: 10,
      canvasOrder: 10,
      canvasTitle: '10. INDICADORES',
      realmId: 'destino_final',
      realmName: 'El Destino Final de la Aventura',
      worldPosition: { x: 17.5, z: -9.5 },
      narratorIntro:
        'Bajo el arco dorado del destino final, la travesía dejaba huellas claras y una lección compartida entre amigos.',
      narratorActingInstruction:
        'Narración emotiva y serena de cierre de cuento.',
      modalTitle: '10. Indicadores',
      modalSummary:
        'Contenido provisional de orientación: establece las métricas, evidencias de participación o criterios de evaluación para valorar el éxito de la campaña y sus aprendizajes.',
      imageUrl: PROVIDED_SHREK_IMAGES.bebes,
      videoUrl: '',
      intervention: {
        characterId: 'shrek',
        characterName: 'Shrek',
        dialogue:
          'Mira que al principio solo quería paz en mi pantano... pero compartir el camino con ustedes valió la pena.',
        actingInstruction:
          'Voz grave y serena, bajando la guardia con ternura genuina al hablar de su familia.',
        portraitUrl: PROVIDED_SHREK_IMAGES.bebes,
        customAudioUrl: '',
      },
      dialogueTurns: [
        {
          characterId: 'shrek',
          characterName: 'Shrek',
          dialogue:
            'Mira que al principio solo quería paz en mi pantano... pero compartir el camino con ustedes valió la pena.',
          actingInstruction:
            'Grave, sereno y sincero; deja notar ternura por Fiona y su familia sin perder naturalidad.',
          portraitUrl: PROVIDED_SHREK_IMAGES.bebes,
        },
        {
          characterId: 'fiona',
          characterName: 'Fiona',
          dialogue:
            'Y cada paso que dimos dejó una huella real para quien recorra esta historia después.',
          actingInstruction:
            'Cálida, firme y optimista, mirando hacia el cierre del recorrido.',
          portraitUrl: PROVIDED_SHREK_IMAGES.fiona,
        },
        {
          characterId: 'burro',
          characterName: 'Burro',
          dialogue:
            '¡Eso sí que es un final de película! ¿Y ahora quién prepara la celebración?',
          actingInstruction:
            'Alegre, rápido y bromista para cerrar la escena con energía.',
          portraitUrl: PROVIDED_SHREK_IMAGES.burro,
        },
      ],
    },
  ],
};
