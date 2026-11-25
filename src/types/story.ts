export type CharacterId =
  | 'narrador'
  | 'shrek'
  | 'burro'
  | 'fiona'
  | 'gato'
  | 'farquaad'
  | 'hada'
  | 'principe'
  | 'jengibre';

export type RealmId =
  | 'pantano'
  | 'bosque_encantado'
  | 'duloc'
  | 'castillo_fiona'
  | 'bosque_hadas'
  | 'muy_muy_lejano'
  | 'reino_villanos'
  | 'destino_final';

export type ThemeAtmosphere = 'claro' | 'oscuro';

export type AppPhase = 'title' | 'opening' | 'playing';

export interface WorldPoint {
  x: number;
  z: number;
}

export type VoiceId =
  | 'VOICE_NARRATOR'
  | 'VOICE_SHREK'
  | 'VOICE_DONKEY'
  | 'VOICE_FIONA'
  | 'VOICE_PUSS'
  | 'VOICE_FARQUAAD'
  | 'VOICE_FAIRY_GODMOTHER'
  | 'VOICE_CHARMING'
  | 'VOICE_GINGY';

export type GeminiVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export type VoiceRegister = 'grave' | 'medio' | 'medio-alto' | 'agudo';

export interface VoiceProfile {
  characterId: CharacterId;
  voiceId: VoiceId;
  displayName: string;
  gender?: 'masculino' | 'femenino';
  register?: VoiceRegister;
  warmth?: string;
  personalityLabel: string;
  archetypeName: string;
  voicePrompt: string;
  defaultActingInstruction: string;
  geminiVoiceName: GeminiVoiceName;
  pitch: number;
  rate: number;
  volume: number;
  expressivity: number;
  customAudioUrl: string;
  generatedAudioDataUrl?: string;
  generatedAudioText?: string;
}

export interface CharacterIntervention {
  characterId: CharacterId;
  characterName: string;
  dialogue: string;
  actingInstruction?: string;
  portraitUrl: string;
  customAudioUrl: string;
}

export interface DialogueTurn {
  characterId: CharacterId;
  characterName: string;
  dialogue: string;
  actingInstruction: string;
  portraitUrl?: string;
  customAudioUrl?: string;
}

export interface StoryStation {
  id: number;
  canvasOrder: number;
  canvasTitle: string;
  realmId: RealmId;
  realmName: string;
  worldPosition: WorldPoint;
  narratorIntro: string;
  narratorActingInstruction?: string;
  modalTitle: string;
  modalSummary: string;
  imageUrl: string;
  videoUrl: string;
  intervention: CharacterIntervention;
  dialogueTurns?: DialogueTurn[];
}

export interface AudioSettings {
  masterVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  voiceEnabled: boolean;
  autoNarrate: boolean;
  geminiBoardEnabled?: boolean;
  customAmbientMusicUrl: string;
  customDiscoverySfxUrl: string;
}

export interface StoryConfig {
  version: number;
  bookTitle: string;
  bookSubtitle: string;
  coverTagline: string;
  openingNarration: string;
  stations: StoryStation[];
  characterVoices: Record<CharacterId, VoiceProfile>;
  audioSettings: AudioSettings;
}

export interface GalleryResource {
  id: string;
  label: string;
  url: string;
}

export interface ActiveDialogue {
  speakerId: CharacterId;
  voiceId?: VoiceId;
  speakerName: string;
  text: string;
  actingInstruction?: string;
  portraitUrl?: string;
  customAudioUrl?: string;
  isNarrator: boolean;
  stationId?: number;
}
