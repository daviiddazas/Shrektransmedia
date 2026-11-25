import React, { useRef, useState } from 'react';
import {
  Download,
  Mic,
  RotateCcw,
  Save,
  Upload,
  X,
} from 'lucide-react';
import { TEACHER_IMAGE_GALLERY } from '../data/defaultStoryData';
import { CharacterId, StoryConfig, StoryStation } from '../types/story';
import { validateStoryConfigJson } from '../utils/storyLogic';
import { VoiceStudioSection } from './VoiceStudioSection';

interface TeacherModeDrawerProps {
  open: boolean;
  config: StoryConfig;
  onSaveConfig: (next: StoryConfig) => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

const CHARACTER_OPTIONS: Array<{ id: CharacterId; label: string }> = [
  { id: 'shrek', label: 'Shrek' },
  { id: 'burro', label: 'Burro' },
  { id: 'fiona', label: 'Fiona' },
  { id: 'gato', label: 'Gato con Botas' },
  { id: 'farquaad', label: 'Lord Farquaad' },
  { id: 'hada', label: 'Hada Madrina' },
  { id: 'principe', label: 'Príncipe Encantador' },
  { id: 'jengibre', label: 'Jengi' },
];

export const TeacherModeDrawer: React.FC<TeacherModeDrawerProps> = ({
  open,
  config,
  onSaveConfig,
  onResetDefaults,
  onClose,
}) => {
  const [draft, setDraft] = useState<StoryConfig>(() => structuredClone(config));
  const [tab, setTab] = useState<'stations' | 'voices' | 'global'>('stations');
  const [selectedStationId, setSelectedStationId] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync draft when drawer opens
  React.useEffect(() => {
    if (open) {
      setDraft(structuredClone(config));
      setFeedback(null);
    }
  }, [open, config]);

  if (!open) return null;

  const activeStation =
    draft.stations.find((s) => s.id === selectedStationId) ?? draft.stations[0];

  const updateStation = (patch: Partial<StoryStation>) => {
    setDraft((prev) => ({
      ...prev,
      stations: prev.stations.map((s) =>
        s.id === activeStation.id ? { ...s, ...patch } : s,
      ),
    }));
  };

  const updateIntervention = (
    patch: Partial<StoryStation['intervention']>,
  ) => {
    setDraft((prev) => ({
      ...prev,
      stations: prev.stations.map((s) =>
        s.id === activeStation.id
          ? { ...s, intervention: { ...s.intervention, ...patch } }
          : s,
      ),
    }));
  };

  const handleSave = () => {
    onSaveConfig(draft);
    setFeedback({ type: 'ok', text: 'Cambios guardados en el navegador.' });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shrek-story-canvas-config.json';
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({ type: 'ok', text: 'Configuración exportada en formato JSON.' });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = validateStoryConfigJson(text);
    if (!res.ok || !res.config) {
      setFeedback({ type: 'err', text: res.error ?? 'Error al importar JSON.' });
      return;
    }
    setDraft(res.config);
    onSaveConfig(res.config);
    setFeedback({ type: 'ok', text: 'Configuración JSON importada y aplicada.' });
    e.target.value = '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modo docente y editor de contenidos"
      data-testid="teacher-drawer"
      className="fixed inset-0 z-40 flex justify-end"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
      />

      <aside className="parchment-panel relative z-10 w-full max-w-xl h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#8c6838]/30">
          <div>
            <h2 className="font-display text-lg font-bold text-[#2b1c0e] dark:text-amber-100">
              Modo Docente · Editor del Cuento
            </h2>
            <p className="text-xs text-[#6f4f28] dark:text-amber-200/75">
              Personaliza las 10 estaciones del Story Canvas, diálogos, audios e imágenes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modo docente"
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-[#8c6838]/20">
          <button
            type="button"
            onClick={() => setTab('stations')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              tab === 'stations'
                ? 'bg-[#2e5d3a] text-white'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
            }`}
          >
            Estaciones (1–10)
          </button>
          <button
            type="button"
            data-testid="tab-estudio-de-voces"
            onClick={() => setTab('voices')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              tab === 'voices'
                ? 'bg-[#2e5d3a] text-white'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
            }`}
          >
            <Mic className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Estudio de Voces</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('global')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              tab === 'global'
                ? 'bg-[#2e5d3a] text-white'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
            }`}
          >
            Portada y Audio
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
          {tab === 'stations' ? (
            <>
              {/* Station selector strip */}
              <div className="flex flex-wrap gap-1.5">
                {draft.stations.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStationId(st.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums cursor-pointer border ${
                      st.id === activeStation.id
                        ? 'bg-[#b77c1f] text-white border-[#ffe49e]'
                        : 'bg-white/50 dark:bg-black/25 border-[#8c6838]/30'
                    }`}
                  >
                    {st.canvasOrder}. {st.modalTitle.replace(/^\d+\.\s*/, '')}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold">Apartado Story Canvas</span>
                  <input
                    type="text"
                    value={activeStation.canvasTitle}
                    onChange={(e) => updateStation({ canvasTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold">Nombre del escenario</span>
                  <input
                    type="text"
                    value={activeStation.realmName}
                    onChange={(e) => updateStation({ realmName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold">Título de la ventana emergente</span>
                <input
                  type="text"
                  value={activeStation.modalTitle}
                  onChange={(e) => updateStation({ modalTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold">Narración introductoria (voz del narrador)</span>
                <textarea
                  rows={2}
                  value={activeStation.narratorIntro}
                  onChange={(e) => updateStation({ narratorIntro: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold">Párrafo explicativo de la ficha</span>
                <textarea
                  rows={3}
                  value={activeStation.modalSummary}
                  onChange={(e) => updateStation({ modalSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                />
              </label>

              <div className="space-y-2">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold">URL de imagen representativa</span>
                  <input
                    type="url"
                    value={activeStation.imageUrl}
                    onChange={(e) => updateStation({ imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                  />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TEACHER_IMAGE_GALLERY.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => updateStation({ imageUrl: res.url })}
                      title={res.label}
                      className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${
                        activeStation.imageUrl === res.url
                          ? 'bg-[#2e5d3a] text-white border-emerald-400'
                          : 'bg-black/5 dark:bg-white/10 border-[#8c6838]/30'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold">
                  Enlace de video opcional (YouTube, Vimeo o MP4; dejar vacío si no aplica)
                </span>
                <input
                  type="url"
                  value={activeStation.videoUrl}
                  onChange={(e) => updateStation({ videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                />
              </label>

              <hr className="border-[#8c6838]/25" />

              <div className="space-y-3">
                <h3 className="font-display text-sm font-bold">
                  Intervención de personaje en esta estación
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold">Personaje</span>
                    <select
                      value={activeStation.intervention.characterId}
                      onChange={(e) => {
                        const cid = e.target.value as CharacterId;
                        const label =
                          CHARACTER_OPTIONS.find((c) => c.id === cid)?.label ?? cid;
                        updateIntervention({ characterId: cid, characterName: label });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                    >
                      {CHARACTER_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold">Audio propio del diálogo (URL opcional)</span>
                    <input
                      type="url"
                      value={activeStation.intervention.customAudioUrl}
                      onChange={(e) =>
                        updateIntervention({ customAudioUrl: e.target.value })
                      }
                      placeholder="https://.../voz.mp3"
                      className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold">Diálogo del personaje</span>
                  <textarea
                    rows={2}
                    value={activeStation.intervention.dialogue}
                    onChange={(e) => updateIntervention({ dialogue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold">
                    Dirección de actuación puntual (no se lee en voz alta)
                  </span>
                  <input
                    type="text"
                    value={activeStation.intervention.actingInstruction ?? ''}
                    onChange={(e) =>
                      updateIntervention({ actingInstruction: e.target.value })
                    }
                    placeholder="Ej. Humor seco con pausa ligera al final..."
                    className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-xs"
                  />
                </label>
              </div>
            </>
          ) : tab === 'voices' ? (
            <VoiceStudioSection
              voices={draft.characterVoices}
              audioSettings={draft.audioSettings}
              onChangeVoices={(nextVoices) =>
                setDraft((prev) => ({ ...prev, characterVoices: nextVoices }))
              }
              onChangeAudioSettings={(nextAudio) =>
                setDraft((prev) => ({ ...prev, audioSettings: nextAudio }))
              }
              onSaveConfiguration={(nextVoices, nextAudio) => {
                const updated: StoryConfig = {
                  ...draft,
                  characterVoices: nextVoices,
                  audioSettings: nextAudio,
                };
                setDraft(updated);
                onSaveConfig(updated);
              }}
            />
          ) : (
            <div className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-semibold">Título del libro</span>
                <input
                  type="text"
                  value={draft.bookTitle}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, bookTitle: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold">Subtítulo del libro</span>
                <input
                  type="text"
                  value={draft.bookSubtitle}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, bookSubtitle: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold">Narración inicial al abrir el libro</span>
                <textarea
                  rows={3}
                  value={draft.openingNarration}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, openingNarration: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold">Música ambiental propia (URL MP3/OGG)</span>
                  <input
                    type="url"
                    value={draft.audioSettings.customAmbientMusicUrl}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        audioSettings: {
                          ...p.audioSettings,
                          customAmbientMusicUrl: e.target.value,
                        },
                      }))
                    }
                    placeholder="Vacío = música medieval integrada"
                    className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold">Sonido al descubrir estación (URL)</span>
                  <input
                    type="url"
                    value={draft.audioSettings.customDiscoverySfxUrl}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        audioSettings: {
                          ...p.audioSettings,
                          customDiscoverySfxUrl: e.target.value,
                        },
                      }))
                    }
                    placeholder="Vacío = fanfarria mágica integrada"
                    className="w-full px-3 py-2 rounded-lg border border-[#8c6838]/40 bg-white/80 dark:bg-black/30 text-sm"
                  />
                </label>
              </div>
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

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#8c6838]/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Exportar JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Importar JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => {
                onResetDefaults();
                setFeedback({ type: 'ok', text: 'Valores predeterminados restaurados.' });
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Restaurar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#2e5d3a] hover:bg-[#387147] shadow cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Guardar cambios</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
