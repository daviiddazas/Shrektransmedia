import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Square,
  Users,
  Volume2,
} from 'lucide-react';
import { audioService } from '../audio/audioService';
import { soundEngine } from '../audio/soundEngine';
import { DEFAULT_STORY_CONFIG } from '../data/defaultStoryData';
import {
  ALL_VOICES_COMPARISON_LINES,
  VOICE_STUDY_SAMPLE_TEXTS,
} from '../data/voiceProfiles';
import {
  AudioSettings,
  CharacterId,
  GeminiVoiceName,
  VoiceProfile,
  VoiceRegister,
} from '../types/story';

interface VoiceStudioSectionProps {
  voices: Record<CharacterId, VoiceProfile>;
  audioSettings: AudioSettings;
  onChangeVoices: (next: Record<CharacterId, VoiceProfile>) => void;
  onChangeAudioSettings: (next: AudioSettings) => void;
  onSaveConfiguration: (
    nextVoices: Record<CharacterId, VoiceProfile>,
    nextAudioSettings: AudioSettings,
  ) => void;
}

const STUDIO_CHARACTER_ORDER: CharacterId[] = [
  'narrador',
  'shrek',
  'burro',
  'fiona',
  'gato',
  'farquaad',
  'hada',
  'principe',
  'jengibre',
];

const GEMINI_VOICE_OPTIONS: Array<{ value: GeminiVoiceName; label: string }> = [
  { value: 'Fenrir', label: 'Fenrir (Grave / Resonante)' },
  { value: 'Puck', label: 'Puck (Brillante / Ágil)' },
  { value: 'Kore', label: 'Kore (Firme / Melodiosa)' },
  { value: 'Charon', label: 'Charon (Profunda / Teatral)' },
  { value: 'Zephyr', label: 'Zephyr (Suave / Lírica)' },
];

export const VoiceStudioSection: React.FC<VoiceStudioSectionProps> = ({
  voices,
  audioSettings,
  onChangeVoices,
  onChangeAudioSettings,
  onSaveConfiguration,
}) => {
  const [selectedChar, setSelectedChar] = useState<CharacterId>('shrek');
  const [sampleTexts, setSampleTexts] = useState<Record<CharacterId, string>>(() => ({
    ...VOICE_STUDY_SAMPLE_TEXTS,
  }));
  const [lastTestedChar, setLastTestedChar] = useState<CharacterId>('shrek');
  const [comparingAll, setComparingAll] = useState(false);
  const [activeCompareIdx, setActiveCompareIdx] = useState<number>(-1);
  const [loadingGeminiSingle, setLoadingGeminiSingle] = useState(false);
  const [loadingGeminiCompare, setLoadingGeminiCompare] = useState(false);
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const compareAudioRef = useRef<HTMLAudioElement | null>(null);
  const compareStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetch('/api/voice-design/status')
      .then((r) => r.json())
      .then((d) => setApiConfigured(Boolean(d?.configured)))
      .catch(() => setApiConfigured(false));

    return () => {
      compareStopRef.current?.();
      if (compareAudioRef.current) {
        compareAudioRef.current.pause();
        compareAudioRef.current = null;
      }
      audioService.stop();
    };
  }, []);

  const activeProfile = voices[selectedChar] ?? DEFAULT_STORY_CONFIG.characterVoices[selectedChar];
  const activeSampleText = sampleTexts[selectedChar] ?? VOICE_STUDY_SAMPLE_TEXTS[selectedChar];

  const activeComparisonLine = useMemo(
    () =>
      activeCompareIdx >= 0 && activeCompareIdx < ALL_VOICES_COMPARISON_LINES.length
        ? ALL_VOICES_COMPARISON_LINES[activeCompareIdx]
        : null,
    [activeCompareIdx],
  );

  const updateProfile = (cid: CharacterId, patch: Partial<VoiceProfile>) => {
    const next = {
      ...voices,
      [cid]: { ...voices[cid], ...patch },
    };
    onChangeVoices(next);
    audioService.updateConfig(next, audioSettings);
  };

  const stopComparison = () => {
    compareStopRef.current?.();
    compareStopRef.current = null;
    if (compareAudioRef.current) {
      compareAudioRef.current.pause();
      compareAudioRef.current = null;
    }
    audioService.stop();
    setComparingAll(false);
    setActiveCompareIdx(-1);
  };

  const playCharacterSample = (cid: CharacterId) => {
    stopComparison();
    soundEngine.unlockAudio();
    const prof = voices[cid];
    const text = (sampleTexts[cid] ?? VOICE_STUDY_SAMPLE_TEXTS[cid]).trim();
    if (!text) {
      setFeedback({ type: 'err', text: 'Escribe un texto de prueba antes de reproducir.' });
      return;
    }
    setLastTestedChar(cid);
    setFeedback(null);
    audioService.updateConfig(voices, { ...audioSettings, voiceEnabled: true });
    audioService.speak({
      characterId: cid,
      voiceId: prof.voiceId,
      text,
      actingInstruction: prof.defaultActingInstruction,
      customAudioUrl: prof.customAudioUrl,
    });
  };

  const handleRepeatLast = () => {
    playCharacterSample(lastTestedChar || selectedChar);
  };

  const handleGenerateGeminiSingle = async () => {
    stopComparison();
    soundEngine.unlockAudio();
    setLoadingGeminiSingle(true);
    setFeedback(null);
    try {
      const res = await audioService.synthesizeWithGemini({
        characterId: selectedChar,
        text: activeSampleText,
        actingInstruction: activeProfile.defaultActingInstruction,
        profileOverride: activeProfile,
        useLiteModel: selectedChar === 'narrador',
      });
      const nextVoices: Record<CharacterId, VoiceProfile> = {
        ...voices,
        [selectedChar]: {
          ...activeProfile,
          generatedAudioDataUrl: res.dataUrl,
          generatedAudioText: activeSampleText.trim(),
        },
      };
      onChangeVoices(nextVoices);
      audioService.updateConfig(nextVoices, audioSettings);
      audioService.playDirectAudio(res.dataUrl, undefined, selectedChar);
      setFeedback({
        type: 'ok',
        text: res.cached
          ? `Audio de ${activeProfile.displayName} (${activeProfile.voiceId}) recuperado de caché y reproducido.`
          : `Voz Gemini generada para ${activeProfile.displayName} (${activeProfile.voiceId}). Pulsa "Guardar configuración" para conservarla.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : 'No se pudo generar con Gemini TTS; sigue disponible la reproducción local.',
      });
    } finally {
      setLoadingGeminiSingle(false);
    }
  };

  const handleTestAllVoices = () => {
    if (comparingAll) {
      stopComparison();
      return;
    }
    stopComparison();
    soundEngine.unlockAudio();
    setFeedback(null);
    setComparingAll(true);
    setActiveCompareIdx(0);
    audioService.updateConfig(voices, { ...audioSettings, voiceEnabled: true });

    const seqItems = ALL_VOICES_COMPARISON_LINES.map((line) => {
      const prof = voices[line.characterId];
      return {
        characterId: line.characterId,
        voiceId: prof?.voiceId ?? line.voiceId,
        speakerName: prof?.displayName ?? line.speakerName,
        text: line.text,
        actingInstruction: line.actingInstruction,
        customAudioUrl: prof?.customAudioUrl,
      };
    });

    compareStopRef.current = audioService.playSequence(seqItems, {
      pauseBetweenTurnsMs: 420,
      useGemini: false,
      onTurnStart: (item, idx) => {
        setActiveCompareIdx(idx);
        setSelectedChar(item.characterId);
      },
      onComplete: () => {
        setComparingAll(false);
        setActiveCompareIdx(-1);
        setFeedback({
          type: 'ok',
          text: 'Prueba comparativa de las 9 voces finalizada.',
        });
      },
    });
  };

  const handleTestAllVoicesGemini = async () => {
    if (comparingAll) {
      stopComparison();
      return;
    }
    stopComparison();
    soundEngine.unlockAudio();
    setLoadingGeminiCompare(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/voice-design/compare-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: ALL_VOICES_COMPARISON_LINES,
          profiles: voices,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status} al comparar voces con Gemini.`);
      }

      const segments = (data.segments ?? []) as Array<{
        characterId: CharacterId;
        startMs: number;
        endMs: number;
      }>;
      const audioEl = new Audio(data.dataUrl);
      audioEl.volume = Math.min(1, audioSettings.masterVolume);
      compareAudioRef.current = audioEl;
      setComparingAll(true);
      setActiveCompareIdx(0);

      audioEl.ontimeupdate = () => {
        const ms = audioEl.currentTime * 1000;
        const foundIdx = segments.findIndex((seg) => ms >= seg.startMs && ms < seg.endMs);
        if (foundIdx >= 0) {
          setActiveCompareIdx(foundIdx);
          setSelectedChar(segments[foundIdx].characterId);
        }
      };
      audioEl.onended = () => {
        compareAudioRef.current = null;
        setComparingAll(false);
        setActiveCompareIdx(-1);
        setFeedback({
          type: 'ok',
          text: 'Comparación completa con Gemini 3.8 TTS finalizada.',
        });
      };
      await audioEl.play();
    } catch (err) {
      setComparingAll(false);
      setActiveCompareIdx(-1);
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'No se pudo comparar con Gemini TTS.',
      });
    } finally {
      setLoadingGeminiCompare(false);
    }
  };

  const handleRestoreCharacter = () => {
    const def = DEFAULT_STORY_CONFIG.characterVoices[selectedChar];
    updateProfile(selectedChar, {
      ...structuredClone(def),
      generatedAudioDataUrl: '',
    });
    setSampleTexts((prev) => ({
      ...prev,
      [selectedChar]: VOICE_STUDY_SAMPLE_TEXTS[selectedChar],
    }));
    setFeedback({
      type: 'ok',
      text: `Perfil ${def.voiceId} restaurado a su diseño vocal latinoamericano original.`,
    });
  };

  return (
    <section
      aria-label="Estudio de Voces"
      data-testid="estudio-de-voces"
      className="space-y-4"
    >
      {/* Top Studio Header & Global Compare Controls */}
      <div className="p-3.5 rounded-xl border border-[#8c6838]/35 bg-white/50 dark:bg-black/25 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold text-[#2b1c0e] dark:text-amber-100">
              ESTUDIO DE VOCES · Identidades Vocales Persistentes
            </h3>
            <p className="text-xs text-[#6f4f28] dark:text-amber-200/80">
              Cada personaje mantiene un identificador fijo (VOICE_*) en español latinoamericano natural. Ajusta velocidad, volumen, expresividad o dirección puntual y pruébalos en escena.
            </p>
          </div>
          {apiConfigured !== null && (
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded border whitespace-nowrap ${
                apiConfigured
                  ? 'bg-emerald-700/15 border-emerald-600/35 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-700/15 border-amber-600/35 text-amber-900 dark:text-amber-200'
              }`}
            >
              {apiConfigured ? 'Gemini 3.8 TTS listo' : 'Modo vocal local activo'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="btn-probar-todas-las-voces"
            onClick={handleTestAllVoices}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow cursor-pointer transition-colors ${
              comparingAll
                ? 'bg-rose-700 hover:bg-rose-800 text-white'
                : 'bg-[#b77c1f] hover:bg-[#c98b27] text-white'
            }`}
          >
            {comparingAll ? (
              <>
                <Square className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Detener prueba</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" aria-hidden="true" />
                <span>PROBAR TODAS LAS VOCES</span>
              </>
            )}
          </button>

          {apiConfigured && (
            <button
              type="button"
              disabled={loadingGeminiCompare}
              onClick={handleTestAllVoicesGemini}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#2e5d3a] hover:bg-[#387147] text-white disabled:opacity-60 cursor-pointer"
            >
              {loadingGeminiCompare ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>Comparar 9 con Gemini</span>
            </button>
          )}

          <label className="inline-flex items-center gap-1.5 ml-auto text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(audioSettings.geminiBoardEnabled)}
              onChange={(e) =>
                onChangeAudioSettings({
                  ...audioSettings,
                  geminiBoardEnabled: e.target.checked,
                })
              }
              className="accent-[#2e5d3a] cursor-pointer"
            />
            <span>Usar Gemini TTS en el tablero (con caché)</span>
          </label>
        </div>

        {/* Live comparative subtitle banner while PROBAR TODAS LAS VOCES runs */}
        {comparingAll && activeComparisonLine && (
          <div
            data-testid="compare-all-subtitle"
            className="p-3 rounded-lg border border-[#b77c1f]/50 bg-[#fff8e6] dark:bg-[#2a2013] space-y-1.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#6f4419] dark:text-amber-300 whitespace-nowrap">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>
                  {activeCompareIdx + 1}/{ALL_VOICES_COMPARISON_LINES.length} ·{' '}
                  {voices[activeComparisonLine.characterId]?.displayName ||
                    activeComparisonLine.speakerName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#8c6838]/15 font-mono text-[10px]">
                  {activeComparisonLine.voiceId}
                </span>
              </div>
              <span className="text-[11px] opacity-75 italic">
                {activeComparisonLine.actingInstruction}
              </span>
            </div>
            <p className="font-story text-xs sm:text-sm text-[#2e1e0f] dark:text-amber-50">
              “{activeComparisonLine.text}”
            </p>
          </div>
        )}
      </div>

      {/* 9-Voice Selector Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {STUDIO_CHARACTER_ORDER.map((cid) => {
          const prof = voices[cid];
          if (!prof) return null;
          const isSelected = cid === selectedChar;
          const isSpeakingNow =
            comparingAll && activeComparisonLine?.characterId === cid;
          const hasGeminiClip = Boolean(prof.generatedAudioDataUrl);
          return (
            <button
              key={cid}
              type="button"
              data-testid={`voice-card-${prof.voiceId}`}
              onClick={() => setSelectedChar(cid)}
              className={`text-left px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${
                isSpeakingNow
                  ? 'bg-[#2e5d3a] text-white border-emerald-300 ring-2 ring-emerald-400/60'
                  : isSelected
                    ? 'bg-[#b77c1f] text-white border-[#ffe49e]'
                    : 'bg-white/60 dark:bg-black/25 border-[#8c6838]/30 hover:bg-white/85 dark:hover:bg-black/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold truncate">{prof.displayName}</span>
                {hasGeminiClip && (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 opacity-90" aria-hidden="true" />
                )}
              </div>
              <div className="text-[10px] font-mono opacity-80 truncate">{prof.voiceId}</div>
            </button>
          );
        })}
      </div>

      {/* Detailed Controls for Selected Voice */}
      <div className="p-4 rounded-xl border border-[#8c6838]/35 bg-white/55 dark:bg-black/25 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display text-sm sm:text-base font-bold text-[#2b1c0e] dark:text-amber-100">
                {activeProfile.displayName}
              </h4>
              <span
                data-testid="active-voice-id"
                className="px-2 py-0.5 rounded bg-[#2b1c0e]/10 dark:bg-amber-300/15 font-mono text-[11px] font-bold"
              >
                {activeProfile.voiceId}
              </span>
            </div>
            <p className="text-[11px] text-[#6f4f28] dark:text-amber-200/75 mt-0.5">
              {activeProfile.gender === 'femenino' ? 'Voz femenina' : 'Voz masculina'} · Registro{' '}
              {activeProfile.register ?? 'medio'} · Timbre Gemini: {activeProfile.geminiVoiceName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRestoreCharacter}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Restaurar voz</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold">Nombre del personaje</span>
            <input
              type="text"
              value={activeProfile.displayName}
              onChange={(e) =>
                updateProfile(selectedChar, { displayName: e.target.value })
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#8c6838]/40 bg-white/85 dark:bg-black/35 text-xs"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold">Identificador fijo</span>
            <input
              type="text"
              readOnly
              value={activeProfile.voiceId}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#8c6838]/30 bg-black/5 dark:bg-white/5 font-mono text-xs opacity-85"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-semibold">Descripción vocal (identidad base permanente)</span>
          <textarea
            rows={3}
            value={activeProfile.voicePrompt}
            onChange={(e) =>
              updateProfile(selectedChar, { voicePrompt: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/85 dark:bg-black/35 text-xs leading-relaxed"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-semibold">
            Instrucciones de actuación (emoción y ritmo contextuales)
          </span>
          <input
            type="text"
            value={activeProfile.defaultActingInstruction}
            onChange={(e) =>
              updateProfile(selectedChar, {
                defaultActingInstruction: e.target.value,
              })
            }
            placeholder="Ej. Ritmo pausado, ironía contenida y fondo sincero..."
            className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/85 dark:bg-black/35 text-xs"
          />
        </label>

        {/* Vocal Modulation Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          <label className="block space-y-1">
            <span className="text-xs font-semibold">
              Velocidad ({activeProfile.rate.toFixed(2)}x)
            </span>
            <input
              type="range"
              aria-label="Velocidad de voz"
              min={0.7}
              max={1.45}
              step={0.02}
              value={activeProfile.rate}
              onChange={(e) =>
                updateProfile(selectedChar, { rate: Number(e.target.value) })
              }
              className="w-full accent-[#2e5d3a] cursor-pointer"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold">
              Volumen ({Math.round((activeProfile.volume ?? 1) * 100)}%)
            </span>
            <input
              type="range"
              aria-label="Volumen de voz"
              min={0.2}
              max={1.0}
              step={0.02}
              value={activeProfile.volume ?? 1}
              onChange={(e) =>
                updateProfile(selectedChar, { volume: Number(e.target.value) })
              }
              className="w-full accent-[#2e5d3a] cursor-pointer"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold">
              Expresividad ({Math.round((activeProfile.expressivity ?? 0.8) * 100)}%)
            </span>
            <input
              type="range"
              aria-label="Expresividad de voz"
              min={0.2}
              max={1.0}
              step={0.02}
              value={activeProfile.expressivity ?? 0.8}
              onChange={(e) =>
                updateProfile(selectedChar, { expressivity: Number(e.target.value) })
              }
              className="w-full accent-[#2e5d3a] cursor-pointer"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold">
              Registro / Tono ({activeProfile.pitch.toFixed(2)})
            </span>
            <input
              type="range"
              aria-label="Tono de voz"
              min={0.5}
              max={1.95}
              step={0.02}
              value={activeProfile.pitch}
              onChange={(e) =>
                updateProfile(selectedChar, { pitch: Number(e.target.value) })
              }
              className="w-full accent-[#2e5d3a] cursor-pointer"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold">Timbre base Gemini</span>
            <select
              value={activeProfile.geminiVoiceName}
              onChange={(e) =>
                updateProfile(selectedChar, {
                  geminiVoiceName: e.target.value as GeminiVoiceName,
                })
              }
              className="w-full px-2 py-1.5 rounded-lg border border-[#8c6838]/40 bg-white/85 dark:bg-black/35 text-xs"
            >
              {GEMINI_VOICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold">Registro vocal</span>
            <select
              value={activeProfile.register ?? 'medio'}
              onChange={(e) =>
                updateProfile(selectedChar, {
                  register: e.target.value as VoiceRegister,
                })
              }
              className="w-full px-2 py-1.5 rounded-lg border border-[#8c6838]/40 bg-white/85 dark:bg-black/35 text-xs"
            >
              <option value="grave">Grave</option>
              <option value="medio">Medio</option>
              <option value="medio-alto">Medio-alto</option>
              <option value="agudo">Agudo</option>
            </select>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-semibold">Texto de prueba</span>
          <textarea
            rows={2}
            value={activeSampleText}
            onChange={(e) =>
              setSampleTexts((prev) => ({
                ...prev,
                [selectedChar]: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/85 dark:bg-black/35 text-xs sm:text-sm"
          />
        </label>

        {/* Playback & Save Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => playCharacterSample(selectedChar)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#2e5d3a] hover:bg-[#387147] shadow cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reproducir</span>
          </button>

          <button
            type="button"
            onClick={handleRepeatLast}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Repetir</span>
          </button>

          {apiConfigured && (
            <button
              type="button"
              disabled={loadingGeminiSingle}
              onClick={handleGenerateGeminiSingle}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#b77c1f]/90 hover:bg-[#b77c1f] text-white disabled:opacity-60 cursor-pointer"
            >
              {loadingGeminiSingle ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>Generar con Gemini 3.8</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onSaveConfiguration(voices, audioSettings);
              setFeedback({
                type: 'ok',
                text: `Configuración vocal guardada (${activeProfile.voiceId} y parámetros de estudio).`,
              });
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#5a3b1c] hover:bg-[#704a24] text-white ml-auto cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Guardar configuración</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`px-3 py-2 rounded-lg text-xs font-medium ${
            feedback.type === 'ok'
              ? 'bg-emerald-700/15 text-emerald-900 dark:text-emerald-200 border border-emerald-600/30'
              : 'bg-rose-700/15 text-rose-900 dark:text-rose-200 border border-rose-600/30'
          }`}
        >
          {feedback.text}
        </div>
      )}
    </section>
  );
};
