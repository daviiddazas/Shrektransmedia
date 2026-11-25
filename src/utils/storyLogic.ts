import { DEFAULT_STORY_CONFIG } from '../data/defaultStoryData';
import { StoryConfig, StoryStation, WorldPoint } from '../types/story';

export const STORAGE_KEY = 'shrek_cuento_transmedia_config_v1';

export const BOARD_BOUNDS = {
  minX: -21.5,
  maxX: 21.5,
  minZ: -13.0,
  maxZ: 13.0,
} as const;

export function clampToBoard(point: WorldPoint): WorldPoint {
  return {
    x: Math.max(BOARD_BOUNDS.minX, Math.min(BOARD_BOUNDS.maxX, point.x)),
    z: Math.max(BOARD_BOUNDS.minZ, Math.min(BOARD_BOUNDS.maxZ, point.z)),
  };
}

/**
 * Deterministic terrain elevation across the 3D storybook board.
 * Keeps the winding path corridor smooth while sculpting hills around the edges.
 */
export function getGroundHeightAt(x: number, z: number): number {
  // Swamp basin near bottom-left (-17.5, 9.5)
  const swampDist = Math.hypot(x + 17.5, z - 9.5);
  const swampDip = swampDist < 5.5 ? -0.18 * (1 - swampDist / 5.5) : 0;

  // River channel curving vertically near x = -4.5..3.5
  const riverCenterX = -4.5 + Math.sin(z * 0.22) * 2.1;
  const distToRiver = Math.abs(x - riverCenterX);
  const riverDip = distToRiver < 1.85 ? -0.34 * Math.cos((distToRiver / 1.85) * (Math.PI / 2)) : 0;

  // Fiona's castle hill at (-6.5, -9.5)
  const fionaDist = Math.hypot(x + 6.5, z + 9.5);
  const fionaHill = fionaDist < 4.2 ? 0.35 * (1 - fionaDist / 4.2) : 0;

  // Villains crag near (14.5, 2.0) and (10.5, -6.0)
  const villainDist = Math.hypot(x - 14.5, z - 2.0);
  const villainHill = villainDist < 4.0 ? 0.28 * (1 - villainDist / 4.0) : 0;

  // Gentle organic meadow undulation
  const meadow = Math.sin(x * 0.16) * Math.cos(z * 0.19) * 0.1;

  return Math.max(-0.42, meadow + swampDip + riverDip + fionaHill + villainHill);
}

export interface MovementStepResult {
  position: WorldPoint;
  heading: number;
  distanceMoved: number;
  arrived: boolean;
}

export function computeMovementStep(
  current: WorldPoint,
  target: WorldPoint,
  currentHeading: number,
  speed: number,
  dt: number,
  arrivalThreshold = 0.22,
): MovementStepResult {
  const clampedDt = Math.min(Math.max(dt, 0), 0.05);
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const dist = Math.hypot(dx, dz);

  if (dist <= arrivalThreshold || clampedDt === 0) {
    return {
      position: clampToBoard(target),
      heading: currentHeading,
      distanceMoved: 0,
      arrived: true,
    };
  }

  const maxStep = speed * clampedDt;
  const stepDist = Math.min(dist, maxStep);
  const nx = dx / dist;
  const nz = dz / dist;

  const nextPos = clampToBoard({
    x: current.x + nx * stepDist,
    z: current.z + nz * stepDist,
  });

  const targetHeading = Math.atan2(nx, nz);
  return {
    position: nextPos,
    heading: targetHeading,
    distanceMoved: stepDist,
    arrived: dist - stepDist <= arrivalThreshold,
  };
}

export function findNearestStation(
  position: WorldPoint,
  stations: StoryStation[],
  maxDistance = 2.4,
): StoryStation | null {
  let best: StoryStation | null = null;
  let bestDist = maxDistance;
  for (const station of stations) {
    const d = Math.hypot(
      position.x - station.worldPosition.x,
      position.z - station.worldPosition.z,
    );
    if (d <= bestDist) {
      bestDist = d;
      best = station;
    }
  }
  return best;
}

export function catmullRomPoint(
  p0: WorldPoint,
  p1: WorldPoint,
  p2: WorldPoint,
  p3: WorldPoint,
  t: number,
): WorldPoint {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    z:
      0.5 *
      (2 * p1.z +
        (-p0.z + p2.z) * t +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3),
  };
}

export function sampleStationSpline(stations: StoryStation[], subdivisionsPerSegment = 14): WorldPoint[] {
  if (stations.length === 0) return [];
  if (stations.length === 1) return [{ ...stations[0].worldPosition }];

  const pts = stations.map((s) => s.worldPosition);
  const result: WorldPoint[] = [];

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let step = 0; step < subdivisionsPerSegment; step++) {
      result.push(catmullRomPoint(p0, p1, p2, p3, step / subdivisionsPerSegment));
    }
  }
  result.push({ ...pts[pts.length - 1] });
  return result;
}

export interface VideoRenderInfo {
  kind: 'none' | 'youtube' | 'vimeo' | 'direct' | 'external';
  src: string;
}

export function parseVideoUrl(rawUrl: string): VideoRenderInfo {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { kind: 'none', src: '' };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let videoId = '';
      if (host.includes('youtu.be')) {
        videoId = parsed.pathname.replace('/', '').split('/')[0];
      } else if (parsed.pathname.includes('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] ?? '';
      } else if (parsed.pathname.includes('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] ?? '';
      } else {
        videoId = parsed.searchParams.get('v') ?? '';
      }
      if (videoId) {
        return {
          kind: 'youtube',
          src: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`,
        };
      }
    }

    if (host.includes('vimeo.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const vimeoId = parts[parts.length - 1];
      if (vimeoId && /^\d+$/.test(vimeoId)) {
        return {
          kind: 'vimeo',
          src: `https://player.vimeo.com/video/${vimeoId}`,
        };
      }
    }

    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(parsed.pathname)) {
      return { kind: 'direct', src: trimmed };
    }

    return { kind: 'external', src: trimmed };
  } catch {
    return { kind: 'none', src: '' };
  }
}

export interface ConfigValidationResult {
  ok: boolean;
  config?: StoryConfig;
  error?: string;
}

export function validateStoryConfigJson(rawJson: string): ConfigValidationResult {
  try {
    const parsed = JSON.parse(rawJson) as Partial<StoryConfig>;
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'El archivo JSON no contiene un objeto válido.' };
    }
    if (!Array.isArray(parsed.stations) || parsed.stations.length === 0) {
      return { ok: false, error: 'La configuración debe incluir al menos una estación.' };
    }

    const sanitizedStations: StoryStation[] = DEFAULT_STORY_CONFIG.stations.map((def, idx) => {
      const incoming = parsed.stations?.[idx];
      if (!incoming || typeof incoming !== 'object') return def;
      return {
        ...def,
        canvasTitle:
          typeof incoming.canvasTitle === 'string' && incoming.canvasTitle.trim()
            ? incoming.canvasTitle.trim()
            : def.canvasTitle,
        realmName:
          typeof incoming.realmName === 'string' && incoming.realmName.trim()
            ? incoming.realmName.trim()
            : def.realmName,
        narratorIntro:
          typeof incoming.narratorIntro === 'string' ? incoming.narratorIntro : def.narratorIntro,
        narratorActingInstruction:
          typeof incoming.narratorActingInstruction === 'string'
            ? incoming.narratorActingInstruction
            : def.narratorActingInstruction,
        modalTitle:
          typeof incoming.modalTitle === 'string' && incoming.modalTitle.trim()
            ? incoming.modalTitle.trim()
            : def.modalTitle,
        modalSummary:
          typeof incoming.modalSummary === 'string' ? incoming.modalSummary : def.modalSummary,
        imageUrl: typeof incoming.imageUrl === 'string' ? incoming.imageUrl : def.imageUrl,
        videoUrl: typeof incoming.videoUrl === 'string' ? incoming.videoUrl : def.videoUrl,
        intervention: {
          ...def.intervention,
          ...(incoming.intervention && typeof incoming.intervention === 'object'
            ? {
                characterId: incoming.intervention.characterId ?? def.intervention.characterId,
                characterName:
                  typeof incoming.intervention.characterName === 'string' &&
                  incoming.intervention.characterName.trim()
                    ? incoming.intervention.characterName.trim()
                    : def.intervention.characterName,
                dialogue:
                  typeof incoming.intervention.dialogue === 'string'
                    ? incoming.intervention.dialogue
                    : def.intervention.dialogue,
                actingInstruction:
                  typeof incoming.intervention.actingInstruction === 'string'
                    ? incoming.intervention.actingInstruction
                    : def.intervention.actingInstruction,
                portraitUrl:
                  typeof incoming.intervention.portraitUrl === 'string'
                    ? incoming.intervention.portraitUrl
                    : def.intervention.portraitUrl,
                customAudioUrl:
                  typeof incoming.intervention.customAudioUrl === 'string'
                    ? incoming.intervention.customAudioUrl
                    : def.intervention.customAudioUrl,
              }
            : {}),
        },
        dialogueTurns: Array.isArray(incoming.dialogueTurns)
          ? incoming.dialogueTurns
          : def.dialogueTurns,
      };
    });

    const isLegacyVoiceVersion = (parsed.version ?? 1) < DEFAULT_STORY_CONFIG.version;
    const mergedVoices = structuredClone(DEFAULT_STORY_CONFIG.characterVoices);
    if (parsed.characterVoices && typeof parsed.characterVoices === 'object') {
      for (const [key, defVoice] of Object.entries(DEFAULT_STORY_CONFIG.characterVoices)) {
        const cid = key as keyof typeof mergedVoices;
        const inc = (parsed.characterVoices as Record<string, Partial<typeof defVoice>>)[key];
        if (inc && typeof inc === 'object') {
          mergedVoices[cid] = isLegacyVoiceVersion
            ? {
                ...defVoice,
                customAudioUrl:
                  typeof inc.customAudioUrl === 'string'
                    ? inc.customAudioUrl
                    : defVoice.customAudioUrl,
                generatedAudioDataUrl:
                  typeof inc.generatedAudioDataUrl === 'string'
                    ? inc.generatedAudioDataUrl
                    : defVoice.generatedAudioDataUrl,
                generatedAudioText:
                  typeof inc.generatedAudioText === 'string'
                    ? inc.generatedAudioText
                    : defVoice.generatedAudioText,
              }
            : {
                ...defVoice,
                ...inc,
                voiceId: defVoice.voiceId,
              };
        }
      }
    }

    const merged: StoryConfig = {
      ...DEFAULT_STORY_CONFIG,
      version: DEFAULT_STORY_CONFIG.version,
      bookTitle:
        typeof parsed.bookTitle === 'string' && parsed.bookTitle.trim()
          ? parsed.bookTitle.trim()
          : DEFAULT_STORY_CONFIG.bookTitle,
      bookSubtitle:
        typeof parsed.bookSubtitle === 'string' && parsed.bookSubtitle.trim()
          ? parsed.bookSubtitle.trim()
          : DEFAULT_STORY_CONFIG.bookSubtitle,
      coverTagline:
        typeof parsed.coverTagline === 'string'
          ? parsed.coverTagline
          : DEFAULT_STORY_CONFIG.coverTagline,
      openingNarration:
        typeof parsed.openingNarration === 'string'
          ? parsed.openingNarration
          : DEFAULT_STORY_CONFIG.openingNarration,
      stations: sanitizedStations,
      characterVoices: mergedVoices,
      audioSettings: {
        ...DEFAULT_STORY_CONFIG.audioSettings,
        ...(parsed.audioSettings ?? {}),
      },
    };

    return { ok: true, config: merged };
  } catch {
    return { ok: false, error: 'El archivo seleccionado no tiene formato JSON válido.' };
  }
}

export interface ScreenplayLine {
  speakerLabel: string;
  characterId: import('../types/story').CharacterId;
  stageDirection: string;
  dialogue: string;
}

export function mapSpeakerToCharacterId(label: string): import('../types/story').CharacterId {
  const norm = label.trim().toLowerCase();
  if (/ogro|shrek/.test(norm)) return 'shrek';
  if (/compa|burro|asno/.test(norm)) return 'burro';
  if (/princesa|fiona/.test(norm)) return 'fiona';
  if (/gato|espadach/.test(norm)) return 'gato';
  if (/farquaad|lord/.test(norm)) return 'farquaad';
  if (/hada/.test(norm)) return 'hada';
  if (/encantador|pr[ií]ncipe/.test(norm)) return 'principe';
  if (/jengi|galleta/.test(norm)) return 'jengibre';
  return 'narrador';
}

/**
 * Parses lines formatted as:
 * "Ogro: (Con fastidio y tono grave, suspirando) Mira, te lo voy a decir..."
 */
export function parseScreenplayLines(script: string): ScreenplayLine[] {
  const lines = script
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed: ScreenplayLine[] = [];
  for (const line of lines) {
    if (line.startsWith('[')) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx <= 0) {
      parsed.push({
        speakerLabel: 'Narrador',
        characterId: 'narrador',
        stageDirection: '',
        dialogue: line,
      });
      continue;
    }
    const speakerLabel = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();
    const dirMatch = rest.match(/^\(([^)]+)\)\s*(.*)$/);
    const stageDirection = dirMatch ? dirMatch[1].trim() : '';
    const dialogue = dirMatch ? dirMatch[2].trim() : rest;
    if (!dialogue) continue;
    parsed.push({
      speakerLabel,
      characterId: mapSpeakerToCharacterId(speakerLabel),
      stageDirection,
      dialogue,
    });
  }
  return parsed;
}

export function buildSingleActorScenePrompt(
  styleInstructions: string,
  script: string,
): string {
  const cleanInstructions = styleInstructions.trim();
  const cleanScript = script.trim();
  if (cleanScript.includes('[Guion]')) {
    return `${cleanInstructions}\n${cleanScript}`.trim();
  }
  return `${cleanInstructions}\n[Guion]\n${cleanScript}`.trim();
}

/**
 * Concatenates multiple 24kHz mono 16-bit WAV buffers produced by Gemini unary TTS
 * by keeping the first 44-byte RIFF header, stripping subsequent 44-byte headers,
 * and updating RIFF chunk size (offset 4) and data chunk size (offset 40).
 */
export function mergeWavBuffers(wavClips: Uint8Array[]): Uint8Array {
  const valid = wavClips.filter((c) => c.byteLength > 44);
  if (valid.length === 0) return new Uint8Array(0);
  if (valid.length === 1) return new Uint8Array(valid[0]);

  const headerSize = 44;
  let totalPcmBytes = 0;
  for (const clip of valid) {
    totalPcmBytes += clip.byteLength - headerSize;
  }

  const out = new Uint8Array(headerSize + totalPcmBytes);
  out.set(valid[0].subarray(0, headerSize), 0);

  let offset = headerSize;
  for (const clip of valid) {
    const pcm = clip.subarray(headerSize);
    out.set(pcm, offset);
    offset += pcm.byteLength;
  }

  const view = new DataView(out.buffer);
  view.setUint32(4, 36 + totalPcmBytes, true);
  view.setUint32(40, totalPcmBytes, true);
  return out;
}

export interface NormalizedImageResult {
  ok: boolean;
  url: string;
  error?: string;
}

export function normalizePublicImageUrl(rawUrl: string): NormalizedImageResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      ok: false,
      url: '',
      error: 'Ingresa el enlace público de una imagen (https://...).',
    };
  }
  if (trimmed.startsWith('/')) {
    return { ok: true, url: trimmed };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        ok: false,
        url: '',
        error: 'El enlace debe comenzar con https:// o http://.',
      };
    }
    if (
      parsed.hostname.toLowerCase() === 'github.com' &&
      parsed.pathname.includes('/blob/') &&
      !parsed.searchParams.has('raw')
    ) {
      parsed.searchParams.set('raw', 'true');
    }
    return { ok: true, url: parsed.toString() };
  } catch {
    return {
      ok: false,
      url: '',
      error: 'El enlace ingresado no es una URL válida.',
    };
  }
}

export interface DialogueCameraFraming {
  target: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}

export function computeDialogueCameraFraming(
  shrekPos: WorldPoint,
  companionPos: WorldPoint | null,
  shrekGroundY: number,
  companionGroundY: number,
  inConversation: boolean,
): DialogueCameraFraming {
  if (!inConversation) {
    return {
      target: { x: shrekPos.x, y: shrekGroundY + 0.8, z: shrekPos.z },
      position: { x: shrekPos.x + 2.2, y: 14.0, z: shrekPos.z + 14.5 },
    };
  }

  if (!companionPos) {
    return {
      target: { x: shrekPos.x, y: shrekGroundY + 0.92, z: shrekPos.z },
      position: { x: shrekPos.x + 0.9, y: shrekGroundY + 5.0, z: shrekPos.z + 6.4 },
    };
  }

  const midX = (shrekPos.x + companionPos.x) * 0.5;
  const midZ = (shrekPos.z + companionPos.z) * 0.5;
  const midY = (shrekGroundY + companionGroundY) * 0.5 + 0.85;

  return {
    target: { x: midX, y: midY, z: midZ },
    position: { x: midX + 0.85, y: midY + 4.1, z: midZ + 6.3 },
  };
}

export const NARRATION_TIMING = {
  /** Brief natural pause after narrator finishes before companion enters & zooms */
  pauseAfterNarratorMs: 450,
  /** Natural breathing pause between consecutive character dialogue turns */
  pauseBetweenTurnsMs: 420,
  /** Immediate transition right after companion finishes speaking */
  pauseAfterCompanionMs: 150,
  /** Watchdog timeout if audio never starts playing (e.g. muted/silent browser TTS) */
  startWatchdogMs: 4200,
  /** Max single-clip duration cap once playback has started */
  maxClipDurationMs: 32000,
  /** Reading delay when autoNarrate is disabled */
  silentNarratorHoldMs: 3200,
  silentCompanionHoldMs: 4800,
} as const;

/**
 * Returns the target station followed by the next sequential station on the route
 * so voice clips can be prefetched in advance without redundant duplicates.
 */
export function getStationsToPrefetch(
  stations: StoryStation[],
  targetStationId: number,
): StoryStation[] {
  const idx = stations.findIndex((s) => s.id === targetStationId);
  if (idx < 0) return [];
  const result: StoryStation[] = [stations[idx]];
  if (idx + 1 < stations.length) {
    result.push(stations[idx + 1]);
  }
  return result;
}


