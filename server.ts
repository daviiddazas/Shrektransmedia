import 'dotenv/config';
import crypto from 'crypto';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const TTS_MODEL = 'gemini-3.8-flash-tts';
const TTS_LITE_MODEL = 'gemini-3.8-flash-lite-tts';
const VALID_VOICES = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);
const CACHE_DIR = '/tmp/shrek-tts-cache';
const MAX_MEM_CACHE = 80;

type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

interface ArchetypeDefault {
  voiceId: string;
  voiceName: VoiceName;
  style: string;
  defaultActingInstruction: string;
}

const ARCHETYPE_DEFAULTS: Record<string, ArchetypeDefault> = {
  narrador: {
    voiceId: 'VOICE_NARRATOR',
    voiceName: 'Charon',
    style:
      'Voz adulta de registro medio-grave, cálida, envolvente y perfectamente articulada en español latinoamericano natural y neutral. Suena como quien narra un cuento cinematográfico frente a un público vivo, con cadencia orgánica, misterio y emoción sin lectura mecánica.',
    defaultActingInstruction:
      'Narración cinematográfica de cuento clásico; ritmo pausado y envolvente, creando expectativa.',
  },
  shrek: {
    voiceId: 'VOICE_SHREK',
    voiceName: 'Fenrir',
    style:
      'Voz masculina grave, robusta, con resonancia de pecho y textura ligeramente áspera en español latinoamericano natural. Registro bajo, articulación orgánica y ritmo pausado; humor seco, ironía e impaciencia ocasional, con ternura genuina al hablar de Fiona o su familia. Nunca suena como locutor.',
    defaultActingInstruction:
      'Habla con ritmo pausado, registro grave y humor seco; impaciencia contenida con fondo sincero.',
  },
  burro: {
    voiceId: 'VOICE_DONKEY',
    voiceName: 'Puck',
    style:
      'Voz masculina de registro medio-agudo, brillante, expresiva y ligeramente nasal en español latinoamericano natural. Ritmo rápido, entusiasmo contagioso, espontaneidad, sorpresa, humor e inflexiones cambiantes incluso en frases cortas.',
    defaultActingInstruction:
      'Ritmo ágil y suelto, energía alta, entonación ascendente de sorpresa o entusiasmo y humor espontáneo.',
  },
  fiona: {
    voiceId: 'VOICE_FIONA',
    voiceName: 'Kore',
    style:
      'Voz femenina de registro medio, cálida, clara, firme y expresiva en español latinoamericano natural. Proyecta seguridad, inteligencia, cercanía, valentía y ternura equilibrada, evitando sonar infantil o demasiado solemne.',
    defaultActingInstruction:
      'Tono firme y cercano, articulación clara; alterna calidez honesta y determinación valiente.',
  },
  gato: {
    voiceId: 'VOICE_PUSS',
    voiceName: 'Charon',
    style:
      'Voz masculina de registro medio, cálida, teatral, elegante y con dicción precisa en español latinoamericano natural y neutral. Interpretación dramática en su justa medida, persuasiva, aventurera, pícara y segura.',
    defaultActingInstruction:
      'Interpretación teatral, elegante y segura en español latinoamericano neutral; pausas breves y toque pícaro.',
  },
  farquaad: {
    voiceId: 'VOICE_FARQUAAD',
    voiceName: 'Puck',
    style:
      'Voz masculina de registro medio-agudo, limpia, controlada y con pronunciación precisa en español latinoamericano natural. Tono autoritario, presumido, rígido, mandón y exageradamente formal.',
    defaultActingInstruction:
      'Dicción exacta y tensa; tono autoritario, rígido y exageradamente formal.',
  },
  hada: {
    voiceId: 'VOICE_FAIRY_GODMOTHER',
    voiceName: 'Zephyr',
    style:
      'Voz femenina madura, de registro medio, brillante y envolvente en español latinoamericano natural. Proyecta elegancia, persuasión y dulzura superficial, dejando sentir seguridad, ironía y amenaza sutil.',
    defaultActingInstruction:
      'Tono meloso, elegante y controlado en la superficie, con ironía fina y firmeza persuasiva.',
  },
  principe: {
    voiceId: 'VOICE_CHARMING',
    voiceName: 'Puck',
    style:
      'Voz masculina de registro medio-agudo, pulida y teatral en español latinoamericano natural. Transmite vanidad, presunción, dramatismo, exceso de confianza y entonación exageradamente elegante.',
    defaultActingInstruction:
      'Entonación pulida, confiada y exageradamente elegante; dramatismo vanidoso y sonrisa ensayada.',
  },
  jengibre: {
    voiceId: 'VOICE_GINGY',
    voiceName: 'Puck',
    style:
      'Voz masculina aguda, ligera, vivaz y muy expresiva en español latinoamericano natural. Combina rapidez, nerviosismo chispeante, valentía frente al peligro, sorpresa y humor sin caer en distorsión artificial.',
    defaultActingInstruction:
      'Habla rápido y con chispa aguda; mezcla tensión nerviosa con valentía desafiante.',
  },
};

const memAudioCache = new Map<string, Buffer>();

function ensureCacheDir(): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch {
    // Non-fatal if filesystem cache cannot be created
  }
}

function buildAudioCacheKey(payload: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function getCachedWav(key: string): Buffer | null {
  const mem = memAudioCache.get(key);
  if (mem) {
    // Refresh LRU order
    memAudioCache.delete(key);
    memAudioCache.set(key, mem);
    return mem;
  }
  try {
    const filePath = path.join(CACHE_DIR, `${key}.wav`);
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      if (buf.length > 44) {
        memAudioCache.set(key, buf);
        return buf;
      }
    }
  } catch {
    // Ignore disk read error
  }
  return null;
}

function setCachedWav(key: string, buf: Buffer): void {
  if (buf.length <= 44) return;
  if (memAudioCache.size >= MAX_MEM_CACHE) {
    const oldest = memAudioCache.keys().next().value;
    if (oldest) memAudioCache.delete(oldest);
  }
  memAudioCache.set(key, buf);
  try {
    ensureCacheDir();
    fs.writeFileSync(path.join(CACHE_DIR, `${key}.wav`), buf);
  } catch {
    // Non-fatal
  }
}

function estimateWavDurationMs(wavBuffer: Buffer): number {
  if (wavBuffer.length <= 44) return 0;
  // Gemini TTS unary WAV default: 24kHz, mono, 16-bit LE = 48,000 bytes/sec
  const pcmBytes = wavBuffer.length - 44;
  return Math.round((pcmBytes / 48000) * 1000);
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sanitizeVoiceName(raw: unknown, fallback: VoiceName = 'Fenrir'): VoiceName {
  if (typeof raw === 'string' && VALID_VOICES.has(raw)) {
    return raw as VoiceName;
  }
  return fallback;
}

function mapLabelToKey(label: string): string {
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

function buildComposedStyle(
  baseStyle: string,
  actingInstruction?: string,
  expressivity = 0.8,
  rate = 1.0,
): string {
  const cleanBase = baseStyle.trim();
  const cleanActing = (actingInstruction ?? '').trim();
  const pacingHint =
    rate <= 0.88
      ? 'Ritmo pausado y contenido.'
      : rate >= 1.15
        ? 'Ritmo ágil y rápido.'
        : 'Ritmo conversacional natural.';
  const exprHint =
    expressivity >= 0.85
      ? 'Alta expresividad emocional, inflexiones vivas y pausas orgánicas.'
      : expressivity <= 0.55
        ? 'Expresividad sobria y medida.'
        : 'Expresividad equilibrada y natural.';

  return [
    cleanBase,
    cleanActing ? `Dirección de escena para esta línea: ${cleanActing}.` : '',
    pacingHint,
    exprHint,
    'Habla en español latinoamericano natural. No leas descripciones, nombres de personaje ni acotaciones entre paréntesis; úsalas solo para modular la actuación.',
  ]
    .filter(Boolean)
    .join(' ');
}

interface ParsedLine {
  speakerLabel: string;
  characterKey: string;
  stageDirection: string;
  dialogue: string;
}

function parseScriptLines(script: string): ParsedLine[] {
  const lines = script
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out: ParsedLine[] = [];
  for (const line of lines) {
    if (line.startsWith('[')) continue;
    const idx = line.indexOf(':');
    if (idx <= 0) {
      out.push({
        speakerLabel: 'Narrador',
        characterKey: 'narrador',
        stageDirection: '',
        dialogue: line,
      });
      continue;
    }
    const speakerLabel = line.slice(0, idx).trim();
    const rest = line.slice(idx + 1).trim();
    const match = rest.match(/^\(([^)]+)\)\s*(.*)$/);
    const stageDirection = match ? match[1].trim() : '';
    const dialogue = match ? match[2].trim() : rest;
    if (!dialogue) continue;
    out.push({
      speakerLabel,
      characterKey: mapLabelToKey(speakerLabel),
      stageDirection,
      dialogue,
    });
  }
  return out;
}

function mergeWavBuffersServer(clips: Buffer[]): Buffer {
  const valid = clips.filter((c) => c.length > 44);
  if (valid.length === 0) return Buffer.alloc(0);
  if (valid.length === 1) return valid[0];

  const headerSize = 44;
  const totalPcm = valid.reduce((acc, buf) => acc + (buf.length - headerSize), 0);
  const out = Buffer.alloc(headerSize + totalPcm);
  valid[0].copy(out, 0, 0, headerSize);

  let offset = headerSize;
  for (const buf of valid) {
    buf.copy(out, offset, headerSize);
    offset += buf.length - headerSize;
  }

  out.writeUInt32LE(36 + totalPcm, 4);
  out.writeUInt32LE(totalPcm, 40);
  return out;
}

async function synthesizeSingleClip(
  ai: GoogleGenAI,
  text: string,
  style: string,
  voiceName: VoiceName,
  model: string = TTS_MODEL,
): Promise<{ buffer: Buffer; cached: boolean }> {
  const cacheKey = buildAudioCacheKey({
    v: 2,
    model,
    voiceName,
    style,
    text,
  });
  const cached = getCachedWav(cacheKey);
  if (cached) {
    return { buffer: cached, cached: true };
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style,
                },
              } as unknown as { text: string },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];
      for (const part of parts) {
        const inline = (part as { inlineData?: { data?: string } }).inlineData;
        if (inline?.data) {
          const buf = Buffer.from(inline.data, 'base64');
          setCachedWav(cacheKey, buf);
          return { buffer: buf, cached: false };
        }
      }
      const finishReason = candidate?.finishReason ?? 'UNKNOWN';
      throw new Error(`El modelo no devolvió audio (motivo: ${finishReason}).`);
    } catch (err) {
      lastErr = err;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 450));
      }
    }
  }
  throw lastErr;
}

async function synthesizeDualSpeakerScene(
  ai: GoogleGenAI,
  lines: Array<{
    speaker: string;
    text: string;
    style: string;
    voiceName: VoiceName;
  }>,
): Promise<{ buffer: Buffer; cached: boolean }> {
  const speakerMap = new Map<string, VoiceName>();
  for (const l of lines) {
    if (!speakerMap.has(l.speaker)) {
      speakerMap.set(l.speaker, l.voiceName);
    }
  }
  if (speakerMap.size !== 2) {
    throw new Error('multiSpeakerVoiceConfig requiere exactamente 2 interlocutores.');
  }

  const cacheKey = buildAudioCacheKey({
    v: 2,
    kind: 'dual',
    model: TTS_MODEL,
    lines,
  });
  const cached = getCachedWav(cacheKey);
  if (cached) {
    return { buffer: cached, cached: true };
  }

  const speakerVoiceConfigs = Array.from(speakerMap.entries()).map(([speaker, voiceName]) => ({
    speaker,
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName },
    },
  }));

  const parts = lines.map((line) => ({
    text: `${line.speaker}: ${line.text}`,
    speechMetadata: {
      speaker: line.speaker,
      style: line.style,
    },
  })) as unknown as Array<{ text: string }>;

  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs,
        },
      },
    },
  });

  const candidate = response.candidates?.[0];
  const respParts = candidate?.content?.parts ?? [];
  for (const part of respParts) {
    const inline = (part as { inlineData?: { data?: string } }).inlineData;
    if (inline?.data) {
      const buf = Buffer.from(inline.data, 'base64');
      setCachedWav(cacheKey, buf);
      return { buffer: buf, cached: false };
    }
  }
  const finishReason = candidate?.finishReason ?? 'UNKNOWN';
  throw new Error(`El modelo dual no devolvió audio (motivo: ${finishReason}).`);
}

function extractErrorStatusAndMessage(err: unknown): {
  status: number;
  message: string;
} {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'Error inesperado al generar voz con Gemini API.';

  if (/429|RESOURCE_EXHAUSTED|quota/i.test(raw)) {
    return {
      status: 429,
      message:
        'Se alcanzó temporalmente el límite diario gratuito de Gemini TTS. Las voces locales expresivas y los audios ya guardados en caché siguen funcionando con normalidad.',
    };
  }
  return { status: 502, message: raw };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/voice-design/status', (_req: Request, res: Response) => {
    res.json({
      configured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      model: TTS_MODEL,
      liteModel: TTS_LITE_MODEL,
      cacheCount: memAudioCache.size,
      voices: Object.fromEntries(
        Object.entries(ARCHETYPE_DEFAULTS).map(([key, def]) => [
          key,
          { voiceId: def.voiceId, voiceName: def.voiceName },
        ]),
      ),
    });
  });

  app.post('/api/voice-design/generate', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Falta la clave GEMINI_API_KEY en el servidor. Configúrala en Secrets para generar voces con Gemini API.',
      });
      return;
    }

    const {
      text,
      voicePrompt,
      voiceName,
      archetypeName,
      voiceId,
      characterId,
      actingInstruction,
      expressivity,
      rate,
      useLiteModel,
    } = (req.body ?? {}) as Record<string, unknown>;

    if (typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Debes escribir un texto para generar la voz.' });
      return;
    }
    if (text.length > 1600) {
      res.status(400).json({ error: 'El texto supera el límite de 1600 caracteres.' });
      return;
    }

    const charKey = typeof characterId === 'string' ? characterId : 'shrek';
    const def = ARCHETYPE_DEFAULTS[charKey] ?? ARCHETYPE_DEFAULTS.shrek;
    const baseStyle =
      typeof voicePrompt === 'string' && voicePrompt.trim()
        ? voicePrompt.trim().slice(0, 1200)
        : def.style;
    const chosenVoice = sanitizeVoiceName(voiceName, def.voiceName);
    const acting =
      typeof actingInstruction === 'string' && actingInstruction.trim()
        ? actingInstruction.trim().slice(0, 500)
        : def.defaultActingInstruction;
    const exprNum = typeof expressivity === 'number' ? expressivity : 0.8;
    const rateNum = typeof rate === 'number' ? rate : 1.0;
    const model = useLiteModel === true ? TTS_LITE_MODEL : TTS_MODEL;

    const fullStyle = buildComposedStyle(baseStyle, acting, exprNum, rateNum);

    try {
      const { buffer, cached } = await synthesizeSingleClip(
        ai,
        text.trim(),
        fullStyle,
        chosenVoice,
        model,
      );
      const audioBase64 = buffer.toString('base64');
      res.json({
        model,
        voiceId: typeof voiceId === 'string' ? voiceId : def.voiceId,
        archetypeName: typeof archetypeName === 'string' ? archetypeName : '',
        voiceName: chosenVoice,
        mimeType: 'audio/wav',
        cached,
        durationMs: estimateWavDurationMs(buffer),
        audioBase64,
        dataUrl: `data:audio/wav;base64,${audioBase64}`,
      });
    } catch (err) {
      const info = extractErrorStatusAndMessage(err);
      res.status(info.status).json({ error: info.message });
    }
  });

  app.post('/api/voice-design/scene', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Falta la clave GEMINI_API_KEY en el servidor. Configúrala en Secrets para interpretar la escena con Gemini API.',
      });
      return;
    }

    const { mode, styleInstructions, script, profiles } = (req.body ?? {}) as {
      mode?: string;
      styleInstructions?: unknown;
      script?: unknown;
      profiles?: Record<
        string,
        {
          voicePrompt?: string;
          geminiVoiceName?: string;
          defaultActingInstruction?: string;
          expressivity?: number;
          rate?: number;
        }
      >;
    };

    if (typeof script !== 'string' || !script.trim()) {
      res.status(400).json({ error: 'El guion de escena no puede estar vacío.' });
      return;
    }
    if (script.length > 3500) {
      res.status(400).json({ error: 'El guion supera el límite de 3500 caracteres.' });
      return;
    }

    const cleanInstructions =
      typeof styleInstructions === 'string' && styleInstructions.trim()
        ? styleInstructions.trim().slice(0, 1200)
        : 'Actúa como un director y elenco de doblaje en español latinoamericano natural. No leas las acotaciones entre paréntesis; úsalas solo para modular el tono de voz.';

    try {
      if (mode === 'multi_cast') {
        const parsedLines = parseScriptLines(script).slice(0, 12);
        if (parsedLines.length === 0) {
          res.status(400).json({ error: 'No se encontraron líneas válidas en el guion.' });
          return;
        }

        const uniqueSpeakers = new Set(parsedLines.map((l) => l.characterKey));
        // Use native dual-speaker multiSpeakerVoiceConfig when exactly 2 distinct characters converse
        if (uniqueSpeakers.size === 2) {
          try {
            const dualLines = parsedLines.map((line) => {
              const fallback = ARCHETYPE_DEFAULTS[line.characterKey] ?? ARCHETYPE_DEFAULTS.narrador;
              const custom = profiles?.[line.characterKey];
              const voiceName = sanitizeVoiceName(custom?.geminiVoiceName, fallback.voiceName);
              const baseStyle =
                typeof custom?.voicePrompt === 'string' && custom.voicePrompt.trim()
                  ? custom.voicePrompt.trim()
                  : fallback.style;
              const style = buildComposedStyle(
                baseStyle,
                line.stageDirection || custom?.defaultActingInstruction || fallback.defaultActingInstruction,
                custom?.expressivity ?? 0.82,
                custom?.rate ?? 1.0,
              );
              return {
                speaker: line.speakerLabel,
                text: line.dialogue,
                style,
                voiceName,
              };
            });
            const { buffer, cached } = await synthesizeDualSpeakerScene(ai, dualLines);
            const audioBase64 = buffer.toString('base64');
            res.json({
              model: TTS_MODEL,
              mode: 'dual_speaker_native',
              lineCount: parsedLines.length,
              cached,
              mimeType: 'audio/wav',
              durationMs: estimateWavDurationMs(buffer),
              audioBase64,
              dataUrl: `data:audio/wav;base64,${audioBase64}`,
            });
            return;
          } catch {
            // Fall through gracefully to per-line stitched synthesis if dual-speaker config fails
          }
        }

        const clips: Buffer[] = [];
        const segments: Array<{
          index: number;
          speaker: string;
          characterId: string;
          text: string;
          startMs: number;
          endMs: number;
        }> = [];
        let cursorMs = 0;

        for (let i = 0; i < parsedLines.length; i++) {
          const line = parsedLines[i];
          const fallback = ARCHETYPE_DEFAULTS[line.characterKey] ?? ARCHETYPE_DEFAULTS.narrador;
          const customProfile = profiles?.[line.characterKey];
          const baseStyle =
            typeof customProfile?.voicePrompt === 'string' && customProfile.voicePrompt.trim()
              ? customProfile.voicePrompt.trim()
              : fallback.style;
          const voiceName = sanitizeVoiceName(customProfile?.geminiVoiceName, fallback.voiceName);
          const fullStyle = buildComposedStyle(
            baseStyle,
            line.stageDirection || customProfile?.defaultActingInstruction || cleanInstructions,
            customProfile?.expressivity ?? 0.82,
            customProfile?.rate ?? 1.0,
          );

          const { buffer } = await synthesizeSingleClip(
            ai,
            line.dialogue,
            fullStyle,
            voiceName,
            TTS_MODEL,
          );
          const dur = estimateWavDurationMs(buffer);
          segments.push({
            index: i,
            speaker: line.speakerLabel,
            characterId: line.characterKey,
            text: line.dialogue,
            startMs: cursorMs,
            endMs: cursorMs + dur,
          });
          cursorMs += dur;
          clips.push(buffer);
        }

        const merged = mergeWavBuffersServer(clips);
        const audioBase64 = merged.toString('base64');
        res.json({
          model: TTS_MODEL,
          mode: 'multi_cast',
          lineCount: parsedLines.length,
          mimeType: 'audio/wav',
          durationMs: cursorMs,
          segments,
          audioBase64,
          dataUrl: `data:audio/wav;base64,${audioBase64}`,
        });
        return;
      }

      const fullPrompt = script.includes('[Guion]')
        ? `${cleanInstructions}\n${script.trim()}`
        : `${cleanInstructions}\n[Guion]\n${script.trim()}`;

      const { buffer, cached } = await synthesizeSingleClip(
        ai,
        fullPrompt,
        'Director y actor de doblaje en español latinoamericano natural dando a cada personaje un cambio notorio pero orgánico según su género, registro, ritmo y calidez. Lee únicamente los diálogos; jamás leas nombres de personajes ni texto entre paréntesis o corchetes.',
        'Fenrir',
        TTS_MODEL,
      );
      const audioBase64 = buffer.toString('base64');
      res.json({
        model: TTS_MODEL,
        mode: 'single_actor',
        cached,
        mimeType: 'audio/wav',
        durationMs: estimateWavDurationMs(buffer),
        audioBase64,
        dataUrl: `data:audio/wav;base64,${audioBase64}`,
      });
    } catch (err) {
      const info = extractErrorStatusAndMessage(err);
      res.status(info.status).json({ error: info.message });
    }
  });

  app.post('/api/voice-design/compare-all', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Falta la clave GEMINI_API_KEY en el servidor. Usa el modo comparativo local en el Estudio de Voces o configura GEMINI_API_KEY.',
      });
      return;
    }

    const { lines, profiles } = (req.body ?? {}) as {
      lines?: Array<{
        characterId: string;
        voiceId?: string;
        speakerName?: string;
        text: string;
        actingInstruction?: string;
      }>;
      profiles?: Record<
        string,
        {
          voiceId?: string;
          voicePrompt?: string;
          geminiVoiceName?: string;
          defaultActingInstruction?: string;
          expressivity?: number;
          rate?: number;
        }
      >;
    };

    if (!Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({ error: 'Se requiere la lista de líneas comparativas.' });
      return;
    }

    try {
      const clips: Buffer[] = [];
      const segments: Array<{
        characterId: string;
        voiceId: string;
        speakerName: string;
        text: string;
        startMs: number;
        endMs: number;
        cached: boolean;
      }> = [];
      let cursorMs = 0;

      for (const item of lines.slice(0, 10)) {
        const charKey = item.characterId in ARCHETYPE_DEFAULTS ? item.characterId : 'narrador';
        const fallback = ARCHETYPE_DEFAULTS[charKey];
        const custom = profiles?.[charKey];
        const voiceName = sanitizeVoiceName(custom?.geminiVoiceName, fallback.voiceName);
        const baseStyle =
          typeof custom?.voicePrompt === 'string' && custom.voicePrompt.trim()
            ? custom.voicePrompt.trim()
            : fallback.style;
        const acting =
          item.actingInstruction ||
          custom?.defaultActingInstruction ||
          fallback.defaultActingInstruction;
        const fullStyle = buildComposedStyle(
          baseStyle,
          acting,
          custom?.expressivity ?? 0.85,
          custom?.rate ?? 1.0,
        );

        const { buffer, cached } = await synthesizeSingleClip(
          ai,
          item.text.trim(),
          fullStyle,
          voiceName,
          TTS_MODEL,
        );
        const dur = estimateWavDurationMs(buffer);
        segments.push({
          characterId: charKey,
          voiceId: item.voiceId || custom?.voiceId || fallback.voiceId,
          speakerName: item.speakerName || charKey,
          text: item.text.trim(),
          startMs: cursorMs,
          endMs: cursorMs + dur,
          cached,
        });
        cursorMs += dur;
        clips.push(buffer);
      }

      const merged = mergeWavBuffersServer(clips);
      const audioBase64 = merged.toString('base64');
      res.json({
        model: TTS_MODEL,
        mimeType: 'audio/wav',
        totalDurationMs: cursorMs,
        segments,
        audioBase64,
        dataUrl: `data:audio/wav;base64,${audioBase64}`,
      });
    } catch (err) {
      const info = extractErrorStatusAndMessage(err);
      res.status(info.status).json({ error: info.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build no encontrado. Ejecuta npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Shrek Transmedia escuchando en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});
