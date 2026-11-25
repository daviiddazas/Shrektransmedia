import { CharacterId, VoiceId, VoiceProfile } from '../types/story';

export const CHARACTER_VOICE_IDS: Record<CharacterId, VoiceId> = {
  narrador: 'VOICE_NARRATOR',
  shrek: 'VOICE_SHREK',
  burro: 'VOICE_DONKEY',
  fiona: 'VOICE_FIONA',
  gato: 'VOICE_PUSS',
  farquaad: 'VOICE_FARQUAAD',
  hada: 'VOICE_FAIRY_GODMOTHER',
  principe: 'VOICE_CHARMING',
  jengibre: 'VOICE_GINGY',
};

export const VOICE_PROFILES_REGISTRY: Record<CharacterId, VoiceProfile> = {
  narrador: {
    characterId: 'narrador',
    voiceId: 'VOICE_NARRATOR',
    displayName: 'Narrador del Cuento',
    gender: 'masculino',
    register: 'grave',
    warmth: 'Cálida y envolvente',
    personalityLabel: 'Masculina adulta grave, cálida y cinematográfica',
    archetypeName: 'VOICE_NARRATOR · Narrador del cuento',
    voicePrompt:
      'Voz masculina adulta de registro grave, cálida, envolvente y perfectamente articulada en español latinoamericano natural y neutral. Suena como quien narra un cuento cinematográfico frente a un público vivo, con cadencia orgánica y misterio.',
    defaultActingInstruction:
      'Narración cinematográfica de cuento clásico; ritmo pausado y envolvente, creando expectativa sin sonar como lector de instrucciones.',
    geminiVoiceName: 'Charon',
    pitch: 0.78,
    rate: 0.92,
    volume: 0.96,
    expressivity: 0.78,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  shrek: {
    characterId: 'shrek',
    voiceId: 'VOICE_SHREK',
    displayName: 'Shrek',
    gender: 'masculino',
    register: 'muy-grave',
    warmth: 'Resonancia profunda de pecho y textura áspera',
    personalityLabel: 'Masculina muy grave, cavernosa, seca y sincera en el fondo',
    archetypeName: 'VOICE_SHREK · Ogro del pantano',
    voicePrompt:
      'Voz masculina MUY GRAVE, profunda, robusta, con fuerte resonancia de pecho y textura ligeramente áspera en español latinoamericano natural. Registro bajo y pesado, ritmo pausado, humor seco e impaciencia ocasional, con ternura genuina al hablar de Fiona o su familia.',
    defaultActingInstruction:
      'Habla con registro muy grave y resonante, ritmo pausado y humor seco; impaciencia contenida con fondo sincero.',
    geminiVoiceName: 'Fenrir',
    pitch: 0.52,
    rate: 0.84,
    volume: 1.0,
    expressivity: 0.76,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  burro: {
    characterId: 'burro',
    voiceId: 'VOICE_DONKEY',
    displayName: 'Burro',
    gender: 'masculino',
    register: 'agudo',
    warmth: 'Aguda, brillante, nasal y explosiva',
    personalityLabel: 'Masculina aguda, muy rápida, entusiasta y teatral',
    archetypeName: 'VOICE_DONKEY · Compañero entusiasta',
    voicePrompt:
      'Voz masculina de registro AGUDO, brillante, muy expresiva y ligeramente nasal en español latinoamericano natural. Ritmo muy rápido, entusiasmo desbordante, espontaneidad, sorpresa, humor e inflexiones altas y cambiantes incluso en frases cortas.',
    defaultActingInstruction:
      'Voz aguda con ritmo muy ágil, energía alta, entonación ascendente de entusiasmo y humor espontáneo.',
    geminiVoiceName: 'Puck',
    pitch: 1.78,
    rate: 1.24,
    volume: 1.0,
    expressivity: 0.95,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  fiona: {
    characterId: 'fiona',
    voiceId: 'VOICE_FIONA',
    displayName: 'Fiona',
    gender: 'femenino',
    register: 'medio-alto',
    warmth: 'Claramente femenina, dulce, brillante y firme',
    personalityLabel: 'Femenina adulta joven, luminosa, segura y valiente',
    archetypeName: 'VOICE_FIONA · Princesa decidida',
    voicePrompt:
      'Voz claramente FEMENINA de mujer adulta joven, registro medio-alto luminoso, cálida, melodiosa, firme y muy expresiva en español latinoamericano natural. Suena inequívocamente como una mujer segura, inteligente, cercana y valiente.',
    defaultActingInstruction:
      'Tono femenino claro, cercano y decidido; alterna dulzura luminosa y determinación valiente.',
    geminiVoiceName: 'Aoede',
    pitch: 1.56,
    rate: 1.02,
    volume: 0.98,
    expressivity: 0.84,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  gato: {
    characterId: 'gato',
    voiceId: 'VOICE_PUSS',
    displayName: 'Gato con Botas',
    gender: 'masculino',
    register: 'medio',
    warmth: 'Aterciopelada, teatral y galante',
    personalityLabel: 'Masculina media, galante, persuasiva y segura',
    archetypeName: 'VOICE_PUSS · Espadachín galante',
    voicePrompt:
      'Voz masculina de registro medio, aterciopelada, teatral, elegante y con dicción precisa en español latinoamericano natural y neutral. Interpretación dramática en su justa medida, persuasiva, aventurera, pícara y segura.',
    defaultActingInstruction:
      'Interpretación teatral, elegante y segura; usa pausas breves y entonación persuasiva con un toque pícaro.',
    geminiVoiceName: 'Orus',
    pitch: 0.94,
    rate: 0.9,
    volume: 0.98,
    expressivity: 0.86,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  farquaad: {
    characterId: 'farquaad',
    voiceId: 'VOICE_FARQUAAD',
    displayName: 'Lord Farquaad',
    gender: 'masculino',
    register: 'medio-alto',
    warmth: 'Tensa, nasal-aguda y autoritaria',
    personalityLabel: 'Masculina medio-aguda, apretada, mandona y formal',
    archetypeName: 'VOICE_FARQUAAD · Gobernante rígido',
    voicePrompt:
      'Voz masculina de registro medio-agudo, algo apretada, nasal y con pronunciación rígida en español latinoamericano natural. Tono autoritario, presumido, mandón y exageradamente formal, contrastando con su baja estatura.',
    defaultActingInstruction:
      'Dicción tensa y exacta; tono autoritario, rígido y exageradamente formal, exigiendo obediencia absoluta.',
    geminiVoiceName: 'Puck',
    pitch: 1.24,
    rate: 1.08,
    volume: 0.98,
    expressivity: 0.84,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  hada: {
    characterId: 'hada',
    voiceId: 'VOICE_FAIRY_GODMOTHER',
    displayName: 'Hada Madrina',
    gender: 'femenino',
    register: 'medio-alto',
    warmth: 'Femenina madura, melosa, glamorosa y aguda',
    personalityLabel: 'Femenina madura, elegante, persuasiva e irónica',
    archetypeName: 'VOICE_FAIRY_GODMOTHER · Dama calculadora',
    voicePrompt:
      'Voz inequívocamente FEMENINA madura, soprano-mezzo brillante, glamorosa, melosa y envolvente en español latinoamericano natural. Proyecta dulzura teatral por fuera y firmeza calculadora e ironía por debajo.',
    defaultActingInstruction:
      'Voz femenina melosa, glamorosa y controlada en la superficie, con ironía fina y firmeza persuasiva debajo.',
    geminiVoiceName: 'Kore',
    pitch: 1.44,
    rate: 0.94,
    volume: 0.96,
    expressivity: 0.88,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  principe: {
    characterId: 'principe',
    voiceId: 'VOICE_CHARMING',
    displayName: 'Príncipe Encantador',
    gender: 'masculino',
    register: 'medio-alto',
    warmth: 'Brillante, pulida y afectada',
    personalityLabel: 'Masculina limpia, brillante, vanidosa y teatral',
    archetypeName: 'VOICE_CHARMING · Galán vanidoso',
    voicePrompt:
      'Voz masculina limpia, brillante y afectada en español latinoamericano natural. Transmite vanidad, presunción, exceso de confianza y entonación exageradamente elegante como quien siempre posa para lucirse.',
    defaultActingInstruction:
      'Entonación brillante, confiada y exageradamente elegante; posa con dramatismo vanidoso y sonrisa ensayada.',
    geminiVoiceName: 'Achird',
    pitch: 1.08,
    rate: 0.93,
    volume: 0.96,
    expressivity: 0.88,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  jengibre: {
    characterId: 'jengibre',
    voiceId: 'VOICE_GINGY',
    displayName: 'Jengibre',
    gender: 'masculino',
    register: 'muy-agudo',
    warmth: 'Bien aguda, finísima, rápida y chispeante',
    personalityLabel: 'Voz bien aguda de galleta diminuta, veloz y valiente',
    archetypeName: 'VOICE_GINGY · Galleta valiente',
    voicePrompt:
      'Voz BIEN AGUDA, finísima, chillona, veloz y chispeante de personaje diminuto en español latinoamericano natural. Combina tono muy alto, rapidez nerviosa, valentía frente al peligro y humor desbordante.',
    defaultActingInstruction:
      'Tono bien agudo y rápido; mezcla tensión nerviosa con valentía desafiante y chispa cómica.',
    geminiVoiceName: 'Leda',
    pitch: 2.08,
    rate: 1.28,
    volume: 0.98,
    expressivity: 0.96,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
};

export interface ComparisonLine {
  characterId: CharacterId;
  voiceId: VoiceId;
  speakerName: string;
  text: string;
  actingInstruction: string;
}

export const ALL_VOICES_COMPARISON_LINES: ComparisonLine[] = [
  {
    characterId: 'narrador',
    voiceId: 'VOICE_NARRATOR',
    speakerName: 'Narrador',
    text: 'En el corazón del pantano, todos los habitantes del reino se reunieron para probar su voz.',
    actingInstruction:
      'Narración cinematográfica serena y envolvente, creando expectativa como al inicio de un cuento.',
  },
  {
    characterId: 'shrek',
    voiceId: 'VOICE_SHREK',
    speakerName: 'Shrek',
    text: '¿Una reunión en mi pantano? Genial... justo lo que necesitaba antes de desayunar.',
    actingInstruction:
      'Ritmo pausado, registro grave y humor seco con ligera impaciencia.',
  },
  {
    characterId: 'burro',
    voiceId: 'VOICE_DONKEY',
    speakerName: 'Burro',
    text: '¡Ay, Shrek, no seas amargado! ¡Si esto va a sonar increíble, hasta podemos cantar después!',
    actingInstruction:
      'Velocidad alta, entusiasmo desbordante, tono medio-agudo y chispa bromista.',
  },
  {
    characterId: 'fiona',
    voiceId: 'VOICE_FIONA',
    speakerName: 'Fiona',
    text: 'Ordenémonos un momento. Si cada quien habla claro y con firmeza, esta historia va a cobrar vida.',
    actingInstruction:
      'Tono femenino medio, claro, firme y cercano, mediando con seguridad.',
  },
  {
    characterId: 'gato',
    voiceId: 'VOICE_PUSS',
    speakerName: 'Gato con Botas',
    text: 'Por supuesto, mi señora... Aunque admito que una pizca de misterio y elegancia siempre eleva la escena.',
    actingInstruction:
      'Pausado, cálido, teatral y seguro de sí mismo, con elegancia pícara.',
  },
  {
    characterId: 'farquaad',
    voiceId: 'VOICE_FARQUAAD',
    speakerName: 'Lord Farquaad',
    text: '¡Silencio! Exijo precisión absoluta. En mis dominios nadie improvisa sin mi autorización.',
    actingInstruction:
      'Registro medio-agudo, tenso, autoritario y exageradamente formal.',
  },
  {
    characterId: 'hada',
    voiceId: 'VOICE_FAIRY_GODMOTHER',
    speakerName: 'Hada Madrina',
    text: 'Querido, no te alteres... Con un poco de encanto y las palabras justas, todos terminan haciendo lo que conviene.',
    actingInstruction:
      'Dulzura superficial elegante y melosa, con ironía firme y calculadora por debajo.',
  },
  {
    characterId: 'principe',
    voiceId: 'VOICE_CHARMING',
    speakerName: 'Príncipe Encantador',
    text: 'Francamente, es obvio quién tiene la voz más deslumbrante y refinada de todo Muy Muy Lejano.',
    actingInstruction:
      'Pulida, confiada y exageradamente elegante, posando con vanidad.',
  },
  {
    characterId: 'jengibre',
    voiceId: 'VOICE_GINGY',
    speakerName: 'Jengibre',
    text: '¡Oye, no me subestimen por ser pequeño! ¡Soy rápido, valiente y tengo más carácter que medio castillo!',
    actingInstruction:
      'Aguda, rápida, vivaz y valiente con chispas de humor nervioso.',
  },
];

export const VOICE_STUDY_SAMPLE_TEXTS: Record<CharacterId, string> = {
  narrador:
    'Cuando cayó la neblina sobre el pantano, un silencio antiguo anunció que algo extraordinario estaba por comenzar.',
  shrek:
    '¿No puedes darme un solo minuto de tranquilidad? Mira... solo asegúrate de no pisar el lodo limpio.',
  burro:
    '¡Shrek! ¡Amigo! ¡Tenemos que hablar! ¡Tengo tantas ideas para esta aventura que no sé ni por dónde empezar!',
  fiona:
    'No nos detendremos aquí. Si avanzamos juntos y con la cabeza fría, llegaremos antes del anochecer.',
  gato:
    'Tranquilo, compañero... Todo gran héroe necesita aliados leales y un poco de estilo cuando la situación se complica.',
  farquaad:
    '¡Atención! Bienvenidos a Duloc, donde el orden es impecable y cada regla se cumple al pie de la letra.',
  hada:
    'Querido, todo es cuestión de presentación... y de entender quién mueve realmente los hilos en este reino.',
  principe:
    'Míralo bien: el porte, la sonrisa perfecta, la entonación justa... el encanto real no se improvisa.',
  jengibre:
    '¡No toques mis botones de gomita! ¡Podré ser de galleta, pero nadie frena este recorrido!',
};
