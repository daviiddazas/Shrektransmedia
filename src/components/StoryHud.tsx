import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Feather,
  Gauge,
  Maximize2,
  Mic,
  Minimize2,
  Moon,
  Music,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { SpeechStatus } from '../audio/voiceEngine';
import {
  ActiveDialogue,
  AudioSettings,
  StoryStation,
  ThemeAtmosphere,
  VoiceProfile,
} from '../types/story';

interface StoryHudProps {
  stations: StoryStation[];
  visitedIds: number[];
  currentStation: StoryStation | null;
  activeDialogue: ActiveDialogue | null;
  activeVoiceProfile?: VoiceProfile;
  speechStatus: SpeechStatus;
  atmosphere: ThemeAtmosphere;
  audioSettings: AudioSettings;
  lowPerformance: boolean;
  isFullscreen: boolean;
  hasDockedPanel?: boolean;
  onWalkToStation: (stationId: number) => void;
  onOpenCurrentStation: () => void;
  onOverviewCamera: () => void;
  onToggleAtmosphere: () => void;
  onToggleLowPerf: () => void;
  onToggleFullscreen: () => void;
  onOpenVoiceDesign: () => void;
  onOpenTeacherMode: () => void;
  onUpdateAudio: (patch: Partial<AudioSettings>) => void;
  onPauseOrResumeVoice: () => void;
  onRepeatVoice: () => void;
  onDismissDialogue: () => void;
  onNudgeMove: (dx: number, dz: number) => void;
}

export const StoryHud: React.FC<StoryHudProps> = ({
  stations,
  visitedIds,
  currentStation,
  activeDialogue,
  activeVoiceProfile,
  speechStatus,
  atmosphere,
  audioSettings,
  lowPerformance,
  isFullscreen,
  hasDockedPanel = false,
  onWalkToStation,
  onOpenCurrentStation,
  onOverviewCamera,
  onToggleAtmosphere,
  onToggleLowPerf,
  onToggleFullscreen,
  onOpenVoiceDesign,
  onOpenTeacherMode,
  onUpdateAudio,
  onPauseOrResumeVoice,
  onRepeatVoice,
  onDismissDialogue,
  onNudgeMove,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [portraitFailed, setPortraitFailed] = useState(false);
  const isDark = atmosphere === 'oscuro';

  useEffect(() => {
    setPortraitFailed(false);
  }, [activeDialogue?.portraitUrl]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
      {/* TOP BAR: Compact Realm Context + Quick Open Station + Discrete Mode Actions */}
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="parchment-panel pointer-events-auto rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 max-w-full sm:max-w-md">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#6f4f28] dark:text-amber-300/80">
            <span className="tabular-nums font-semibold whitespace-nowrap">
              {visitedIds.length}/{stations.length}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[160px] sm:max-w-none">
              {currentStation ? currentStation.realmName : 'Muy Muy Lejano'}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mt-1">
            <h2 className="font-display text-xs sm:text-base font-bold text-[#2b1c0e] dark:text-amber-100 truncate">
              {currentStation ? currentStation.canvasTitle : 'Explora el tablero'}
            </h2>
            {currentStation && (
              <button
                type="button"
                onClick={onOpenCurrentStation}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold text-[#fff8e8] bg-[#2e5d3a] hover:bg-[#387147] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Abrir</span>
                <span className="hidden sm:inline">ficha</span>
              </button>
            )}
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={onOverviewCamera}
            title="Vista general del tablero"
            aria-label="Vista general del tablero"
            className="parchment-panel inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold text-[#2d1d0e] dark:text-amber-100 hover:brightness-95 transition cursor-pointer whitespace-nowrap"
          >
            <Compass className="w-4 h-4 text-[#2e5d3a] dark:text-emerald-400" aria-hidden="true" />
            <span className="hidden md:inline">Vista General</span>
          </button>

          <button
            type="button"
            onClick={onToggleAtmosphere}
            title={isDark ? 'Cambiar a ambiente claro' : 'Cambiar a ambiente oscuro'}
            aria-label={isDark ? 'Cambiar a ambiente claro' : 'Cambiar a ambiente oscuro'}
            className="parchment-panel inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold text-[#2d1d0e] dark:text-amber-100 hover:brightness-95 transition cursor-pointer whitespace-nowrap"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-800" aria-hidden="true" />
            )}
            <span className="hidden md:inline">{isDark ? 'Día' : 'Noche'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenVoiceDesign}
            title="Herramienta de Diseño de Voz (Voice Design)"
            aria-label="Diseño de voz"
            className="parchment-panel inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold text-[#2d1d0e] dark:text-amber-100 hover:brightness-95 transition cursor-pointer whitespace-nowrap"
          >
            <Mic className="w-3.5 h-3.5 text-[#2e5d3a] dark:text-emerald-400" aria-hidden="true" />
            <span className="hidden lg:inline">Diseño de Voz</span>
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="parchment-panel inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold text-[#2d1d0e] dark:text-amber-100 hover:brightness-95 transition cursor-pointer whitespace-nowrap"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenTeacherMode}
            aria-label="Modo docente"
            className="parchment-panel inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold text-[#2d1d0e] dark:text-amber-100 hover:brightness-95 transition cursor-pointer whitespace-nowrap"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
            <span className="hidden sm:inline">Modo Docente</span>
          </button>
        </div>
      </div>

      {/* BOTTOM CLUSTER: Mobile Touch D-Pad + Narrator/Character Dialogue + Collapsible Dock */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* Mobile Touch Controls */}
        <div className="sm:hidden self-start pointer-events-auto parchment-panel rounded-xl p-1.5 grid grid-cols-3 gap-1 w-28">
          <div />
          <button
            type="button"
            aria-label="Mover hacia arriba"
            onClick={() => onNudgeMove(0, -1)}
            className="p-2 rounded bg-black/5 dark:bg-white/10 flex items-center justify-center"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />
          <button
            type="button"
            aria-label="Mover a la izquierda"
            onClick={() => onNudgeMove(-1, 0)}
            className="p-2 rounded bg-black/5 dark:bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Mover hacia abajo"
            onClick={() => onNudgeMove(0, 1)}
            className="p-2 rounded bg-black/5 dark:bg-white/10 flex items-center justify-center"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Mover a la derecha"
            onClick={() => onNudgeMove(1, 0)}
            className="p-2 rounded bg-black/5 dark:bg-white/10 flex items-center justify-center"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Active Narrator / Character Dialogue Box */}
        {activeDialogue && (
          <section
            aria-label="Narración y diálogos"
            data-testid="dialogue-panel"
            className={`${
              hasDockedPanel ? 'hidden sm:block ' : ''
            }parchment-panel pointer-events-auto w-full max-w-2xl rounded-xl px-4 py-3`}
          >
            <div className="flex items-start gap-3">
              {/* Portrait or Narrator Emblem */}
              <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden border border-[#8e6a3a]/50 bg-[#e6d5b3] dark:bg-[#2c2218] flex items-center justify-center">
                {activeDialogue.portraitUrl && !portraitFailed ? (
                  <img
                    src={activeDialogue.portraitUrl}
                    alt={activeDialogue.speakerName}
                    referrerPolicy="no-referrer"
                    onError={() => setPortraitFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Feather className="w-5 h-5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="font-display text-xs sm:text-sm font-bold text-[#6f4419] dark:text-amber-300 truncate">
                      {activeDialogue.speakerName}:
                    </span>
                    {(activeDialogue.voiceId || activeVoiceProfile?.voiceId) && (
                      <span className="px-1.5 py-0.5 rounded bg-[#8c6838]/15 dark:bg-amber-300/15 text-[10px] font-mono font-semibold text-[#6f4419] dark:text-amber-200 whitespace-nowrap">
                        {activeDialogue.voiceId || activeVoiceProfile?.voiceId}
                      </span>
                    )}
                    {activeVoiceProfile?.register && (
                      <span className="text-[11px] font-medium text-[#7b5830]/85 dark:text-amber-200/75 whitespace-nowrap hidden sm:inline">
                        · {activeVoiceProfile.gender === 'femenino' ? 'Femenina' : 'Masculina'} ({activeVoiceProfile.register})
                      </span>
                    )}
                    {speechStatus === 'loading' && (
                      <span className="text-[11px] font-medium text-[#7b5830] dark:text-amber-200/75 whitespace-nowrap">
                        · Preparando voz...
                      </span>
                    )}
                    {speechStatus === 'speaking' && (
                      <span className="text-[11px] font-medium text-[#2e5d3a] dark:text-emerald-300 whitespace-nowrap">
                        · Hablando
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={onPauseOrResumeVoice}
                      aria-label={speechStatus === 'speaking' ? 'Pausar narración' : 'Reproducir o reanudar narración'}
                      title={speechStatus === 'speaking' ? 'Pausar' : 'Reproducir / Reanudar'}
                      className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    >
                      {speechStatus === 'speaking' ? (
                        <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onRepeatVoice}
                      aria-label="Repetir intervención"
                      title="Repetir"
                      className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateAudio({ voiceEnabled: !audioSettings.voiceEnabled })
                      }
                      aria-label={audioSettings.voiceEnabled ? 'Silenciar voz' : 'Activar voz'}
                      title={audioSettings.voiceEnabled ? 'Silenciar voz' : 'Activar voz'}
                      className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    >
                      {audioSettings.voiceEnabled ? (
                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onDismissDialogue}
                      aria-label="Ocultar diálogo"
                      className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <p className="font-story text-sm sm:text-[15px] leading-snug text-[#2e1e0f] dark:text-amber-50/95 mt-0.5">
                  {activeDialogue.text}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Unified Collapsible Bottom Control Dock */}
        <div className="pointer-events-auto flex flex-col items-center w-full max-w-4xl">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="parchment-panel px-3.5 py-1 rounded-t-lg border-b-0 text-[11px] font-semibold flex items-center gap-1.5 text-[#5a3d1e] dark:text-amber-200 cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Mostrar controles</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ocultar controles</span>
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="parchment-panel w-full rounded-xl px-3 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
              {/* Station Quick-Jump Route */}
              <div
                className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5"
                role="navigation"
                aria-label="Estaciones del Story Canvas"
              >
                {stations.map((st) => {
                  const isVisited = visitedIds.includes(st.id);
                  const isCurrent = currentStation?.id === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onWalkToStation(st.id)}
                      title={st.canvasTitle}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isCurrent
                          ? 'bg-[#b77c1f] text-white border-[#ffe49e]'
                          : isVisited
                            ? 'bg-[#2b5b3a] text-[#f5ead0] border-[#6ca36c]/60'
                            : 'bg-black/5 dark:bg-white/10 text-[#332211] dark:text-amber-100 border-transparent hover:border-[#8c6838]/50'
                      }`}
                    >
                      {st.canvasOrder}
                    </button>
                  );
                })}
              </div>

              {/* Compact Audio & Performance Toggles */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => onUpdateAudio({ musicEnabled: !audioSettings.musicEnabled })}
                  aria-pressed={audioSettings.musicEnabled}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    audioSettings.musicEnabled
                      ? 'bg-[#2e5d3a]/15 border-[#2e5d3a]/40 text-[#21472b] dark:text-emerald-300'
                      : 'bg-black/5 dark:bg-white/5 border-transparent text-[#6f5d49] dark:text-amber-200/50'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Música</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateAudio({ sfxEnabled: !audioSettings.sfxEnabled })}
                  aria-pressed={audioSettings.sfxEnabled}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    audioSettings.sfxEnabled
                      ? 'bg-[#2e5d3a]/15 border-[#2e5d3a]/40 text-[#21472b] dark:text-emerald-300'
                      : 'bg-black/5 dark:bg-white/5 border-transparent text-[#6f5d49] dark:text-amber-200/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Efectos</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateAudio({ autoNarrate: !audioSettings.autoNarrate })}
                  aria-pressed={audioSettings.autoNarrate}
                  title="Narración automática al llegar a cada estación"
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    audioSettings.autoNarrate
                      ? 'bg-amber-600/15 border-amber-700/40 text-amber-900 dark:text-amber-200'
                      : 'bg-black/5 dark:bg-white/5 border-transparent text-[#6f5d49] dark:text-amber-200/50'
                  }`}
                >
                  <span>Auto-voz</span>
                </button>

                <label className="hidden md:flex items-center gap-1.5 text-xs text-[#5d4225] dark:text-amber-200/80">
                  <span className="sr-only">Volumen general</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={audioSettings.masterVolume}
                    onChange={(e) =>
                      onUpdateAudio({ masterVolume: Number(e.target.value) })
                    }
                    className="w-16 accent-[#2e5d3a] cursor-pointer"
                  />
                </label>

                <button
                  type="button"
                  onClick={onToggleLowPerf}
                  aria-pressed={lowPerformance}
                  title="Modo de bajo rendimiento"
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    lowPerformance
                      ? 'bg-amber-700 text-white border-amber-400'
                      : 'bg-black/5 dark:bg-white/5 border-transparent text-[#5d4225] dark:text-amber-200/80'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden lg:inline">Rendimiento</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
