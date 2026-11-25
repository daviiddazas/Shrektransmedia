import { useCallback, useEffect, useRef, useState } from 'react';
import { audioService, SpeechStatus } from './audio/audioService';
import { soundEngine } from './audio/soundEngine';
import { StationModal } from './components/StationModal';
import { StoryBookIntro } from './components/StoryBookIntro';
import { StoryHud } from './components/StoryHud';
import { TeacherModeDrawer } from './components/TeacherModeDrawer';
import { VoiceDesignPanel } from './components/VoiceDesignPanel';
import { WorldCanvas, WorldCanvasHandle } from './components/WorldCanvas';
import { DEFAULT_STORY_CONFIG } from './data/defaultStoryData';
import { CHARACTER_VOICE_IDS } from './data/voiceProfiles';
import {
  ActiveDialogue,
  AppPhase,
  AudioSettings,
  CharacterId,
  DialogueTurn,
  StoryConfig,
  StoryStation,
  ThemeAtmosphere,
} from './types/story';
import {
  NARRATION_TIMING,
  STORAGE_KEY,
  getStationsToPrefetch,
  validateStoryConfigJson,
} from './utils/storyLogic';

function loadInitialConfig(): StoryConfig {
  if (typeof window === 'undefined') return DEFAULT_STORY_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORY_CONFIG;
    const res = validateStoryConfigJson(raw);
    return res.ok && res.config ? res.config : DEFAULT_STORY_CONFIG;
  } catch {
    return DEFAULT_STORY_CONFIG;
  }
}

function getStationDialogueTurns(station: StoryStation): DialogueTurn[] {
  if (Array.isArray(station.dialogueTurns)) {
    return station.dialogueTurns;
  }
  return [
    {
      characterId: station.intervention.characterId,
      characterName: station.intervention.characterName,
      dialogue: station.intervention.dialogue,
      actingInstruction: station.intervention.actingInstruction ?? '',
      portraitUrl: station.intervention.portraitUrl,
      customAudioUrl: station.intervention.customAudioUrl,
    },
  ];
}

export default function App() {
  const [config, setConfig] = useState<StoryConfig>(loadInitialConfig);
  const [phase, setPhase] = useState<AppPhase>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });
  const [atmosphere, setAtmosphere] = useState<ThemeAtmosphere>('claro');
  const [lowPerformance, setLowPerformance] = useState(false);
  const [visitedIds, setVisitedIds] = useState<number[]>([1]);
  const [currentStation, setCurrentStation] = useState<StoryStation | null>(
    () => loadInitialConfig().stations[0] ?? null,
  );
  const [modalStation, setModalStation] = useState<StoryStation | null>(null);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [voiceStudioOpen, setVoiceStudioOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>('idle');
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogue | null>(() => {
    const initial = loadInitialConfig();
    return {
      speakerId: 'narrador',
      voiceId: initial.characterVoices.narrador.voiceId ?? 'VOICE_NARRATOR',
      speakerName: initial.characterVoices.narrador.displayName,
      text: initial.openingNarration,
      actingInstruction: initial.characterVoices.narrador.defaultActingInstruction,
      isNarrator: true,
    };
  });

  const worldRef = useRef<WorldCanvasHandle | null>(null);
  const interventionTimerRef = useRef<number | null>(null);
  const conversationEndTimerRef = useRef<number | null>(null);
  const storySequenceRef = useRef(0);

  // Sync document.body.dataset.state for clean state awareness & testing
  useEffect(() => {
    document.body.dataset.state = phase;
  }, [phase]);

  // Sync Tailwind dark class for Ambiente Oscuro / Claro
  useEffect(() => {
    if (atmosphere === 'oscuro') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [atmosphere]);

  // Keep audio & voice engines synced with config and warm up initial story voices
  useEffect(() => {
    soundEngine.updateSettings(config.audioSettings);
    audioService.updateConfig(config.characterVoices, config.audioSettings);
    if (config.audioSettings.voiceEnabled && config.audioSettings.autoNarrate) {
      audioService.prefetch('narrador', config.openingNarration);
      const st1 = config.stations[0];
      if (st1) {
        audioService.prefetch('narrador', st1.narratorIntro);
        audioService.prefetch(st1.intervention.characterId, st1.intervention.dialogue);
      }
      const st2 = config.stations[1];
      if (st2) {
        audioService.prefetch('narrador', st2.narratorIntro);
      }
    }
  }, [config.audioSettings, config.characterVoices, config.openingNarration, config.stations]);

  useEffect(() => {
    return audioService.subscribe(setSpeechStatus);
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    return () => {
      if (interventionTimerRef.current !== null) {
        clearTimeout(interventionTimerRef.current);
      }
      if (conversationEndTimerRef.current !== null) {
        clearTimeout(conversationEndTimerRef.current);
      }
      audioService.stop();
      soundEngine.dispose();
    };
  }, []);

  const clearPendingTimers = useCallback(() => {
    if (interventionTimerRef.current !== null) {
      clearTimeout(interventionTimerRef.current);
      interventionTimerRef.current = null;
    }
    if (conversationEndTimerRef.current !== null) {
      clearTimeout(conversationEndTimerRef.current);
      conversationEndTimerRef.current = null;
    }
  }, []);

  const prefetchStationBundle = useCallback(
    (stationId: number) => {
      const upcoming = getStationsToPrefetch(config.stations, stationId);
      for (const st of upcoming) {
        audioService.prefetch('narrador', st.narratorIntro);
        audioService.prefetch(st.intervention.characterId, st.intervention.dialogue);
      }
    },
    [config.stations],
  );

  const runStationDialogueTurns = useCallback(
    (
      station: StoryStation,
      seqToken: number,
      onConversationComplete?: () => void,
    ) => {
      if (seqToken !== storySequenceRef.current) return;
      const turns = getStationDialogueTurns(station);

      if (turns.length === 0) {
        worldRef.current?.hideCompanion();
        onConversationComplete?.();
        return;
      }

      const companionFallback =
        turns.find((t) => t.characterId !== 'shrek' && t.characterId !== 'narrador')
          ?.characterId ?? null;

      let activeCompanionShown: CharacterId | null = null;
      const shouldSpeakAuto =
        config.audioSettings.autoNarrate && config.audioSettings.voiceEnabled;

      const finishConversation = () => {
        if (seqToken !== storySequenceRef.current) return;
        clearPendingTimers();
        worldRef.current?.hideCompanion();
        onConversationComplete?.();
      };

      const runTurnAt = (idx: number) => {
        if (seqToken !== storySequenceRef.current) return;
        if (idx >= turns.length) {
          finishConversation();
          return;
        }

        const turn = turns[idx];
        const voiceProfile = config.characterVoices[turn.characterId];
        const voiceId = voiceProfile?.voiceId ?? CHARACTER_VOICE_IDS[turn.characterId];

        // Position companion cleanly in 3D without hiding companion when Shrek replies
        if (turn.characterId !== 'narrador' && turn.characterId !== 'shrek') {
          activeCompanionShown = turn.characterId;
          worldRef.current?.showCompanion(turn.characterId, 35);
        } else if (turn.characterId === 'shrek') {
          if (!activeCompanionShown && companionFallback) {
            activeCompanionShown = companionFallback;
            worldRef.current?.showCompanion(companionFallback, 35);
          } else if (!activeCompanionShown) {
            worldRef.current?.showCompanion('shrek', 35);
          }
        }

        setActiveDialogue({
          speakerId: turn.characterId,
          voiceId,
          speakerName: turn.characterName || voiceProfile?.displayName || turn.characterId,
          text: turn.dialogue,
          actingInstruction:
            turn.actingInstruction ?? voiceProfile?.defaultActingInstruction,
          portraitUrl: turn.portraitUrl ?? station.intervention.portraitUrl,
          customAudioUrl: turn.customAudioUrl,
          isNarrator: turn.characterId === 'narrador',
          stationId: station.id,
        });

        let turnAdvanced = false;
        const advanceTurn = () => {
          if (turnAdvanced || seqToken !== storySequenceRef.current) return;
          turnAdvanced = true;
          if (conversationEndTimerRef.current !== null) {
            clearTimeout(conversationEndTimerRef.current);
            conversationEndTimerRef.current = null;
          }
          const delayMs =
            idx + 1 >= turns.length
              ? NARRATION_TIMING.pauseAfterCompanionMs
              : NARRATION_TIMING.pauseBetweenTurnsMs;
          conversationEndTimerRef.current = window.setTimeout(() => {
            runTurnAt(idx + 1);
          }, delayMs);
        };

        if (shouldSpeakAuto) {
          conversationEndTimerRef.current = window.setTimeout(
            advanceTurn,
            NARRATION_TIMING.startWatchdogMs,
          );
          audioService.speak({
            text: turn.dialogue,
            characterId: turn.characterId,
            voiceId,
            actingInstruction:
              turn.actingInstruction ?? voiceProfile?.defaultActingInstruction,
            customAudioUrl: turn.customAudioUrl,
            onStart: () => {
              if (turnAdvanced || seqToken !== storySequenceRef.current) return;
              if (conversationEndTimerRef.current !== null) {
                clearTimeout(conversationEndTimerRef.current);
              }
              conversationEndTimerRef.current = window.setTimeout(
                advanceTurn,
                NARRATION_TIMING.maxClipDurationMs,
              );
            },
            onEnd: advanceTurn,
          });
        } else {
          conversationEndTimerRef.current = window.setTimeout(
            advanceTurn,
            NARRATION_TIMING.silentCompanionHoldMs,
          );
        }
      };

      runTurnAt(0);
    },
    [
      clearPendingTimers,
      config.audioSettings.autoNarrate,
      config.audioSettings.voiceEnabled,
      config.characterVoices,
    ],
  );

  const handleOpenStory = useCallback(() => {
    if (phase !== 'title') return;
    document.documentElement.requestFullscreen?.().catch(() => {});
    soundEngine.unlockAudio();
    soundEngine.playBookOpenMagic();
    soundEngine.playPageTurn();
    setPhase('opening');

    const seqToken = ++storySequenceRef.current;
    clearPendingTimers();

    const firstStation = config.stations[0];
    if (firstStation) {
      prefetchStationBundle(firstStation.id);
    }

    const introText = config.openingNarration;
    const narratorProfile = config.characterVoices.narrador;
    setActiveDialogue({
      speakerId: 'narrador',
      voiceId: narratorProfile.voiceId ?? 'VOICE_NARRATOR',
      speakerName: narratorProfile.displayName,
      text: introText,
      actingInstruction: narratorProfile.defaultActingInstruction,
      isNarrator: true,
    });

    let boardReady = false;
    let introFinished = false;
    let firstCompanionTriggered = false;

    const maybeTriggerFirstCompanion = () => {
      if (seqToken !== storySequenceRef.current) return;
      if (!boardReady || !introFinished || firstCompanionTriggered || !firstStation) return;
      firstCompanionTriggered = true;
      clearPendingTimers();
      interventionTimerRef.current = window.setTimeout(() => {
        if (seqToken !== storySequenceRef.current) return;
        runStationDialogueTurns(firstStation, seqToken, () => {
          setModalStation(firstStation);
        });
      }, NARRATION_TIMING.pauseAfterNarratorMs);
    };

    const shouldSpeakAuto =
      config.audioSettings.autoNarrate && config.audioSettings.voiceEnabled;
    if (shouldSpeakAuto) {
      interventionTimerRef.current = window.setTimeout(() => {
        introFinished = true;
        maybeTriggerFirstCompanion();
      }, NARRATION_TIMING.startWatchdogMs + 1500);

      audioService.speak({
        text: introText,
        characterId: 'narrador',
        voiceId: narratorProfile.voiceId,
        actingInstruction: narratorProfile.defaultActingInstruction,
        onStart: () => {
          if (seqToken !== storySequenceRef.current) return;
          if (interventionTimerRef.current !== null) {
            clearTimeout(interventionTimerRef.current);
          }
          interventionTimerRef.current = window.setTimeout(() => {
            introFinished = true;
            maybeTriggerFirstCompanion();
          }, NARRATION_TIMING.maxClipDurationMs);
        },
        onEnd: () => {
          if (seqToken !== storySequenceRef.current) return;
          introFinished = true;
          maybeTriggerFirstCompanion();
        },
      });
    }

    window.setTimeout(() => {
      soundEngine.playPageTurn();
    }, 480);

    window.setTimeout(() => {
      if (seqToken !== storySequenceRef.current) return;
      boardReady = true;
      setPhase('playing');
      worldRef.current?.triggerCelebration();
      if (firstStation) {
        setCurrentStation(firstStation);
        soundEngine.setRealm(firstStation.realmId);
        if (!shouldSpeakAuto) {
          interventionTimerRef.current = window.setTimeout(() => {
            introFinished = true;
            maybeTriggerFirstCompanion();
          }, NARRATION_TIMING.silentNarratorHoldMs);
        } else {
          maybeTriggerFirstCompanion();
        }
      }
    }, 1350);
  }, [
    phase,
    config.openingNarration,
    config.characterVoices.narrador,
    config.audioSettings.autoNarrate,
    config.audioSettings.voiceEnabled,
    config.stations,
    clearPendingTimers,
    prefetchStationBundle,
    runStationDialogueTurns,
  ]);

  const handleStartWalk = useCallback(
    (targetStationId: number | null) => {
      storySequenceRef.current += 1;
      clearPendingTimers();
      audioService.stop();
      worldRef.current?.hideCompanion();
      setModalStation(null);
      setActiveDialogue((prev) => (prev ? null : prev));
      if (targetStationId !== null) {
        prefetchStationBundle(targetStationId);
      }
    },
    [clearPendingTimers, prefetchStationBundle],
  );

  const handleArriveStation = useCallback(
    (station: StoryStation) => {
      const seqToken = ++storySequenceRef.current;
      clearPendingTimers();
      audioService.stop();

      setCurrentStation(station);
      setModalStation(null);
      setVisitedIds((prev) =>
        prev.includes(station.id) ? prev : [...prev, station.id],
      );
      soundEngine.setRealm(station.realmId);
      soundEngine.playStationDiscover();
      worldRef.current?.triggerCelebration();
      worldRef.current?.hideCompanion();

      prefetchStationBundle(station.id);

      const narratorProfile = config.characterVoices.narrador;
      const narratorActing =
        station.narratorActingInstruction ?? narratorProfile.defaultActingInstruction;

      setActiveDialogue({
        speakerId: 'narrador',
        voiceId: narratorProfile.voiceId ?? 'VOICE_NARRATOR',
        speakerName: narratorProfile.displayName,
        text: station.narratorIntro,
        actingInstruction: narratorActing,
        isNarrator: true,
        stationId: station.id,
      });

      let intervened = false;
      const runIntervention = () => {
        if (intervened || seqToken !== storySequenceRef.current) return;
        intervened = true;
        clearPendingTimers();
        runStationDialogueTurns(station, seqToken, () => {
          setModalStation(station);
        });
      };

      const scheduleIntervention = () => {
        if (intervened || seqToken !== storySequenceRef.current) return;
        clearPendingTimers();
        interventionTimerRef.current = window.setTimeout(
          runIntervention,
          NARRATION_TIMING.pauseAfterNarratorMs,
        );
      };

      const shouldSpeakAuto =
        config.audioSettings.autoNarrate && config.audioSettings.voiceEnabled;
      if (shouldSpeakAuto) {
        interventionTimerRef.current = window.setTimeout(
          runIntervention,
          NARRATION_TIMING.startWatchdogMs,
        );
        audioService.speak({
          text: station.narratorIntro,
          characterId: 'narrador',
          voiceId: narratorProfile.voiceId,
          actingInstruction: narratorActing,
          onStart: () => {
            if (intervened || seqToken !== storySequenceRef.current) return;
            if (interventionTimerRef.current !== null) {
              clearTimeout(interventionTimerRef.current);
            }
            interventionTimerRef.current = window.setTimeout(
              runIntervention,
              NARRATION_TIMING.maxClipDurationMs,
            );
          },
          onEnd: scheduleIntervention,
        });
      } else {
        interventionTimerRef.current = window.setTimeout(
          runIntervention,
          NARRATION_TIMING.silentNarratorHoldMs,
        );
      }
    },
    [
      config.characterVoices.narrador,
      config.audioSettings.autoNarrate,
      config.audioSettings.voiceEnabled,
      clearPendingTimers,
      prefetchStationBundle,
      runStationDialogueTurns,
    ],
  );

  const openStationModal = useCallback((station: StoryStation) => {
    setModalStation(station);
  }, []);

  const closeStationModal = useCallback(() => {
    setModalStation(null);
  }, []);

  const handleUpdateStationImage = useCallback((stationId: number, newUrl: string) => {
    setConfig((prev) => {
      const next: StoryConfig = {
        ...prev,
        stations: prev.stations.map((s) =>
          s.id === stationId ? { ...s, imageUrl: newUrl } : s,
        ),
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
    setCurrentStation((prev) =>
      prev && prev.id === stationId ? { ...prev, imageUrl: newUrl } : prev,
    );
    setModalStation((prev) =>
      prev && prev.id === stationId ? { ...prev, imageUrl: newUrl } : prev,
    );
  }, []);

  const handleSelectStation = useCallback(
    (stationId: number) => {
      soundEngine.unlockAudio();
      const target = config.stations.find((s) => s.id === stationId);
      if (!target) return;

      if (currentStation?.id === stationId) {
        openStationModal(target);
        return;
      }
      worldRef.current?.walkToStation(stationId);
    },
    [config.stations, currentStation?.id, openStationModal],
  );

  const handleUpdateAudio = useCallback((patch: Partial<AudioSettings>) => {
    soundEngine.unlockAudio();
    setConfig((prev) => {
      const next: StoryConfig = {
        ...prev,
        audioSettings: { ...prev.audioSettings, ...patch },
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  const handleSaveTeacherConfig = useCallback((next: StoryConfig) => {
    setConfig(next);
    setCurrentStation((prev) =>
      prev ? next.stations.find((s) => s.id === prev.id) ?? next.stations[0] : next.stations[0],
    );
    setModalStation((prev) =>
      prev ? next.stations.find((s) => s.id === prev.id) ?? null : null,
    );
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      try {
        const trimmedVoices = { ...next.characterVoices };
        for (const k of Object.keys(trimmedVoices) as Array<keyof typeof trimmedVoices>) {
          trimmedVoices[k] = { ...trimmedVoices[k], generatedAudioDataUrl: '' };
        }
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...next, characterVoices: trimmedVoices }),
        );
      } catch {
        // Ignore storage quota errors
      }
    }
  }, []);

  const handleResetDefaults = useCallback(() => {
    const fresh = structuredClone(DEFAULT_STORY_CONFIG);
    setConfig(fresh);
    setCurrentStation(fresh.stations[0]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const handlePauseOrResumeVoice = useCallback(() => {
    soundEngine.unlockAudio();
    if (speechStatus === 'speaking') {
      audioService.pause();
    } else if (speechStatus === 'paused') {
      audioService.resume();
    } else if (activeDialogue) {
      audioService.speak({
        text: activeDialogue.text,
        characterId: activeDialogue.speakerId,
        voiceId: activeDialogue.voiceId,
        actingInstruction: activeDialogue.actingInstruction,
        customAudioUrl: activeDialogue.customAudioUrl,
      });
    }
  }, [speechStatus, activeDialogue]);

  const handleRepeatVoice = useCallback(() => {
    soundEngine.unlockAudio();
    const seqToken = ++storySequenceRef.current;
    clearPendingTimers();

    if (activeDialogue) {
      if (!activeDialogue.isNarrator) {
        worldRef.current?.showCompanion(activeDialogue.speakerId, 30);
        const finishRepeat = () => {
          if (seqToken !== storySequenceRef.current) return;
          worldRef.current?.hideCompanion();
        };
        conversationEndTimerRef.current = window.setTimeout(
          finishRepeat,
          NARRATION_TIMING.startWatchdogMs,
        );
        audioService.speak({
          text: activeDialogue.text,
          characterId: activeDialogue.speakerId,
          voiceId: activeDialogue.voiceId,
          actingInstruction: activeDialogue.actingInstruction,
          customAudioUrl: activeDialogue.customAudioUrl,
          onStart: () => {
            if (seqToken !== storySequenceRef.current) return;
            if (conversationEndTimerRef.current !== null) {
              clearTimeout(conversationEndTimerRef.current);
            }
            conversationEndTimerRef.current = window.setTimeout(
              finishRepeat,
              NARRATION_TIMING.maxClipDurationMs,
            );
          },
          onEnd: () => {
            if (seqToken !== storySequenceRef.current) return;
            if (conversationEndTimerRef.current !== null) {
              clearTimeout(conversationEndTimerRef.current);
            }
            conversationEndTimerRef.current = window.setTimeout(
              finishRepeat,
              NARRATION_TIMING.pauseAfterCompanionMs,
            );
          },
        });
      } else {
        audioService.speak({
          text: activeDialogue.text,
          characterId: activeDialogue.speakerId,
          voiceId: activeDialogue.voiceId,
          actingInstruction: activeDialogue.actingInstruction,
          customAudioUrl: activeDialogue.customAudioUrl,
        });
      }
    } else {
      audioService.repeatLast();
    }
  }, [activeDialogue, clearPendingTimers]);

  const handleDismissDialogue = useCallback(() => {
    storySequenceRef.current += 1;
    clearPendingTimers();
    audioService.stop();
    worldRef.current?.hideCompanion();
    setActiveDialogue(null);
  }, [clearPendingTimers]);

  return (
    <main className="relative flex flex-col sm:flex-row w-screen h-screen overflow-hidden select-none">
      {/* Adaptive 3D Game Stage — resizes fluidly when a station window opens beside it */}
      <div className="relative flex-1 min-w-0 min-h-0 h-full overflow-hidden">
        <WorldCanvas
          ref={worldRef}
          stations={config.stations}
          visitedIds={visitedIds}
          activeStationId={currentStation?.id ?? null}
          speakingCharacterId={
            teacherOpen || voiceStudioOpen ? null : activeDialogue?.speakerId ?? null
          }
          speakingLabel={activeDialogue?.speakerName ?? ''}
          atmosphere={atmosphere}
          lowPerformance={lowPerformance}
          isModalOpen={teacherOpen || voiceStudioOpen || phase !== 'playing'}
          onArriveStation={handleArriveStation}
          onSelectStationLabel={handleSelectStation}
          onStartWalk={handleStartWalk}
        />

        {/* Interactive HUD Layer */}
        {phase === 'playing' && (
          <StoryHud
            stations={config.stations}
            visitedIds={visitedIds}
            currentStation={currentStation}
            activeDialogue={teacherOpen || voiceStudioOpen ? null : activeDialogue}
            activeVoiceProfile={
              activeDialogue
                ? config.characterVoices[activeDialogue.speakerId]
                : undefined
            }
            speechStatus={speechStatus}
            atmosphere={atmosphere}
            audioSettings={config.audioSettings}
            lowPerformance={lowPerformance}
            isFullscreen={isFullscreen}
            hasDockedPanel={Boolean(modalStation)}
            onWalkToStation={handleSelectStation}
            onOpenCurrentStation={() => {
              if (currentStation) openStationModal(currentStation);
            }}
            onOverviewCamera={() => worldRef.current?.resetOverviewCamera()}
            onToggleAtmosphere={() =>
              setAtmosphere((prev) => (prev === 'claro' ? 'oscuro' : 'claro'))
            }
            onToggleLowPerf={() => setLowPerformance((v) => !v)}
            onToggleFullscreen={toggleFullscreen}
            onOpenVoiceDesign={() => {
              audioService.stop();
              setVoiceStudioOpen(true);
            }}
            onOpenTeacherMode={() => {
              audioService.stop();
              setTeacherOpen(true);
            }}
            onUpdateAudio={handleUpdateAudio}
            onPauseOrResumeVoice={handlePauseOrResumeVoice}
            onRepeatVoice={handleRepeatVoice}
            onDismissDialogue={handleDismissDialogue}
            onNudgeMove={(dx, dz) => worldRef.current?.nudgeMove(dx, dz)}
          />
        )}
      </div>

      {/* Dynamic Non-Interruptive Parchment Station Panel (adapts screen alongside the 3D board) */}
      <StationModal
        station={modalStation}
        onUpdateImage={handleUpdateStationImage}
        onClose={closeStationModal}
      />

      {/* Voice Design Studio (Gemini API Archetypes + Scene Script Acting) */}
      <VoiceDesignPanel
        open={voiceStudioOpen}
        config={config}
        onSaveConfig={handleSaveTeacherConfig}
        onClose={() => {
          audioService.stop();
          setVoiceStudioOpen(false);
        }}
      />

      {/* Discrete Teacher Mode Editor (Stations + Estudio de Voces + Portada & Audio) */}
      <TeacherModeDrawer
        open={teacherOpen}
        config={config}
        onSaveConfig={handleSaveTeacherConfig}
        onResetDefaults={handleResetDefaults}
        onClose={() => {
          audioService.stop();
          setTeacherOpen(false);
        }}
      />

      {/* Initial Closed Medieval Storybook & Opening Page-Turn Transition */}
      <StoryBookIntro
        title={config.bookTitle}
        subtitle={config.bookSubtitle}
        tagline={config.coverTagline}
        phase={phase}
        onOpenStory={handleOpenStory}
      />
    </main>
  );
}
