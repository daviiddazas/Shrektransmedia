import { CHARACTER_VOICE_IDS } from '../data/voiceProfiles';
import { AudioSettings, CharacterId, VoiceId, VoiceProfile } from '../types/story';
import { transformWavDataUrl } from './pitchProcessor';
import { soundEngine } from './soundEngine';

export type SpeechStatus = 'idle' | 'loading' | 'speaking' | 'paused';

export interface SpeakRequest {
  text: string;
  characterId: CharacterId;
  voiceId?: VoiceId;
  actingInstruction?: string;
  customAudioUrl?: string;
  useGemini?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface SequenceSpeakItem {
  id?: string;
  characterId: CharacterId;
  voiceId?: VoiceId;
  speakerName: string;
  text: string;
  actingInstruction?: string;
  customAudioUrl?: string;
  portraitUrl?: string;
}

export interface PlaySequenceOptions {
  pauseBetweenTurnsMs?: number;
  useGemini?: boolean;
  onTurnStart?: (item: SequenceSpeakItem, index: number) => void;
  onTurnEnd?: (item: SequenceSpeakItem, index: number) => void;
  onComplete?: () => void;
}

export interface ExpressiveProsody {
  pitch: number;
  rate: number;
  volume: number;
  lang: string;
}

export interface BrowserVoiceDiagnostics {
  selectedVoiceName: string;
  selectedVoiceLang: string;
  isLocalVoice: boolean;
  matchedGender: boolean;
  esVoiceCount: number;
}

const FEMALE_VOICE_PATTERN =
  /monica|mónica|paulina|helena|sabina|laura|elena|lucia|lucía|paloma|elvira|dalia|salome|salomé|camila|isabela|valeria|ximena|carmen|sofia|sofía|catalina|angelica|angélica|marisol|conchita|lupe|mia|mía|penelope|penélope|esperanza|francisca|andrea|flor|shelley|sandy|grandma|google español(?! de estados)|female|mujer|femenin/i;
const MALE_VOICE_PATTERN =
  /jorge|diego|pablo|raul|raúl|carlos|juan|alvaro|álvaro|enrique|tomas|tomás|alonso|emilio|mateo|andres|andrés|antonio|miguel|rodrigo|lorenzo|sebas|sebastian|sebastián|gonzalo|eddy|reed|rocko|grandpa|male|hombre|masculin/i;

const CHARACTER_VOICE_SLOT: Record<CharacterId, number> = {
  shrek: 0,
  narrador: 1,
  gato: 2,
  farquaad: 3,
  principe: 0,
  burro: 1,
  jengibre: 2,
  fiona: 0,
  hada: 1,
};

/**
 * Strips parenthetical stage directions or bracket tags so they are NEVER spoken aloud.
 */
export function stripActingAnnotations(rawText: string): string {
  return rawText
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Deterministic cache key for synthesized voice lines based on permanent identity,
 * clean text, acting direction, and vocal modulation settings.
 */
export function buildAudioCacheKey(params: {
  voiceId: string;
  text: string;
  actingInstruction?: string;
  voicePrompt?: string;
  geminiVoiceName?: string;
  expressivity?: number;
  rate?: number;
}): string {
  const normText = stripActingAnnotations(params.text);
  const normActing = (params.actingInstruction ?? '').trim().toLowerCase();
  const normPrompt = (params.voicePrompt ?? '').trim().slice(0, 180).toLowerCase();
  const expr = (params.expressivity ?? 0.8).toFixed(2);
  const rate = (params.rate ?? 1.0).toFixed(2);
  const timbre = params.geminiVoiceName ?? 'Fenrir';
  return `${params.voiceId}|${timbre}|${rate}|${expr}|${normActing}|${normPrompt}|${normText}`;
}

/**
 * Composes Gemini SpeechMetadata style from permanent voice identity + temporary acting instruction.
 */
export function composeGeminiActingPrompt(
  profile: Pick<VoiceProfile, 'voicePrompt' | 'defaultActingInstruction' | 'expressivity' | 'rate'>,
  actingInstruction?: string,
): string {
  const base = profile.voicePrompt.trim();
  const acting = (actingInstruction ?? profile.defaultActingInstruction ?? '').trim();
  const expr = profile.expressivity ?? 0.8;
  const rate = profile.rate ?? 1.0;

  const exprDesc =
    expr >= 0.85
      ? 'Expresividad alta con matices emocionales claros y pausas orgánicas.'
      : expr <= 0.5
        ? 'Expresividad contenida y sobria.'
        : 'Expresividad equilibrada y natural.';
  const rateDesc =
    rate <= 0.88
      ? 'Cadencia pausada.'
      : rate >= 1.15
        ? 'Cadencia ágil.'
        : 'Cadencia conversacional.';

  return [
    base,
    acting ? `Actuación puntual: ${acting}.` : '',
    exprDesc,
    rateDesc,
    'Español latinoamericano natural. No leas acotaciones ni descripciones.',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Computes Web Speech fallback prosody factoring character profile, expressivity,
 * temporary acting direction, and global master volume.
 */
export function computeExpressiveProsody(
  profile: Partial<VoiceProfile> | undefined,
  actingInstruction: string | undefined,
  masterVolume: number,
): ExpressiveProsody {
  const basePitch = profile?.pitch ?? 1.0;
  const baseRate = profile?.rate ?? 1.0;
  const charVol = profile?.volume ?? 1.0;
  const expressivity = Math.max(0, Math.min(1, profile?.expressivity ?? 0.8));
  const dir = (actingInstruction ?? profile?.defaultActingInstruction ?? '').toLowerCase();

  let pitchDelta = 0;
  let rateDelta = 0;

  if (/entusias|rápid|ágil|sorpres|nervios|emocion|chispa|urgente/.test(dir)) {
    pitchDelta += 0.06 * expressivity;
    rateDelta += 0.06 * expressivity;
  }
  if (/pausad|seren|cálid|misteri|solemn|suave|ternura|suspiro/.test(dir)) {
    pitchDelta -= 0.03 * expressivity;
    rateDelta -= 0.05 * expressivity;
  }
  if (/autoritari|firme|exigente|tenso|desafiant/.test(dir)) {
    pitchDelta += 0.02 * expressivity;
  }

  return {
    pitch: Math.max(0.48, Math.min(2.0, basePitch + pitchDelta)),
    rate: Math.max(0.7, Math.min(1.45, baseRate + rateDelta)),
    volume: Math.max(0, Math.min(1, masterVolume * charVol)),
    lang: 'es-MX',
  };
}

class AudioService {
  private status: SpeechStatus = 'idle';
  private currentAudioEl: HTMLAudioElement | null = null;
  private lastRequest: SpeakRequest | null = null;
  private listeners = new Set<(status: SpeechStatus) => void>();
  private voicesCache: SpeechSynthesisVoice[] = [];
  private profiles: Record<CharacterId, VoiceProfile> | null = null;
  private settings: AudioSettings = {
    masterVolume: 0.82,
    musicEnabled: true,
    sfxEnabled: true,
    voiceEnabled: true,
    autoNarrate: true,
    geminiBoardEnabled: true,
    customAmbientMusicUrl: '',
    customDiscoverySfxUrl: '',
  };

  private clientAudioCache = new Map<string, string>();
  private sculptedAudioCache = new Map<string, string>();
  private geminiQuotaBlockedUntil = 0;
  private speakSequence = 0;
  private queueToken = 0;
  private pendingSpeechTimer: number | null = null;
  private queuePauseTimer: number | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.refreshVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.refreshVoices();
      };
    }
  }

  public subscribe(listener: (status: SpeechStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(next: SpeechStatus): void {
    this.status = next;
    soundEngine.setSpeechDucking(next === 'speaking' || next === 'loading');
    this.listeners.forEach((cb) => cb(next));
  }

  public updateConfig(
    profiles: Record<CharacterId, VoiceProfile>,
    settings: AudioSettings,
  ): void {
    this.profiles = profiles;
    this.settings = settings;
    if (this.currentAudioEl) {
      const activeVol = this.lastRequest
        ? Math.min(
            1,
            settings.masterVolume * (profiles[this.lastRequest.characterId]?.volume ?? 1),
          )
        : settings.masterVolume;
      this.currentAudioEl.volume = settings.voiceEnabled ? activeVol : 0;
    }
    if (!settings.voiceEnabled && this.status !== 'idle') {
      this.stop();
    }
  }

  public getCachedClipCount(): number {
    return this.clientAudioCache.size;
  }

  public clearCache(): void {
    this.clientAudioCache.clear();
    this.sculptedAudioCache.clear();
  }

  private refreshVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voicesCache = window.speechSynthesis.getVoices();
  }

  private wantsFemaleVoice(characterId: CharacterId): boolean {
    const profile = this.profiles?.[characterId];
    if (profile?.gender) {
      return profile.gender === 'femenino';
    }
    return characterId === 'fiona' || characterId === 'hada';
  }

  /**
   * Selects a Latin American Spanish voice across all 9 characters (zero Castilian override),
   * preferring matching gender and local pitch-capable OS voices when available.
   */
  private pickLatinSpanishVoice(characterId: CharacterId): SpeechSynthesisVoice | null {
    if (this.voicesCache.length === 0) this.refreshVoices();
    const esVoices = this.voicesCache.filter((v) =>
      v.lang.toLowerCase().startsWith('es'),
    );
    if (esVoices.length === 0) return null;

    const wantsFemale = this.wantsFemaleVoice(characterId);
    const profilePitch = this.profiles?.[characterId]?.pitch ?? 1.0;
    const needsExtremePitch = profilePitch <= 0.72 || profilePitch >= 1.45;

    const scoreVoice = (voice: SpeechSynthesisVoice): number => {
      let score = 0;
      const lang = voice.lang.toLowerCase();
      const name = voice.name;

      const isFemale = FEMALE_VOICE_PATTERN.test(name);
      const isMale = MALE_VOICE_PATTERN.test(name);

      if (wantsFemale) {
        if (isFemale) score += 35;
        if (isMale) score -= 35;
      } else {
        if (isMale) score += 35;
        if (isFemale) score -= 35;
      }

      if (/es-(419|mx|us|co|ar|cl|pe)/.test(lang)) {
        score += 12;
      } else if (lang === 'es-es') {
        score -= 4;
      }

      // Local OS voices obey SpeechSynthesisUtterance.pitch much more faithfully than Chrome remote Google voices
      if (voice.localService && needsExtremePitch) {
        score += 14;
      } else if (/natural|neural|online/i.test(name)) {
        score += 5;
      } else if (/google|microsoft/i.test(name)) {
        score += 2;
      }
      return score;
    };

    const scored = [...esVoices]
      .map((voice) => ({ voice, score: scoreVoice(voice) }))
      .sort((a, b) => b.score - a.score);

    const bestGenderGroup = scored.filter(
      (item) => item.score >= scored[0].score - 10,
    );
    const slot = CHARACTER_VOICE_SLOT[characterId] ?? 0;
    return bestGenderGroup[slot % bestGenderGroup.length]?.voice ?? scored[0].voice;
  }

  public getBrowserVoiceDiagnostics(characterId: CharacterId): BrowserVoiceDiagnostics {
    if (this.voicesCache.length === 0) this.refreshVoices();
    const esVoices = this.voicesCache.filter((v) => v.lang.toLowerCase().startsWith('es'));
    const picked = this.pickLatinSpanishVoice(characterId);
    const wantsFemale = this.wantsFemaleVoice(characterId);
    const matchedGender = picked
      ? wantsFemale
        ? FEMALE_VOICE_PATTERN.test(picked.name)
        : MALE_VOICE_PATTERN.test(picked.name)
      : false;
    return {
      selectedVoiceName: picked?.name ?? 'Predeterminada del navegador',
      selectedVoiceLang: picked?.lang ?? 'es-MX',
      isLocalVoice: Boolean(picked?.localService),
      matchedGender,
      esVoiceCount: esVoices.length,
    };
  }

  public prefetch(_characterId: CharacterId, _text: string): void {
    this.refreshVoices();
  }

  public getProfile(characterId: CharacterId): VoiceProfile | undefined {
    return this.profiles?.[characterId];
  }

  public getVoiceId(characterId: CharacterId): VoiceId {
    return this.profiles?.[characterId]?.voiceId ?? CHARACTER_VOICE_IDS[characterId];
  }

  /**
   * Generates (or retrieves from cache) a Gemini TTS clip explicitly from Estudio de Voces or optional Gemini board mode.
   */
  public async synthesizeWithGemini(params: {
    characterId: CharacterId;
    text: string;
    actingInstruction?: string;
    profileOverride?: VoiceProfile;
    useLiteModel?: boolean;
  }): Promise<{ dataUrl: string; cached: boolean; voiceId: VoiceId; durationMs?: number }> {
    const cleanText = stripActingAnnotations(params.text);
    const profile = params.profileOverride ?? this.profiles?.[params.characterId];
    const voiceId = profile?.voiceId ?? CHARACTER_VOICE_IDS[params.characterId];
    const acting =
      params.actingInstruction ?? profile?.defaultActingInstruction ?? '';

    const cacheKey = buildAudioCacheKey({
      voiceId,
      text: cleanText,
      actingInstruction: acting,
      voicePrompt: profile?.voicePrompt,
      geminiVoiceName: profile?.geminiVoiceName,
      expressivity: profile?.expressivity,
      rate: profile?.rate,
    });

    const hit = this.clientAudioCache.get(cacheKey);
    if (hit) {
      return { dataUrl: hit, cached: true, voiceId };
    }

    const res = await fetch('/api/voice-design/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId: params.characterId,
        voiceId,
        text: cleanText,
        voicePrompt: profile?.voicePrompt,
        voiceName: profile?.geminiVoiceName,
        archetypeName: profile?.archetypeName,
        actingInstruction: acting,
        expressivity: profile?.expressivity ?? 0.8,
        rate: profile?.rate ?? 1.0,
        useLiteModel: params.useLiteModel ?? true,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 429 || res.status === 503) {
        this.geminiQuotaBlockedUntil = Date.now() + 60_000;
      }
      throw new Error(data?.error || `Error ${res.status} al sintetizar voz.`);
    }

    if (typeof data?.dataUrl === 'string' && data.dataUrl) {
      this.clientAudioCache.set(cacheKey, data.dataUrl);
    }

    return {
      dataUrl: data.dataUrl,
      cached: Boolean(data.cached),
      voiceId,
      durationMs: typeof data.durationMs === 'number' ? data.durationMs : undefined,
    };
  }

  public speak(request: SpeakRequest): void {
    this.queueToken += 1;
    if (this.queuePauseTimer !== null) {
      clearTimeout(this.queuePauseTimer);
      this.queuePauseTimer = null;
    }
    this.speakSingleInternal(request);
  }

  private speakSingleInternal(request: SpeakRequest): void {
    this.lastRequest = request;
    const hadActiveSpeech = this.stopInternal(false);
    const seq = ++this.speakSequence;

    const cleanText = stripActingAnnotations(request.text);
    const cleanRequest: SpeakRequest = { ...request, text: cleanText };

    if (!this.settings.voiceEnabled || (!cleanText && !request.customAudioUrl)) {
      this.setStatus('idle');
      request.onEnd?.();
      return;
    }

    const profile = this.profiles?.[request.characterId];
    const voiceId = request.voiceId ?? this.getVoiceId(request.characterId);
    const acting =
      request.actingInstruction ?? profile?.defaultActingInstruction ?? '';

    const cacheKey = buildAudioCacheKey({
      voiceId,
      text: cleanText,
      actingInstruction: acting,
      voicePrompt: profile?.voicePrompt,
      geminiVoiceName: profile?.geminiVoiceName,
      expressivity: profile?.expressivity,
      rate: profile?.rate,
    });

    const cachedDataUrl = this.clientAudioCache.get(cacheKey);
    const matchingSavedClip =
      profile?.generatedAudioDataUrl &&
      stripActingAnnotations(profile.generatedAudioText ?? '') === cleanText
        ? profile.generatedAudioDataUrl
        : '';

    const explicitAudioUrl = (
      request.customAudioUrl ||
      profile?.customAudioUrl ||
      cachedDataUrl ||
      matchingSavedClip ||
      ''
    ).trim();

    if (explicitAudioUrl) {
      this.playAudioElement(explicitAudioUrl, cleanRequest, seq);
      return;
    }

    const shouldTryGemini =
      (request.useGemini ?? Boolean(this.settings.geminiBoardEnabled)) &&
      Date.now() > this.geminiQuotaBlockedUntil;

    if (shouldTryGemini) {
      this.setStatus('loading');
      void this.synthesizeWithGemini({
        characterId: request.characterId,
        text: cleanText,
        actingInstruction: acting,
        useLiteModel: true,
      })
        .then(({ dataUrl }) => {
          if (seq !== this.speakSequence) return;
          this.playAudioElement(dataUrl, cleanRequest, seq);
        })
        .catch(() => {
          if (seq !== this.speakSequence) return;
          this.speakViaWebSpeech(cleanRequest, seq);
        });
      return;
    }

    if (hadActiveSpeech) {
      this.pendingSpeechTimer = window.setTimeout(() => {
        this.pendingSpeechTimer = null;
        this.speakViaWebSpeech(cleanRequest, seq);
      }, 45);
    } else {
      this.speakViaWebSpeech(cleanRequest, seq);
    }
  }

  /**
   * Plays a sequential list of dialogue turns (multi-speaker or single narrator) cleanly
   * with zero voice overlap and natural inter-turn breathing pauses.
   */
  public playSequence(
    items: SequenceSpeakItem[],
    options: PlaySequenceOptions = {},
  ): () => void {
    this.stop();
    const myQueueToken = ++this.queueToken;
    const pauseMs = options.pauseBetweenTurnsMs ?? 480;
    const queue = items.filter((it) => stripActingAnnotations(it.text).length > 0 || it.customAudioUrl);

    if (queue.length === 0) {
      options.onComplete?.();
      return () => {};
    }

    const playAt = (idx: number) => {
      if (myQueueToken !== this.queueToken) return;
      if (idx >= queue.length) {
        this.setStatus('idle');
        options.onComplete?.();
        return;
      }

      const item = queue[idx];
      let advanced = false;

      const advanceNext = () => {
        if (advanced || myQueueToken !== this.queueToken) return;
        advanced = true;
        options.onTurnEnd?.(item, idx);
        if (idx + 1 >= queue.length) {
          this.setStatus('idle');
          options.onComplete?.();
          return;
        }
        this.queuePauseTimer = window.setTimeout(() => {
          this.queuePauseTimer = null;
          playAt(idx + 1);
        }, pauseMs);
      };

      options.onTurnStart?.(item, idx);

      if (!this.settings.voiceEnabled) {
        const readTimeMs = Math.min(7500, Math.max(2200, item.text.length * 42));
        this.queuePauseTimer = window.setTimeout(advanceNext, readTimeMs);
        return;
      }

      this.speakSingleInternal({
        characterId: item.characterId,
        voiceId: item.voiceId,
        text: item.text,
        actingInstruction: item.actingInstruction,
        customAudioUrl: item.customAudioUrl,
        useGemini: options.useGemini,
        onEnd: advanceNext,
      });
    };

    playAt(0);

    return () => {
      if (myQueueToken === this.queueToken) {
        this.stop();
      }
    };
  }

  public playDirectAudio(
    audioUrl: string,
    onEnd?: () => void,
    characterId: CharacterId = 'narrador',
    skipPitchSculpt = false,
  ): void {
    this.queueToken += 1;
    this.stopInternal(false);
    const seq = ++this.speakSequence;
    if (!audioUrl.trim()) {
      this.setStatus('idle');
      onEnd?.();
      return;
    }
    this.playAudioElement(
      audioUrl,
      {
        text: '',
        characterId,
        customAudioUrl: audioUrl,
        onEnd,
      },
      seq,
      skipPitchSculpt,
    );
  }

  private getSculptedWavUrl(audioUrl: string, characterId: CharacterId): string {
    if (!/^data:audio\/wav;base64,/i.test(audioUrl)) {
      return audioUrl;
    }
    const profile = this.profiles?.[characterId];
    if (!profile) return audioUrl;

    const sculptKey = `${audioUrl.length}:${audioUrl.slice(-48)}:${profile.pitch.toFixed(2)}:${profile.rate.toFixed(2)}:${profile.gender ?? 'm'}:${profile.register ?? 'medio'}`;
    const hit = this.sculptedAudioCache.get(sculptKey);
    if (hit) return hit;

    const sculpted = transformWavDataUrl(audioUrl, {
      pitch: profile.pitch,
      rate: profile.rate,
      gender: profile.gender,
      register: profile.register,
    });
    if (this.sculptedAudioCache.size >= 40) {
      const oldest = this.sculptedAudioCache.keys().next().value;
      if (oldest) this.sculptedAudioCache.delete(oldest);
    }
    this.sculptedAudioCache.set(sculptKey, sculpted);
    return sculpted;
  }

  private playAudioElement(
    audioUrl: string,
    request: SpeakRequest,
    seq: number,
    skipPitchSculpt = false,
  ): void {
    if (seq !== this.speakSequence) return;
    const finalUrl = skipPitchSculpt
      ? audioUrl
      : this.getSculptedWavUrl(audioUrl, request.characterId);
    const el = new Audio(finalUrl);
    const charVol = this.profiles?.[request.characterId]?.volume ?? 1.0;
    el.volume = Math.max(0, Math.min(1, this.settings.masterVolume * charVol));
    this.currentAudioEl = el;

    let started = false;
    let finished = false;
    const markStarted = () => {
      if (started || seq !== this.speakSequence) return;
      started = true;
      this.setStatus('speaking');
      request.onStart?.();
    };
    const markFinished = () => {
      if (finished || seq !== this.speakSequence) return;
      finished = true;
      if (this.currentAudioEl === el) {
        this.currentAudioEl = null;
      }
      this.setStatus('idle');
      request.onEnd?.();
    };

    el.onplay = markStarted;
    el.onended = markFinished;
    el.onerror = () => {
      if (seq !== this.speakSequence || finished) return;
      if (this.currentAudioEl === el) {
        this.currentAudioEl = null;
      }
      if (request.text.trim()) {
        this.speakViaWebSpeech(request, seq);
      } else {
        markFinished();
      }
    };

    el.play()
      .then(() => {
        markStarted();
      })
      .catch(() => {
        if (seq !== this.speakSequence || finished) return;
        if (this.currentAudioEl === el) {
          this.currentAudioEl = null;
        }
        if (request.text.trim()) {
          this.speakViaWebSpeech(request, seq);
        } else {
          markFinished();
        }
      });
  }

  private speakViaWebSpeech(request: SpeakRequest, seq: number): void {
    if (seq !== this.speakSequence) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.setStatus('idle');
      request.onEnd?.();
      return;
    }

    try {
      const profile = this.profiles?.[request.characterId];
      const prosody = computeExpressiveProsody(
        profile,
        request.actingInstruction,
        this.settings.masterVolume,
      );

      const utterance = new SpeechSynthesisUtterance(request.text);
      const voice = this.pickLatinSpanishVoice(request.characterId);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = prosody.lang;
      }

      utterance.pitch = prosody.pitch;
      utterance.rate = prosody.rate;
      utterance.volume = prosody.volume;

      let started = false;
      let finished = false;
      const finish = () => {
        if (finished || seq !== this.speakSequence) return;
        finished = true;
        this.setStatus('idle');
        request.onEnd?.();
      };

      const handleErrorOrEarlyEnd = () => {
        if (finished || seq !== this.speakSequence) return;
        if (!started) {
          started = true;
          this.setStatus('speaking');
          request.onStart?.();
          const readHoldMs = Math.min(4200, Math.max(2000, request.text.length * 36));
          this.pendingSpeechTimer = window.setTimeout(() => {
            this.pendingSpeechTimer = null;
            finish();
          }, readHoldMs);
          return;
        }
        finish();
      };

      utterance.onstart = () => {
        if (seq !== this.speakSequence || started) return;
        started = true;
        this.setStatus('speaking');
        request.onStart?.();
      };
      utterance.onend = finish;
      utterance.onerror = handleErrorOrEarlyEnd;

      this.setStatus('speaking');
      window.speechSynthesis.speak(utterance);
    } catch {
      this.setStatus('idle');
      request.onEnd?.();
    }
  }

  public pause(): void {
    if (this.currentAudioEl && !this.currentAudioEl.paused) {
      this.currentAudioEl.pause();
      this.setStatus('paused');
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      if (this.status === 'speaking') this.setStatus('paused');
    }
  }

  public resume(): void {
    if (this.currentAudioEl && this.currentAudioEl.paused) {
      void this.currentAudioEl.play();
      this.setStatus('speaking');
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      if (this.status === 'paused') this.setStatus('speaking');
    }
  }

  public repeatLast(): void {
    if (this.lastRequest) {
      this.speak(this.lastRequest);
    }
  }

  public stop(): void {
    this.queueToken += 1;
    this.speakSequence += 1;
    if (this.queuePauseTimer !== null) {
      clearTimeout(this.queuePauseTimer);
      this.queuePauseTimer = null;
    }
    this.stopInternal(true);
  }

  private stopInternal(resetStatus: boolean): boolean {
    if (this.pendingSpeechTimer !== null) {
      clearTimeout(this.pendingSpeechTimer);
      this.pendingSpeechTimer = null;
    }
    if (this.currentAudioEl) {
      this.currentAudioEl.onplay = null;
      this.currentAudioEl.onended = null;
      this.currentAudioEl.onerror = null;
      this.currentAudioEl.pause();
      this.currentAudioEl.src = '';
      this.currentAudioEl = null;
    }
    let cancelledSpeech = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        cancelledSpeech = true;
      }
    }
    if (resetStatus) {
      this.setStatus('idle');
    }
    return cancelledSpeech;
  }
}

export const audioService = new AudioService();
