export {
  audioService as voiceEngine,
  buildAudioCacheKey,
  composeGeminiActingPrompt,
  computeExpressiveProsody,
  stripActingAnnotations,
} from './audioService';

export type {
  ExpressiveProsody,
  PlaySequenceOptions,
  SequenceSpeakItem,
  SpeakRequest,
  SpeechStatus,
} from './audioService';
