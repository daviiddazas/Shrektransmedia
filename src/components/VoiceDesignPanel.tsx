import React, { useEffect, useState } from 'react';
import {
  Clapperboard,
  Loader2,
  Mic,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from 'lucide-react';
import { audioService } from '../audio/audioService';
import { soundEngine } from '../audio/soundEngine';
import {
  DEFAULT_SCENE_SCRIPT,
  DEFAULT_SCENE_STYLE_INSTRUCTIONS,
  FULL_CAST_SCENE_SCRIPT,
} from '../data/defaultStoryData';
import {
  AudioSettings,
  CharacterId,
  StoryConfig,
  VoiceProfile,
} from '../types/story';
import { VoiceStudioSection } from './VoiceStudioSection';

interface VoiceDesignPanelProps {
  open: boolean;
  config: StoryConfig;
  onSaveConfig: (next: StoryConfig) => void;
  onClose: () => void;
}

export const VoiceDesignPanel: React.FC<VoiceDesignPanelProps> = ({
  open,
  config,
  onSaveConfig,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'scene'>('studio');
  const [voicesDraft, setVoicesDraft] = useState<Record<CharacterId, VoiceProfile>>(
    () => structuredClone(config.characterVoices),
  );
  const [audioDraft, setAudioDraft] = useState<AudioSettings>(() =>
    structuredClone(config.audioSettings),
  );

  const [styleInstructions, setStyleInstructions] = useState<string>(
    DEFAULT_SCENE_STYLE_INSTRUCTIONS,
  );
  const [sceneScript, setSceneScript] = useState<string>(DEFAULT_SCENE_SCRIPT);
  const [sceneMode, setSceneMode] = useState<'single_actor' | 'multi_cast'>('multi_cast');
  const [sceneAudioUrl, setSceneAudioUrl] = useState<string>('');

  const [apiStatus, setApiStatus] = useState<{
    checked: boolean;
    configured: boolean;
    model: string;
  }>({ checked: false, configured: false, model: 'gemini-3.8-flash-tts' });

  const [loadingScene, setLoadingScene] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setVoicesDraft(structuredClone(config.characterVoices));
    setAudioDraft(structuredClone(config.audioSettings));
    setFeedback(null);
    fetch('/api/voice-design/status')
      .then((r) => r.json())
      .then((data) => {
        setApiStatus({
          checked: true,
          configured: Boolean(data?.configured),
          model: String(data?.model || 'gemini-3.8-flash-tts'),
        });
      })
      .catch(() => {
        setApiStatus({ checked: true, configured: false, model: 'gemini-3.8-flash-tts' });
      });
  }, [open, config.characterVoices, config.audioSettings]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleGenerateScene = async () => {
    soundEngine.unlockAudio();
    setLoadingScene(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/voice-design/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: sceneMode,
          styleInstructions,
          script: sceneScript,
          profiles: voicesDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status} al interpretar la escena.`);
      }
      setSceneAudioUrl(data.dataUrl);
      audioService.playDirectAudio(data.dataUrl);
      setFeedback({
        type: 'ok',
        text:
          data.mode === 'dual_speaker_native'
            ? `Escena dual interpretada nativamente con Gemini (${data.lineCount} intervenciones).`
            : sceneMode === 'multi_cast'
              ? `Escena interpretada por ${data.lineCount} líneas con voces independientes.`
              : 'Escena interpretada por el actor de doblaje Gemini TTS.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'No se pudo interpretar el guion.',
      });
    } finally {
      setLoadingScene(false);
    }
  };

  const handleSaveAllProfiles = () => {
    onSaveConfig({
      ...config,
      characterVoices: voicesDraft,
      audioSettings: audioDraft,
    });
    setFeedback({
      type: 'ok',
      text: 'Perfiles de voz y preferencias guardados en el cuento.',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Herramienta de Diseño de Voz y Doblaje Gemini"
      data-testid="voice-design-panel"
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
      />

      <aside className="parchment-panel relative z-10 w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#8c6838]/30">
          <div>
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-[#2e5d3a] dark:text-emerald-400" aria-hidden="true" />
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#2b1c0e] dark:text-amber-100">
                Diseño de Voz · Estudio y Escenas
              </h2>
            </div>
            <p className="text-xs text-[#6f4f28] dark:text-amber-200/80 mt-0.5">
              Personaliza las 9 identidades vocales (VOICE_*) en español latinoamericano natural y prueba diálogos multicapa con Gemini 3.8 TTS.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diseño de voz"
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Mode Tabs & API Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 border-b border-[#8c6838]/20">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'studio'
                  ? 'bg-[#2e5d3a] text-white'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Estudio de Voces</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scene')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'scene'
                  ? 'bg-[#2e5d3a] text-white'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Escena de Doblaje (Guion)</span>
            </button>
          </div>

          {apiStatus.checked && (
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${
                apiStatus.configured
                  ? 'bg-emerald-700/15 border-emerald-600/35 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-700/15 border-amber-600/35 text-amber-900 dark:text-amber-200'
              }`}
            >
              {apiStatus.configured
                ? `Gemini TTS conectado (${apiStatus.model})`
                : 'Gemini TTS sin GEMINI_API_KEY (usa voz local)'}
            </span>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
          {activeTab === 'studio' ? (
            <VoiceStudioSection
              voices={voicesDraft}
              audioSettings={audioDraft}
              onChangeVoices={setVoicesDraft}
              onChangeAudioSettings={setAudioDraft}
              onSaveConfiguration={(nextVoices, nextAudio) => {
                onSaveConfig({
                  ...config,
                  characterVoices: nextVoices,
                  audioSettings: nextAudio,
                });
              }}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#6f4f28] dark:text-amber-200/80">
                  Usa la estructura de actuación para que Gemini interprete la escena respetando pausas y acotaciones sin leerlas en voz alta. En escenas de 2 interlocutores usa modo dual nativo.
                </p>
                <div className="inline-flex rounded-lg border border-[#8c6838]/35 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setSceneMode('multi_cast')}
                    className={`px-3 py-1 font-semibold cursor-pointer ${
                      sceneMode === 'multi_cast'
                        ? 'bg-[#2e5d3a] text-white'
                        : 'bg-white/40 dark:bg-black/20'
                    }`}
                  >
                    Elenco por perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => setSceneMode('single_actor')}
                    className={`px-3 py-1 font-semibold cursor-pointer ${
                      sceneMode === 'single_actor'
                        ? 'bg-[#2e5d3a] text-white'
                        : 'bg-white/40 dark:bg-black/20'
                    }`}
                  >
                    Actor único
                  </button>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold">Instrucciones de estilo</span>
                <textarea
                  rows={5}
                  value={styleInstructions}
                  onChange={(e) => setStyleInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/85 dark:bg-black/35 text-xs leading-relaxed"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold">[Guion]</span>
                <textarea
                  rows={5}
                  value={sceneScript}
                  onChange={(e) => setSceneScript(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/85 dark:bg-black/35 text-xs sm:text-sm leading-relaxed"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={loadingScene}
                  onClick={handleGenerateScene}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#b77c1f] hover:bg-[#c88a27] disabled:opacity-60 shadow cursor-pointer"
                >
                  {loadingScene ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Play className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>
                    {loadingScene
                      ? 'Interpretando escena...'
                      : 'Interpretar escena con Gemini'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStyleInstructions(DEFAULT_SCENE_STYLE_INSTRUCTIONS);
                    setSceneScript(DEFAULT_SCENE_SCRIPT);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Escena pantano</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStyleInstructions(DEFAULT_SCENE_STYLE_INSTRUCTIONS);
                    setSceneScript(FULL_CAST_SCENE_SCRIPT);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Elenco completo (9)</span>
                </button>
              </div>

              {sceneAudioUrl && (
                <div className="p-3 rounded-lg border border-[#8c6838]/30 bg-white/50 dark:bg-black/25 space-y-1.5">
                  <span className="text-xs font-semibold block">
                    Audio generado de la escena:
                  </span>
                  <audio controls src={sceneAudioUrl} className="w-full h-9" />
                </div>
              )}
            </div>
          )}

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
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#8c6838]/30 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSaveAllProfiles}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#2e5d3a] hover:bg-[#387147] shadow cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Guardar perfiles</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
