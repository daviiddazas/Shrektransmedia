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
    personalityLabel: 'Adulta medio-grave, cálida y cinematográfica',
    archetypeName: 'VOICE_NARRATOR · Narrador del cuento',
    voicePrompt:
      'Voz adulta de registro medio-grave, cálida, envolvente y perfectamente articulada en español latinoamericano natural y neutral. Suena como alguien que cuenta un cuento cinematográfico frente a un público vivo, con cadencia orgánica, misterio y emoción sin sonar a lectura mecánica.',
    defaultActingInstruction:
      'Narración cinematográfica de cuento clásico; ritmo pausado y envolvente, creando expectativa sin sonar como lector de instrucciones.',
    geminiVoiceName: 'Charon',
    pitch: 0.84,
    rate: 0.91,
    volume: 0.96,
    expressivity: 0.76,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  shrek: {
    characterId: 'shrek',
    voiceId: 'VOICE_SHREK',
    displayName: 'Shrek',
    gender: 'masculino',
    register: 'grave',
    warmth: 'Resonancia de pecho y textura áspera',
    personalityLabel: 'Masculina grave, robusta, seca y sincera en el fondo',
    archetypeName: 'VOICE_SHREK · Ogro del pantano',
    voicePrompt:
      'Voz masculina grave, robusta, con resonancia de pecho y textura ligeramente áspera en español latinoamericano natural. Registro bajo, articulación natural y ritmo pausado; humor seco, ironía e impaciencia ocasional, con ternura genuina al hablar de Fiona o su familia. Nunca suena como locutor de radio.',
    defaultActingInstruction:
      'Habla con ritmo pausado, registro grave y humor seco; impaciencia contenida que deja entrever serenidad o ternura cuando baja la guardia.',
    geminiVoiceName: 'Fenrir',
    pitch: 0.56,
    rate: 0.85,
    volume: 1.0,
    expressivity: 0.72,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  burro: {
    characterId: 'burro',
    voiceId: 'VOICE_DONKEY',
    displayName: 'Burro',
    gender: 'masculino',
    register: 'agudo',
    warmth: 'Brillante, expresiva y ligeramente nasal',
    personalityLabel: 'Masculina medio-aguda, rápida, entusiasta y espontánea',
    archetypeName: 'VOICE_DONKEY · Compañero entusiasta',
    voicePrompt:
      'Voz masculina de registro medio-agudo, brillante, expresiva y ligeramente nasal en español latinoamericano natural. Ritmo rápido, entusiasmo contagioso, espontaneidad, sorpresa, humor e inflexiones cambiantes incluso en frases cortas.',
    defaultActingInstruction:
      'Ritmo ágil y suelto, energía alta, entonación ascendente de sorpresa o entusiasmo y humor espontáneo.',
    geminiVoiceName: 'Puck',
    pitch: 1.36,
    rate: 1.24,
    volume: 1.0,
    expressivity: 0.94,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  fiona: {
    characterId: 'fiona',
    voiceId: 'VOICE_FIONA',
    displayName: 'Fiona',
    gender: 'femenino',
    register: 'medio',
    warmth: 'Cálida, clara y firme',
    personalityLabel: 'Femenina media, segura, inteligente y valiente',
    archetypeName: 'VOICE_FIONA · Princesa decidida',
    voicePrompt:
      'Voz femenina de registro medio, cálida, clara, firme y expresiva en español latinoamericano natural. Proyecta seguridad, inteligencia, cercanía, valentía y ternura equilibrada, evitando sonar infantil o demasiado solemne.',
    defaultActingInstruction:
      'Tono firme y cercano, articulación clara; alterna calidez honesta y determinación valiente según la escena.',
    geminiVoiceName: 'Kore',
    pitch: 1.18,
    rate: 1.0,
    volume: 0.98,
    expressivity: 0.78,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  gato: {
    characterId: 'gato',
    voiceId: 'VOICE_PUSS',
    displayName: 'Gato con Botas',
    gender: 'masculino',
    register: 'medio',
    warmth: 'Cálida, teatral y elegante',
    personalityLabel: 'Masculina media, galante, persuasiva y segura',
    archetypeName: 'VOICE_PUSS · Espadachín galante',
    voicePrompt:
      'Voz masculina de registro medio, cálida, teatral, elegante y con dicción precisa en español latinoamericano natural y neutral. Interpretación dramática en su justa medida, persuasiva, aventurera, pícara y segura, con pausas expresivas.',
    defaultActingInstruction:
      'Interpretación teatral, elegante y segura; usa pausas breves y entonación persuasiva con un toque pícaro.',
    geminiVoiceName: 'Charon',
    pitch: 0.94,
    rate: 0.88,
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
    warmth: 'Limpia, controlada y rígida',
    personalityLabel: 'Masculina medio-aguda, autoritaria, presumida y formal',
    archetypeName: 'VOICE_FARQUAAD · Gobernante rígido',
    voicePrompt:
      'Voz masculina de registro medio-agudo, limpia, controlada y con pronunciación precisa en español latinoamericano natural. Tono autoritario, presumido, rígido, mandón y exageradamente formal, generando humor involuntario en contraste con su baja estatura.',
    defaultActingInstruction:
      'Dicción exacta y tensa; tono autoritario, rígido y exageradamente formal, como quien exige obediencia absoluta.',
    geminiVoiceName: 'Puck',
    pitch: 1.16,
    rate: 1.06,
    volume: 0.98,
    expressivity: 0.8,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  hada: {
    characterId: 'hada',
    voiceId: 'VOICE_FAIRY_GODMOTHER',
    displayName: 'Hada Madrina',
    gender: 'femenino',
    register: 'medio',
    warmth: 'Brillante, envolvente y melosa',
    personalityLabel: 'Femenina madura, elegante, persuasiva e irónica',
    archetypeName: 'VOICE_FAIRY_GODMOTHER · Dama calculadora',
    voicePrompt:
      'Voz femenina madura, de registro medio, brillante y envolvente en español latinoamericano natural. Proyecta elegancia, persuasión y dulzura superficial, dejando sentir seguridad, ironía y amenaza sutil cuando conviene.',
    defaultActingInstruction:
      'Tono meloso, elegante y controlado en la superficie, con ironía fina y firmeza persuasiva debajo.',
    geminiVoiceName: 'Zephyr',
    pitch: 1.04,
    rate: 0.92,
    volume: 0.96,
    expressivity: 0.84,
    customAudioUrl: '',
    generatedAudioDataUrl: '',
  },
  principe: {
    characterId: 'principe',
    voiceId: 'VOICE_CHARMING',
    displayName: 'Príncipe Encantador',
    gender: 'masculino',
    register: 'medio-alto',
    warmth: 'Pulida y teatral',
    personalityLabel: 'Masculina medio-aguda, vanidosa y presumida',
    archetypeName: 'VOICE_CHARMING · Galán vanidoso',
    voicePrompt:
      'Voz masculina de registro medio-agudo, pulida y teatral en español latinoamericano natural. Transmite vanidad, presunción, dramatismo, exceso de confianza y entonación exageradamente elegante como quien posa para lucirse.',
    defaultActingInstruction:
      'Entonación pulida, confiada y exageradamente elegante; posa con dramatismo vanidoso y sonrisa ensayada.',
    geminiVoiceName: 'Puck',
    pitch: 1.08,
    rate: 0.91,
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
    register: 'agudo',
    warmth: 'Ligera, vivaz y brillante',
    personalityLabel: 'Masculina aguda, rápida, nerviosa y valiente',
    archetypeName: 'VOICE_GINGY · Galleta valiente',
    voicePrompt:
      'Voz masculina aguda, ligera, vivaz y muy expresiva en español latinoamericano natural. Combina rapidez, nerviosismo chispeante, valentía frente al peligro, sorpresa y humor sin caer en distorsión artificial.',
    defaultActingInstruction:
      'Habla rápido y con chispa aguda; mezcla tensión nerviosa con valentía desafiante y humor.',
    geminiVoiceName: 'Puck',
    pitch: 1.76,
    rate: 1.26,
    volume: 0.95,
    expressivity: 0.95,
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
