import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CharacterId,
  StoryStation,
  ThemeAtmosphere,
  WorldPoint,
} from '../types/story';
import {
  clampToBoard,
  computeDialogueCameraFraming,
  findNearestStation,
  getGroundHeightAt,
} from '../utils/storyLogic';
import { createRadialShadowTexture } from '../three/proceduralTextures';
import {
  CompanionRig,
  ShrekRig,
  animateCompanionRig,
  animateShrekRig,
  createCompanionRig,
  createShrekHero,
} from '../three/characters3d';
import { WorldHandles, buildStorybookWorld } from '../three/worldBuilder';
import { Fallback2DBoard } from './Fallback2DBoard';
import { soundEngine } from '../audio/soundEngine';

export interface WorldCanvasHandle {
  walkToStation: (stationId: number) => void;
  nudgeMove: (dx: number, dz: number) => void;
  resetOverviewCamera: () => void;
  saveCameraSnapshot: () => void;
  restoreCameraSnapshot: () => void;
  triggerCelebration: () => void;
  showCompanion: (characterId: CharacterId, durationSec?: number) => void;
  hideCompanion: () => void;
}

interface WorldCanvasProps {
  stations: StoryStation[];
  visitedIds: number[];
  activeStationId: number | null;
  speakingCharacterId?: CharacterId | null;
  speakingLabel?: string;
  atmosphere: ThemeAtmosphere;
  lowPerformance: boolean;
  isModalOpen: boolean;
  onArriveStation: (station: StoryStation) => void;
  onSelectStationLabel: (stationId: number) => void;
  onStartWalk?: (targetStationId: number | null) => void;
  onPositionUpdate?: (pos: WorldPoint) => void;
}

const _vec3 = new THREE.Vector3();
const _targetColor = new THREE.Color();

export const WorldCanvas = React.forwardRef<WorldCanvasHandle, WorldCanvasProps>(
  (
    {
      stations,
      visitedIds,
      activeStationId,
      speakingCharacterId = null,
      speakingLabel = '',
      atmosphere,
      lowPerformance,
      isModalOpen,
      onArriveStation,
      onSelectStationLabel,
      onStartWalk,
      onPositionUpdate,
    },
    ref,
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const labelRefs = useRef<Record<number, HTMLButtonElement | null>>({});
    const speakerBubbleRef = useRef<HTMLDivElement | null>(null);
    const [webglFailed, setWebglFailed] = useState(false);

    const speakingCharRef = useRef<CharacterId | null>(speakingCharacterId);
    speakingCharRef.current = speakingCharacterId;

    // Synced refs so WebGL effect mounts once and never resets on React state changes
    const stationsRef = useRef(stations);
    stationsRef.current = stations;

    const visitedRef = useRef(visitedIds);
    visitedRef.current = visitedIds;

    const activeStationRef = useRef(activeStationId);
    activeStationRef.current = activeStationId;

    const atmosphereRef = useRef(atmosphere);
    atmosphereRef.current = atmosphere;

    const lowPerfRef = useRef(lowPerformance);
    lowPerfRef.current = lowPerformance;

    const isModalOpenRef = useRef(isModalOpen);
    isModalOpenRef.current = isModalOpen;

    const onArriveRef = useRef(onArriveStation);
    onArriveRef.current = onArriveStation;

    const onStartWalkRef = useRef(onStartWalk);
    onStartWalkRef.current = onStartWalk;

    const onPosUpdateRef = useRef(onPositionUpdate);
    onPosUpdateRef.current = onPositionUpdate;

    // Mutable simulation state accessed from imperative handle and loop
    const simRef = useRef<{
      shrekPos: WorldPoint;
      shrekHeading: number;
      moveTarget: WorldPoint | null;
      pendingStationId: number | null;
      lastTriggeredStationId: number | null;
      gaitPhase: number;
      footstepAccum: number;
      celebrateTimer: number;
      cameraMode: 'follow' | 'overview';
      overviewGlide: boolean;
      cameraSnapshot: { pos: THREE.Vector3; target: THREE.Vector3 } | null;
      companionTimer: number;
      conversationFocusTimer: number;
      companionChar: CharacterId | null;
      shrekRig: ShrekRig | null;
      worldHandles: WorldHandles | null;
      companionHolder: THREE.Group | null;
      companionRigs: Partial<Record<CharacterId, CompanionRig>>;
      camera: THREE.PerspectiveCamera | null;
      controls: OrbitControls | null;
    }>({
      shrekPos: { ...stations[0].worldPosition },
      shrekHeading: 0.4,
      moveTarget: null,
      pendingStationId: null,
      lastTriggeredStationId: stations[0].id,
      gaitPhase: 0,
      footstepAccum: 0,
      celebrateTimer: 0,
      cameraMode: 'follow',
      overviewGlide: false,
      cameraSnapshot: null,
      companionTimer: 0,
      conversationFocusTimer: 0,
      companionChar: null,
      shrekRig: null,
      worldHandles: null,
      companionHolder: null,
      companionRigs: {},
      camera: null,
      controls: null,
    });

    const [fallbackPos, setFallbackPos] = useState<WorldPoint>({
      ...stations[0].worldPosition,
    });

    useImperativeHandle(ref, () => ({
      walkToStation(stationId: number) {
        const targetStation = stationsRef.current.find((s) => s.id === stationId);
        if (!targetStation) return;
        simRef.current.companionTimer = 0;
        simRef.current.conversationFocusTimer = 0;
        simRef.current.companionChar = null;
        if (simRef.current.companionHolder) {
          simRef.current.companionHolder.visible = false;
        }
        simRef.current.moveTarget = { ...targetStation.worldPosition };
        simRef.current.pendingStationId = stationId;
        simRef.current.cameraMode = 'follow';
        simRef.current.overviewGlide = false;
        onStartWalkRef.current?.(stationId);
      },
      nudgeMove(dx: number, dz: number) {
        const next = clampToBoard({
          x: simRef.current.shrekPos.x + dx * 2.2,
          z: simRef.current.shrekPos.z + dz * 2.2,
        });
        simRef.current.companionTimer = 0;
        simRef.current.conversationFocusTimer = 0;
        simRef.current.companionChar = null;
        if (simRef.current.companionHolder) {
          simRef.current.companionHolder.visible = false;
        }
        simRef.current.moveTarget = next;
        simRef.current.pendingStationId = null;
        simRef.current.cameraMode = 'follow';
        simRef.current.overviewGlide = false;
        onStartWalkRef.current?.(null);
      },
      resetOverviewCamera() {
        simRef.current.cameraMode = 'overview';
        simRef.current.overviewGlide = true;
      },
      saveCameraSnapshot() {
        const { camera, controls } = simRef.current;
        if (camera && controls) {
          simRef.current.cameraSnapshot = {
            pos: camera.position.clone(),
            target: controls.target.clone(),
          };
        }
      },
      restoreCameraSnapshot() {
        const { camera, controls, cameraSnapshot } = simRef.current;
        if (camera && controls && cameraSnapshot) {
          camera.position.copy(cameraSnapshot.pos);
          controls.target.copy(cameraSnapshot.target);
          controls.update();
        }
      },
      triggerCelebration() {
        simRef.current.celebrateTimer = 2.0;
      },
      showCompanion(characterId: CharacterId, durationSec = 30) {
        simRef.current.cameraMode = 'follow';
        simRef.current.overviewGlide = false;
        simRef.current.conversationFocusTimer = durationSec;

        if (characterId === 'shrek' || characterId === 'narrador') {
          simRef.current.companionChar = null;
          simRef.current.companionTimer = 0;
          if (simRef.current.companionHolder) {
            simRef.current.companionHolder.visible = false;
          }
          simRef.current.celebrateTimer = 1.6;
          return;
        }
        simRef.current.companionChar = characterId;
        simRef.current.companionTimer = durationSec;
        const holder = simRef.current.companionHolder;
        if (holder) {
          Object.entries(simRef.current.companionRigs).forEach(([id, rig]) => {
            if (rig) rig.root.visible = id === characterId;
          });
          holder.visible = true;
        }
      },
      hideCompanion() {
        simRef.current.companionTimer = 0;
        simRef.current.conversationFocusTimer = 0;
        simRef.current.companionChar = null;
        if (simRef.current.companionHolder) {
          simRef.current.companionHolder.visible = false;
        }
      },
    }));

    useEffect(() => {
      if (webglFailed) return;
      const container = mountRef.current;
      if (!container) return;

      // Detect software WebGL (SwiftShader / llvmpipe / WARP) from renderer string
      const probeCanvas = document.createElement('canvas');
      const probeGl = probeCanvas.getContext('webgl2');
      if (!probeGl) {
        setWebglFailed(true);
        return;
      }
      const debugExt = probeGl.getExtension('WEBGL_debug_renderer_info');
      const rendererParam = debugExt ? debugExt.UNMASKED_RENDERER_WEBGL : probeGl.RENDERER;
      const gpuName = String(probeGl.getParameter(rendererParam));
      probeGl.getExtension('WEBGL_lose_context')?.loseContext();
      const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuName);

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
        });
      } catch {
        setWebglFailed(true);
        return;
      }

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
      );
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setWebglFailed(true);
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

      const scene = new THREE.Scene();
      const dayBgColor = new THREE.Color(0xd7e7ea);
      const nightBgColor = new THREE.Color(0x131726);
      scene.background = dayBgColor.clone();
      scene.fog = new THREE.FogExp2(0xd7e7ea, 0.011);

      // Studio environment reflections
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();

      // Isometric / Elevated Fairytale Perspective Camera (starts elevated over book for cinematic swoop)
      const camera = new THREE.PerspectiveCamera(44, width / height, 0.5, 220);
      const startPos = stationsRef.current[0].worldPosition;
      camera.position.set(0, 31.0, 26.0);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.4, 0);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.07;
      controls.minDistance = 4.8;
      controls.maxDistance = 58;
      controls.minPolarAngle = 0.32;
      controls.maxPolarAngle = Math.PI / 2.25;
      controls.update();

      controls.addEventListener('start', () => {
        // User manual orbit takes control immediately without fighting
        simRef.current.cameraMode = 'overview';
        simRef.current.overviewGlide = false;
      });

      // Warm/Cool Studio 3-Point Lighting Rig
      const hemiLight = new THREE.HemisphereLight(0xbfdfff, 0x5c4732, 0.72);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfff1d6, 1.55);
      sunLight.position.set(18, 28, 16);
      sunLight.castShadow = !isSoftwareGl;
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.near = 2;
      sunLight.shadow.camera.far = 75;
      const d = 26;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
      scene.add(sunLight);

      const rimLight = new THREE.DirectionalLight(0x9bc4ff, 0.45);
      rimLight.position.set(-20, 14, -18);
      scene.add(rimLight);

      // Build Storybook World + Shrek + Companions
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const worldHandles = buildStorybookWorld(
        scene,
        stationsRef.current,
        maxAniso,
        isSoftwareGl,
      );
      const shadowTex = createRadialShadowTexture();
      const shrekRig = createShrekHero(shadowTex);
      const initY = Math.max(-0.08, getGroundHeightAt(startPos.x, startPos.z));
      shrekRig.root.position.set(startPos.x, initY, startPos.z);
      scene.add(shrekRig.root);

      const companionHolder = new THREE.Group();
      companionHolder.visible = false;
      scene.add(companionHolder);

      const companionIds: CharacterId[] = [
        'burro',
        'fiona',
        'gato',
        'farquaad',
        'hada',
        'principe',
        'jengibre',
        'shrek',
      ];
      const companionRigs: Partial<Record<CharacterId, CompanionRig>> = {};
      companionIds.forEach((cid) => {
        const rig = createCompanionRig(cid, shadowTex);
        rig.root.visible = false;
        companionHolder.add(rig.root);
        companionRigs[cid] = rig;
      });

      simRef.current.shrekRig = shrekRig;
      simRef.current.worldHandles = worldHandles;
      simRef.current.companionHolder = companionHolder;
      simRef.current.companionRigs = companionRigs;
      simRef.current.camera = camera;
      simRef.current.controls = controls;

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      // Keyboard WASD / Arrow movement
      const keysPressed = new Set<string>();
      const onKeyDown = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        keysPressed.add(e.code);
        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(
            e.code,
          )
        ) {
          simRef.current.moveTarget = null;
          simRef.current.pendingStationId = null;
          simRef.current.companionTimer = 0;
          simRef.current.conversationFocusTimer = 0;
          if (simRef.current.companionHolder) {
            simRef.current.companionHolder.visible = false;
          }
          simRef.current.cameraMode = 'follow';
          if (!e.repeat) {
            onStartWalkRef.current?.(null);
          }
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        keysPressed.delete(e.code);
      };
      const clearKeys = () => {
        keysPressed.clear();
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', clearKeys);

      // Raycasting for Click-to-Move on stations & board terrain
      const raycaster = new THREE.Raycaster();
      const pointerNdc = new THREE.Vector2();
      let pointerDownXY = { x: 0, y: 0 };

      const onPointerDown = (e: PointerEvent) => {
        pointerDownXY = { x: e.clientX, y: e.clientY };
      };

      const onPointerUp = (e: PointerEvent) => {
        if (isModalOpenRef.current) return;
        const dragDist = Math.hypot(e.clientX - pointerDownXY.x, e.clientY - pointerDownXY.y);
        if (dragDist > 8) return; // Ignore orbit drags

        const rect = renderer.domElement.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.layers.set(1);
        raycaster.setFromCamera(pointerNdc, camera);
        const stationHits = raycaster.intersectObjects(worldHandles.clickables, false);
        if (stationHits.length > 0) {
          const hitId = Number(stationHits[0].object.userData.stationId);
          const targetStation = stationsRef.current.find((s) => s.id === hitId);
          if (targetStation) {
            simRef.current.moveTarget = { ...targetStation.worldPosition };
            simRef.current.pendingStationId = hitId;
            simRef.current.cameraMode = 'follow';
            soundEngine.unlockAudio();
            onStartWalkRef.current?.(hitId);
            return;
          }
        }

        // Otherwise click terrain to walk anywhere on the storybook board
        raycaster.layers.set(0);
        raycaster.setFromCamera(pointerNdc, camera);
        const groundHits = raycaster.intersectObject(worldHandles.terrainMesh, false);
        if (groundHits.length > 0) {
          const pt = clampToBoard({
            x: groundHits[0].point.x,
            z: groundHits[0].point.z,
          });
          simRef.current.moveTarget = pt;
          simRef.current.pendingStationId = null;
          simRef.current.cameraMode = 'follow';
          soundEngine.unlockAudio();
          onStartWalkRef.current?.(null);
        }
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);

      // ResizeObserver for crisp responsive viewport
      const resizeObserver = new ResizeObserver(() => {
        if (!container || disposed) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.render(scene, camera);
      });
      resizeObserver.observe(container);

      // Loop with software-WebGL afterDraw pacing
      let frameId = 0;
      let disposed = false;
      let lastTime = performance.now();
      let elapsed = 0;
      let nightBlend = atmosphereRef.current === 'oscuro' ? 1 : 0;

      const afterDraw = (cb: () => void) => {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      };

      const tick = () => {
        if (disposed) return;
        const now = performance.now();
        const rawDt = (now - lastTime) / 1000;
        lastTime = now;
        const dt = Math.min(Math.max(rawDt, 0.001), isSoftwareGl ? 0.45 : 0.2);
        elapsed += dt;

        // 1. Update Shrek movement (Keyboard OR Click-to-Move)
        let moveX = 0;
        let moveZ = 0;
        if (!isModalOpenRef.current) {
          if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) moveZ -= 1;
          if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) moveZ += 1;
          if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) moveX -= 1;
          if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) moveX += 1;
        }

        let isMoving = false;
        const speed = 7.2;

        if (moveX !== 0 || moveZ !== 0) {
          const len = Math.hypot(moveX, moveZ);
          const dirX = moveX / len;
          const dirZ = moveZ / len;
          const next = clampToBoard({
            x: simRef.current.shrekPos.x + dirX * speed * dt,
            z: simRef.current.shrekPos.z + dirZ * speed * dt,
          });
          const stepDist = Math.hypot(
            next.x - simRef.current.shrekPos.x,
            next.z - simRef.current.shrekPos.z,
          );
          simRef.current.shrekPos = next;
          simRef.current.shrekHeading = Math.atan2(dirX, dirZ);
          simRef.current.gaitPhase += stepDist * 3.1;
          simRef.current.footstepAccum += stepDist;
          isMoving = stepDist > 0.001;
        } else if (simRef.current.moveTarget) {
          const dx = simRef.current.moveTarget.x - simRef.current.shrekPos.x;
          const dz = simRef.current.moveTarget.z - simRef.current.shrekPos.z;
          const dist = Math.hypot(dx, dz);
          const stepDist = Math.min(dist, speed * dt);
          const arrived = dist - stepDist <= 0.22;
          const nextPos = arrived
            ? clampToBoard(simRef.current.moveTarget)
            : clampToBoard({
                x: simRef.current.shrekPos.x + (dx / Math.max(dist, 0.0001)) * stepDist,
                z: simRef.current.shrekPos.z + (dz / Math.max(dist, 0.0001)) * stepDist,
              });
          const step = {
            position: nextPos,
            heading: dist > 0.001 ? Math.atan2(dx, dz) : simRef.current.shrekHeading,
            distanceMoved: stepDist,
            arrived,
          };
          simRef.current.shrekPos = step.position;
          simRef.current.shrekHeading = step.heading;
          simRef.current.gaitPhase += step.distanceMoved * 3.1;
          simRef.current.footstepAccum += step.distanceMoved;
          isMoving = !step.arrived;

          if (step.arrived) {
            const arrivedId = simRef.current.pendingStationId;
            simRef.current.moveTarget = null;
            simRef.current.pendingStationId = null;
            if (arrivedId !== null) {
              const st = stationsRef.current.find((s) => s.id === arrivedId);
              if (st) {
                simRef.current.lastTriggeredStationId = st.id;
                simRef.current.celebrateTimer = 1.6;
                onArriveRef.current(st);
              }
            }
          }
        }

        // Terrain-aware footstep SFX
        if (simRef.current.footstepAccum > 1.35) {
          simRef.current.footstepAccum = 0;
          const near = findNearestStation(simRef.current.shrekPos, stationsRef.current, 6.0);
          soundEngine.playFootstep(near?.realmId ?? 'bosque_encantado');
        }

        // Proximity detection when walking freely with keyboard
        if (isMoving && simRef.current.pendingStationId === null) {
          const nearby = findNearestStation(simRef.current.shrekPos, stationsRef.current, 1.55);
          if (nearby && nearby.id !== simRef.current.lastTriggeredStationId) {
            simRef.current.lastTriggeredStationId = nearby.id;
            onArriveRef.current(nearby);
          } else if (!nearby) {
            simRef.current.lastTriggeredStationId = null;
          }
        }

        // Apply Shrek position & articulated animation
        const groundY = Math.max(
          -0.08,
          getGroundHeightAt(simRef.current.shrekPos.x, simRef.current.shrekPos.z),
        );
        shrekRig.root.position.set(
          simRef.current.shrekPos.x,
          groundY,
          simRef.current.shrekPos.z,
        );
        // Smooth heading wrap
        let diff = simRef.current.shrekHeading - shrekRig.root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        shrekRig.root.rotation.y += diff * Math.min(1, dt * 12);

        if (simRef.current.celebrateTimer > 0) {
          simRef.current.celebrateTimer = Math.max(0, simRef.current.celebrateTimer - dt);
        }
        if (simRef.current.conversationFocusTimer > 0) {
          simRef.current.conversationFocusTimer = Math.max(
            0,
            simRef.current.conversationFocusTimer - dt,
          );
        }

        const activeSpeaker = speakingCharRef.current;
        const isShrekSpeaking =
          activeSpeaker === 'shrek' ||
          (simRef.current.conversationFocusTimer > 0 && !activeSpeaker && !simRef.current.companionChar);

        animateShrekRig(
          shrekRig,
          simRef.current.gaitPhase,
          isMoving,
          simRef.current.celebrateTimer,
          elapsed,
          dt,
          isShrekSpeaking && !isMoving,
        );

        // 2. Companion character position, grounded orientation & expressive dialogue animation
        let activeCompanionPos: WorldPoint | null = null;
        let activeCompanionGroundY = groundY;

        if (simRef.current.companionTimer > 0 && companionHolder.visible) {
          simRef.current.companionTimer -= dt;
          const age = 30 - simRef.current.companionTimer;
          const popScale = Math.min(1, Math.max(0.05, age * 4.5));
          companionHolder.scale.setScalar(0.35 + popScale * 0.65);

          const sideOffset = simRef.current.shrekPos.x > 13 ? -1.45 : 1.45;
          const cPos = clampToBoard({
            x: simRef.current.shrekPos.x + sideOffset,
            z: simRef.current.shrekPos.z - 0.65,
          });
          const cy = Math.max(-0.08, getGroundHeightAt(cPos.x, cPos.z));
          activeCompanionPos = cPos;
          activeCompanionGroundY = cy;
          companionHolder.position.set(cPos.x, cy, cPos.z);

          const dxToShrek = simRef.current.shrekPos.x - cPos.x;
          const dzToShrek = simRef.current.shrekPos.z - cPos.z;
          companionHolder.rotation.set(0, Math.atan2(dxToShrek, dzToShrek), 0);

          if (!isMoving) {
            simRef.current.shrekHeading = Math.atan2(-dxToShrek, -dzToShrek);
          }

          const activeCid = simRef.current.companionChar;
          const activeRig = activeCid ? simRef.current.companionRigs[activeCid] : undefined;
          if (activeRig) {
            const companionSpeaking = activeSpeaker === activeCid;
            animateCompanionRig(activeRig, elapsed, companionSpeaking, dt);
          }

          if (simRef.current.companionTimer <= 0) {
            companionHolder.visible = false;
            simRef.current.conversationFocusTimer = 0;
          }
        }

        // 2b. Living World Movie Details (Dragon wings, banners, lily pads, water shimmer)
        if (worldHandles.dragonWings) {
          const [wingL, wingR] = worldHandles.dragonWings;
          const flap = Math.sin(elapsed * 3.6) * 0.42;
          wingL.rotation.z = 0.25 + flap;
          wingR.rotation.z = -0.25 - flap;
        }
        worldHandles.animatedBanners.forEach((banner, idx) => {
          banner.rotation.y = Math.sin(elapsed * 3.2 + idx * 1.4) * 0.28;
        });
        worldHandles.lilyPads.forEach((pad, idx) => {
          pad.position.y = -0.11 + Math.sin(elapsed * 1.8 + idx) * 0.025;
          pad.rotation.y = elapsed * 0.15 + idx;
        });
        worldHandles.waterMesh.position.y = -0.14 + Math.sin(elapsed * 1.4) * 0.014;

        // 3. Smooth Day / Night Atmosphere Interpolation
        const targetNight = atmosphereRef.current === 'oscuro' ? 1 : 0;
        nightBlend = THREE.MathUtils.damp(nightBlend, targetNight, 6.2, dt);

        _targetColor.copy(dayBgColor).lerp(nightBgColor, nightBlend);
        if (scene.background instanceof THREE.Color) {
          scene.background.copy(_targetColor);
        }
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.copy(_targetColor);
          scene.fog.density = THREE.MathUtils.lerp(0.01, 0.022, nightBlend);
        }

        scene.environmentIntensity = THREE.MathUtils.lerp(1.0, 0.25, nightBlend);
        hemiLight.intensity = THREE.MathUtils.lerp(0.72, 0.18, nightBlend);
        sunLight.intensity = THREE.MathUtils.lerp(1.55, 0.34, nightBlend);
        sunLight.color.setHex(0xfff1d6).lerp(new THREE.Color(0x6b8fe0), nightBlend);

        worldHandles.torchLights.forEach((tl, idx) => {
          const flicker = 1 + Math.sin(elapsed * 8 + idx * 2.1) * 0.14;
          tl.intensity = THREE.MathUtils.lerp(0.3, 4.2, nightBlend) * flicker;
          tl.distance = THREE.MathUtils.lerp(10, 16, nightBlend);
        });
        worldHandles.torchFlames.forEach((fl, idx) => {
          const s = 0.88 + Math.sin(elapsed * 11 + idx) * 0.16;
          fl.scale.set(s, 0.9 + s * 0.2, s);
        });

        // 4. Station Beacons & Fireflies animation
        worldHandles.stationMarkers.forEach((marker, idx) => {
          const isVisited = visitedRef.current.includes(marker.stationId);
          const isActive = activeStationRef.current === marker.stationId;
          marker.beaconMesh.rotation.y = elapsed * 1.4 + idx;
          marker.beaconMesh.position.y = 1.18 + Math.sin(elapsed * 2.5 + idx) * 0.12;

          const bMat = marker.beaconMesh.material as THREE.MeshStandardMaterial;
          const rMat = marker.ringMesh.material as THREE.MeshStandardMaterial;
          if (isActive) {
            bMat.color.setHex(0xffd24c);
            bMat.emissive.setHex(0xd48c17);
            rMat.color.setHex(0xffd24c);
          } else if (isVisited) {
            bMat.color.setHex(0xe8b944);
            bMat.emissive.setHex(0x9a6d14);
            rMat.color.setHex(0xe8b944);
          } else {
            bMat.color.setHex(0x52c48c);
            bMat.emissive.setHex(0x208056);
            rMat.color.setHex(0x3b8c6e);
          }
        });

        if (!lowPerfRef.current) {
          worldHandles.fireflies.visible = true;
          worldHandles.fireflies.rotation.y = elapsed * 0.03;
          const fMat = worldHandles.fireflies.material as THREE.PointsMaterial;
          fMat.opacity = THREE.MathUtils.lerp(0.45, 0.95, nightBlend);
        } else {
          worldHandles.fireflies.visible = false;
        }

        // 5. Camera Choreography (Smooth Follow + Dialogue Close-Up Zoom vs Overview Glide)
        if (simRef.current.cameraMode === 'follow') {
          const inConversation =
            simRef.current.conversationFocusTimer > 0 && !isMoving;
          const framing = computeDialogueCameraFraming(
            simRef.current.shrekPos,
            activeCompanionPos,
            groundY,
            activeCompanionGroundY,
            inConversation,
          );
          const targetDamp = inConversation ? 4.4 : 5.2;
          const posDamp = inConversation ? 3.2 : 3.6;

          controls.target.x = THREE.MathUtils.damp(controls.target.x, framing.target.x, targetDamp, dt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, framing.target.y, targetDamp, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, framing.target.z, targetDamp, dt);

          camera.position.x = THREE.MathUtils.damp(camera.position.x, framing.position.x, posDamp, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, framing.position.y, posDamp, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, framing.position.z, posDamp, dt);
        } else if (simRef.current.overviewGlide) {
          controls.target.x = THREE.MathUtils.damp(controls.target.x, 0, 6.5, dt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, 0, 6.5, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, 0, 6.5, dt);

          camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 6.0, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, 34.5, 6.0, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, 31.0, 6.0, dt);

          if (camera.position.distanceTo(_vec3.set(0, 34.5, 31.0)) < 0.4) {
            simRef.current.overviewGlide = false;
          }
        }
        controls.update();

        // 6. Project 3D Station Labels onto floating DOM buttons via refs (zero React re-renders!)
        const canvasW = renderer.domElement.clientWidth;
        const canvasH = renderer.domElement.clientHeight;
        worldHandles.stationMarkers.forEach((marker) => {
          const btn = labelRefs.current[marker.stationId];
          if (!btn) return;
          _vec3.copy(marker.group.position);
          _vec3.y += 2.05;
          _vec3.project(camera);
          if (_vec3.z < -1 || _vec3.z > 1) {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
          } else {
            const sx = ((_vec3.x + 1) / 2) * canvasW;
            const sy = ((-_vec3.y + 1) / 2) * canvasH;
            btn.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
            btn.style.opacity = isModalOpenRef.current ? '0.2' : '1';
            btn.style.pointerEvents = isModalOpenRef.current ? 'none' : 'auto';
          }
        });

        // 6b. Project active 3D speaker bubble above Shrek or active companion
        const bubbleEl = speakerBubbleRef.current;
        if (bubbleEl) {
          const spk = speakingCharRef.current;
          if (spk && spk !== 'narrador' && !isMoving && !isModalOpenRef.current) {
            const targetObj =
              spk === 'shrek'
                ? shrekRig.root
                : companionHolder.visible && simRef.current.companionChar === spk
                  ? companionHolder
                  : null;
            if (targetObj) {
              _vec3.copy(targetObj.position);
              _vec3.y += spk === 'shrek' ? 2.45 : spk === 'jengibre' || spk === 'gato' ? 1.55 : 2.15;
              _vec3.project(camera);
              if (_vec3.z >= -1 && _vec3.z <= 1) {
                const bx = ((_vec3.x + 1) / 2) * canvasW;
                const by = ((-_vec3.y + 1) / 2) * canvasH;
                bubbleEl.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0) translate(-50%, -100%)`;
                bubbleEl.style.opacity = '1';
              } else {
                bubbleEl.style.opacity = '0';
              }
            } else {
              bubbleEl.style.opacity = '0';
            }
          } else {
            bubbleEl.style.opacity = '0';
          }
        }

        renderer.render(scene, camera);

        if (isSoftwareGl || lowPerfRef.current) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      };

      // Expose clean overview reset on cameraMode
      const origReset = () => {
        camera.position.set(0, 27.5, 25.5);
        controls.target.set(0, 0, 0);
        controls.update();
      };
      // Patch overview reset into ref
      const intervalSync = window.setInterval(() => {
        if (onPosUpdateRef.current) {
          onPosUpdateRef.current(simRef.current.shrekPos);
          setFallbackPos({ ...simRef.current.shrekPos });
        }
      }, 450);

      // Watch for overview request via custom property check
      let lastMode = simRef.current.cameraMode;
      const modeWatcher = window.setInterval(() => {
        if (simRef.current.cameraMode === 'overview' && lastMode !== 'overview') {
          // Only snap if triggered by button (when controls aren't being dragged)
        }
        lastMode = simRef.current.cameraMode;
      }, 150);
      void origReset;

      frameId = requestAnimationFrame(tick);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        clearInterval(intervalSync);
        clearInterval(modeWatcher);
        resizeObserver.disconnect();
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', clearKeys);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }, [webglFailed]);

    // Handle Vista General camera move smoothly via imperative method override
    useEffect(() => {
      // Keep fallback pos synced on low-performance 2D fallback
    }, []);

    if (webglFailed) {
      return (
        <Fallback2DBoard
          stations={stations}
          visitedIds={visitedIds}
          activeStationId={activeStationId}
          shrekPos={fallbackPos}
          atmosphere={atmosphere}
          onSelectStation={onSelectStationLabel}
        />
      );
    }

    return (
      <div className="relative w-full h-full overflow-hidden">
        <div
          ref={mountRef}
          data-testid="three-world-canvas"
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Projected accessible 3D station labels (scoped inside WorldCanvas so adaptive panels never overlap) */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {stations.map((station) => {
            const visited = visitedIds.includes(station.id);
            const active = activeStationId === station.id;
            return (
              <button
                key={station.id}
                ref={(el) => {
                  labelRefs.current[station.id] = el;
                }}
                type="button"
                onClick={() => {
                  soundEngine.unlockAudio();
                  onSelectStationLabel(station.id);
                }}
                style={{ left: 0, top: 0, opacity: 0 }}
                className={`absolute px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap border shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 ${
                  active
                    ? 'bg-[#b77c1f] text-white border-[#ffe49e]'
                    : visited
                      ? 'bg-[#1f4f38]/95 text-[#f7ebd2] border-[#d6ab4d]/70 hover:bg-[#276346]'
                      : 'bg-[#f6ebd4]/95 text-[#2b1c10] border-[#8c6838]/70 hover:bg-[#fff6e3]'
                }`}
              >
                <span className="tabular-nums">{station.canvasOrder}.</span>{' '}
                {station.modalTitle.replace(/^\d+\.\s*/, '')}
              </button>
            );
          })}

          {/* Unobtrusive 3D floating speaker indicator over active character */}
          <div
            ref={speakerBubbleRef}
            aria-hidden="true"
            style={{ left: 0, top: 0, opacity: 0 }}
            className="absolute px-2.5 py-1 rounded-full bg-[#2b1c0e]/90 text-[#ffe8ad] border border-[#e3b84b]/80 shadow-lg text-[11px] font-bold tracking-wide whitespace-nowrap transition-opacity duration-200 flex items-center gap-1.5"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{speakingLabel || 'Hablando'}</span>
          </div>
        </div>
      </div>
    );
  },
);

WorldCanvas.displayName = 'WorldCanvas';
