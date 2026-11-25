import * as THREE from 'three';
import { StoryStation } from '../types/story';
import { getGroundHeightAt, sampleStationSpline } from '../utils/storyLogic';
import {
  GENERATED_TEXTURES,
  createOakWoodTexture,
  createStoneBumpTexture,
  loadTileTexture,
} from './proceduralTextures';

export interface StationMarkerHandle {
  stationId: number;
  group: THREE.Group;
  beaconMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  hitTarget: THREE.Mesh;
}

export interface WorldHandles {
  worldRoot: THREE.Group;
  terrainMesh: THREE.Mesh;
  waterMesh: THREE.Mesh;
  stationMarkers: StationMarkerHandle[];
  torchLights: THREE.PointLight[];
  torchFlames: THREE.Mesh[];
  animatedTrees: THREE.Group;
  dragonWings: [THREE.Object3D, THREE.Object3D] | null;
  animatedBanners: THREE.Mesh[];
  lilyPads: THREE.Mesh[];
  fireflies: THREE.Points;
  clickables: THREE.Object3D[];
}

export function buildStorybookWorld(
  scene: THREE.Scene,
  stations: StoryStation[],
  maxAniso: number,
  isSoftwareGl: boolean,
): WorldHandles {
  const worldRoot = new THREE.Group();
  worldRoot.name = 'StorybookWorldRoot';
  scene.add(worldRoot);

  const oakTex = createOakWoodTexture(maxAniso);
  const stoneBump = createStoneBumpTexture(maxAniso);
  const parchmentTex = loadTileTexture(GENERATED_TEXTURES.parchmentTile, 2, 2, maxAniso);
  const cobbleTex = loadTileTexture(GENERATED_TEXTURES.cobbleTile, 18, 1.4, maxAniso);

  // 1. Dark oak tavern table beneath the open storybook
  const tableMat = new THREE.MeshStandardMaterial({
    map: oakTex,
    roughness: 0.82,
    metalness: 0.05,
  });
  const table = new THREE.Mesh(new THREE.BoxGeometry(84, 2.0, 60), tableMat);
  table.position.set(0, -2.35, 0);
  table.receiveShadow = true;
  worldRoot.add(table);

  // 2. Giant Open Medieval Storybook Base Framing the 3D World
  const bookGroup = new THREE.Group();
  bookGroup.name = 'OpenBookFrame';
  worldRoot.add(bookGroup);

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x263f2b,
    roughness: 0.65,
    metalness: 0.14,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xc99c3c,
    roughness: 0.28,
    metalness: 0.85,
  });
  const spineLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c211d,
    roughness: 0.62,
    metalness: 0.12,
  });
  const pageMat = new THREE.MeshStandardMaterial({
    map: parchmentTex,
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.02,
  });

  // Left & Right Leather Covers
  const leftCover = new THREE.Mesh(new THREE.BoxGeometry(25.2, 0.55, 31.6), leatherMat);
  leftCover.position.set(-12.7, -1.08, 0);
  leftCover.rotation.z = -0.02;
  leftCover.receiveShadow = true;

  const rightCover = new THREE.Mesh(new THREE.BoxGeometry(25.2, 0.55, 31.6), leatherMat);
  rightCover.position.set(12.7, -1.08, 0);
  rightCover.rotation.z = 0.02;
  rightCover.receiveShadow = true;

  // Spine binding in center
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 31.8, 16), spineLeatherMat);
  spine.rotation.x = Math.PI / 2;
  spine.position.set(0, -1.12, 0);

  // Gold corner clasps on book frame
  [
    [-25.0, -15.4],
    [-25.0, 15.4],
    [25.0, -15.4],
    [25.0, 15.4],
  ].forEach(([cx, cz]) => {
    const corner = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 1.4), goldTrimMat);
    corner.position.set(cx, -0.95, cz);
    bookGroup.add(corner);
  });

  // Stacked Parchment Page Blocks forming the elevated board bed
  const leftPageBlock = new THREE.Mesh(new THREE.BoxGeometry(23.6, 0.68, 29.4), pageMat);
  leftPageBlock.position.set(-11.9, -0.58, 0);
  leftPageBlock.receiveShadow = true;

  const rightPageBlock = new THREE.Mesh(new THREE.BoxGeometry(23.6, 0.68, 29.4), pageMat);
  rightPageBlock.position.set(11.9, -0.58, 0);
  rightPageBlock.receiveShadow = true;

  // Stepped Parchment Page Edges so the 3D world visibly rises from thick layered pages
  const pageRimMat = new THREE.MeshStandardMaterial({
    color: 0xe7d6b3,
    roughness: 0.9,
  });
  const leftPageStep = new THREE.Mesh(new THREE.BoxGeometry(24.1, 0.36, 30.0), pageRimMat);
  leftPageStep.position.set(-12.15, -0.78, 0);
  const rightPageStep = new THREE.Mesh(new THREE.BoxGeometry(24.1, 0.36, 30.0), pageRimMat);
  rightPageStep.position.set(12.15, -0.78, 0);

  // Red silk bookmark ribbon draping out of bottom spine
  const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x8f1f27, roughness: 0.6 });
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 4.4), ribbonMat);
  ribbon.position.set(0, -1.12, 16.5);
  ribbon.rotation.x = 0.14;

  bookGroup.add(
    leftCover,
    rightCover,
    spine,
    leftPageBlock,
    rightPageBlock,
    leftPageStep,
    rightPageStep,
    ribbon,
  );

  // 3. Sculpted 3D Terrain resting cleanly atop the open book pages (y offset >= -0.15)
  const terrainW = 45.0;
  const terrainD = 27.6;
  const terrainGeo = new THREE.PlaneGeometry(terrainW, terrainD, 76, 48);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const colorHelper = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const h = getGroundHeightAt(vx, vz);
    posAttr.setY(i, h);

    // Biome vertex tinting across the 8 realms
    if (vx < -9 && vz > 2.5) {
      // Swamp mossy olive-emerald
      colorHelper.setHex(0x4a6b35);
    } else if (vx < -6 && vz <= 2.5 && vz > -6) {
      // Duloc & Enchanted Forest vibrant meadow
      colorHelper.setHex(vx < -11 ? 0x628c45 : 0x457838);
    } else if (vx < -1 && vz <= -6) {
      // Fiona's rocky crag (slate/olive moss)
      colorHelper.setHex(0x555b52);
    } else if (vx >= -1 && vx < 10 && vz > 2) {
      // Far Far Away sunny golden meadow
      colorHelper.setHex(0x7ca34b);
    } else if (vx >= 8 && vz <= 4 && vz > -7.5) {
      // Villains dark slate-moss
      colorHelper.setHex(0x3f4940);
    } else if (vx >= 12 && vz <= -7.5) {
      // Final Destination luminous emerald
      colorHelper.setHex(0x6da649);
    } else {
      // Fairy Tale Forest rich green
      colorHelper.setHex(0x52883e);
    }

    // Subtle river bank sand tint
    const riverX = -4.5 + Math.sin(vz * 0.22) * 2.1;
    if (Math.abs(vx - riverX) < 2.2) {
      colorHelper.lerp(new THREE.Color(0x9b8b65), 0.52);
    }

    colors[i * 3] = colorHelper.r;
    colors[i * 3 + 1] = colorHelper.g;
    colors[i * 3 + 2] = colorHelper.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.02,
    bumpMap: stoneBump,
    bumpScale: 0.04,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  worldRoot.add(terrainMesh);

  // 4. Water Plane (Swamp Lagoon + Winding River)
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2c6e6a,
    roughness: 0.16,
    metalness: 0.35,
    transparent: true,
    opacity: 0.86,
  });
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(44.2, 27.0), waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -0.14;
  waterMesh.receiveShadow = true;
  worldRoot.add(waterMesh);

  // 5. Winding Cobblestone Adventure Path connecting all 10 stations
  const splinePoints = sampleStationSpline(stations, 16);
  const pathPoints3D = splinePoints.map(
    (p) => new THREE.Vector3(p.x, Math.max(-0.08, getGroundHeightAt(p.x, p.z)) + 0.06, p.z),
  );
  const pathCurve = new THREE.CatmullRomCurve3(pathPoints3D);
  const pathTubeGeo = new THREE.TubeGeometry(pathCurve, 140, 0.56, 6, false);
  pathTubeGeo.scale(1, 0.12, 1);
  const pathMat = new THREE.MeshStandardMaterial({
    map: cobbleTex,
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.04,
  });
  const pathMesh = new THREE.Mesh(pathTubeGeo, pathMat);
  pathMesh.receiveShadow = true;
  worldRoot.add(pathMesh);

  // Wooden Bridge across the river near (-4.5, -5.5) and Stone Bridge near (-4.0, 2.5)
  const buildBridge = (bx: number, bz: number, rotY: number, isStone: boolean) => {
    const bridge = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: isStone ? 0x8f8a82 : 0x6e4726,
      roughness: 0.84,
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.24, 1.85), mat);
    deck.position.y = 0.42;
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridge.add(deck);
    [-0.82, 0.82].forEach((rz) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 0.12), mat);
      rail.position.set(0, 0.76, rz);
      bridge.add(rail);
      [-1.4, 0, 1.4].forEach((px) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.54, 8), mat);
        post.position.set(px, 0.58, rz);
        bridge.add(post);
      });
    });
    bridge.position.set(bx, -0.02, bz);
    bridge.rotation.y = rotY;
    worldRoot.add(bridge);
  };
  buildBridge(-3.8, -4.4, -0.65, true);
  buildBridge(-5.2, 5.2, 0.4, false);

  // 6. Realm Landmarks (Composite 4-12 Part Groups)
  const torchLights: THREE.PointLight[] = [];
  const torchFlames: THREE.Mesh[] = [];
  const animatedBanners: THREE.Mesh[] = [];
  const lilyPads: THREE.Mesh[] = [];
  let dragonWings: [THREE.Object3D, THREE.Object3D] | null = null;
  const animatedTrees = new THREE.Group();
  worldRoot.add(animatedTrees);

  // Swamp Lily Pads floating near Shrek's lagoon and river bends
  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x3f7d3a, roughness: 0.72 });
  [
    [-14.6, 10.6],
    [-13.8, 11.4],
    [-4.8, 7.6],
    [-4.2, -1.8],
  ].forEach(([lx, lz]) => {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.04, 12), lilyMat);
    pad.position.set(lx, -0.11, lz);
    worldRoot.add(pad);
    lilyPads.push(pad);
  });

  const addBanner = (parent: THREE.Group, bx: number, by: number, bz: number, colorHex: number) => {
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.4),
      new THREE.MeshStandardMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        roughness: 0.55,
      }),
    );
    banner.position.set(bx, by, bz);
    parent.add(banner);
    animatedBanners.push(banner);
  };

  const addTorch = (tx: number, tz: number, withLight: boolean) => {
    const ty = getGroundHeightAt(tx, tz);
    const torch = new THREE.Group();
    torch.position.set(tx, ty, tz);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 1.25, 8),
      new THREE.MeshStandardMaterial({ color: 0x3b291d, roughness: 0.85 }),
    );
    pole.position.y = 0.62;
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.08, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x383a3e, metalness: 0.7, roughness: 0.35 }),
    );
    cup.position.y = 1.28;
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffaa33,
      emissive: 0xff6a00,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 8), flameMat);
    flame.position.y = 1.48;
    torch.add(pole, cup, flame);
    torchFlames.push(flame);

    if (withLight && torchLights.length < 5) {
      const pl = new THREE.PointLight(0xff8c2b, 1.2, 10, 1.6);
      pl.position.set(0, 1.65, 0);
      torch.add(pl);
      torchLights.push(pl);
    }
    worldRoot.add(torch);
  };

  // REALM 1: El Pantano de Shrek (-19.8, 11.2) — positioned cleanly behind Station 1
  {
    const swampX = -19.8;
    const swampZ = 11.2;
    const sy = getGroundHeightAt(swampX, swampZ);
    const hut = new THREE.Group();
    hut.position.set(swampX, sy, swampZ);
    const mudMat = new THREE.MeshStandardMaterial({ color: 0x6b533b, roughness: 0.92 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0x3d5c2b, roughness: 0.95 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x52341e, roughness: 0.85 });

    const trunkBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.55, 1.8, 12), mudMat);
    trunkBase.position.y = 0.9;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.4, 12), thatchMat);
    roof.position.y = 2.4;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.0, 0.2), woodMat);
    door.position.set(0.85, 0.5, 0.85);
    door.rotation.y = Math.PI / 4;
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.1, 8), mudMat);
    chimney.position.set(-0.5, 2.75, -0.3);
    // Outhouse & Warning sign
    const outhouse = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.15, 0.7), woodMat);
    outhouse.position.set(2.3, 0.58, 0.9);
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), woodMat);
    signPost.position.set(2.6, 0.45, -1.2);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.42, 0.08), woodMat);
    signBoard.position.set(2.6, 0.85, -1.2);
    signBoard.rotation.z = -0.08;
    hut.add(trunkBase, roof, door, chimney, outhouse, signPost, signBoard);
    hut.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) m.castShadow = true;
    });
    worldRoot.add(hut);
    addTorch(-15.5, 9.8, true);
  }

  // REALM 3: El Reino de Duloc (-16.8, -5.6)
  {
    const dx = -16.8;
    const dz = -5.6;
    const dy = getGroundHeightAt(dx, dz);
    const duloc = new THREE.Group();
    duloc.position.set(dx, dy, dz);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xede8dc, roughness: 0.65 });
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x264b8c, roughness: 0.42, metalness: 0.2 });
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x2c6e37, roughness: 0.88 });

    const keep = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.0), wallMat);
    keep.position.y = 1.1;
    const centralTower = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.72, 3.6, 14), wallMat);
    centralTower.position.y = 1.8;
    const centralRoof = new THREE.Mesh(new THREE.ConeGeometry(0.86, 1.4, 14), spireMat);
    centralRoof.position.y = 4.3;
    addBanner(duloc, 0.35, 5.1, 0, 0xd4a438);

    [-1.25, 1.25].forEach((tx) => {
      const sideTower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 2.5, 12), wallMat);
      sideTower.position.set(tx, 1.25, 0.85);
      const sideRoof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.95, 12), spireMat);
      sideRoof.position.set(tx, 2.95, 0.85);
      const topiary = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), hedgeMat);
      topiary.position.set(tx * 1.1, 0.36, 1.85);
      duloc.add(sideTower, sideRoof, topiary);
    });
    duloc.add(keep, centralTower, centralRoof);
    duloc.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) m.castShadow = true;
    });
    worldRoot.add(duloc);
    addTorch(-12.2, -4.8, true);
  }

  // REALM 4: El Castillo de Fiona + Dragon Guardian (-6.8, -11.2)
  {
    const fx = -6.8;
    const fz = -11.2;
    const fy = getGroundHeightAt(fx, fz);
    const castle = new THREE.Group();
    castle.position.set(fx, fy, fz);
    const basaltMat = new THREE.MeshStandardMaterial({ color: 0x52525c, roughness: 0.88 });
    const slateRoof = new THREE.MeshStandardMaterial({ color: 0x3b2833, roughness: 0.65 });
    const dragonMat = new THREE.MeshStandardMaterial({ color: 0xa12632, roughness: 0.45, metalness: 0.15 });

    const baseKeep = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 2.2), basaltMat);
    baseKeep.position.y = 1.2;
    const highTower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.72, 4.2, 12), basaltMat);
    highTower.position.set(-0.6, 2.1, -0.3);
    const highRoof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.3, 12), slateRoof);
    highRoof.position.set(-0.6, 4.8, -0.3);
    // Dragon silhouette perched on keep with articulated wings
    const dragonBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.65, 6, 10), dragonMat);
    dragonBody.position.set(0.85, 2.7, 0.3);
    dragonBody.rotation.z = -0.35;
    const wingPivotL = new THREE.Group();
    wingPivotL.position.set(0.75, 2.95, 0.25);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.62), dragonMat);
    wingL.position.set(-0.48, 0.08, 0);
    wingPivotL.add(wingL);

    const wingPivotR = new THREE.Group();
    wingPivotR.position.set(0.95, 2.95, 0.25);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.62), dragonMat);
    wingR.position.set(0.48, 0.08, 0);
    wingPivotR.add(wingR);

    dragonWings = [wingPivotL, wingPivotR];
    castle.add(baseKeep, highTower, highRoof, dragonBody, wingPivotL, wingPivotR);
    castle.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) m.castShadow = true;
    });
    worldRoot.add(castle);
    addTorch(-5.0, -8.5, true);
  }

  // REALM 5: Bosque de los Cuentos de Hadas (-0.8, -4.6)
  {
    const hx = -0.6;
    const hz = -4.6;
    const hy = getGroundHeightAt(hx, hz);
    const fairyVillage = new THREE.Group();
    fairyVillage.position.set(hx, hy, hz);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xf1e5cc, roughness: 0.82 });
    const capRedMat = new THREE.MeshStandardMaterial({ color: 0xc23c3c, roughness: 0.55 });
    const wellStone = new THREE.MeshStandardMaterial({ color: 0x86827c, roughness: 0.85 });

    [
      [-1.0, 0.0, 1.0],
      [1.2, 0.6, 0.72],
    ].forEach(([mx, mz, sc]) => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * sc, 0.42 * sc, 0.95 * sc, 12), stemMat);
      stem.position.set(mx, 0.47 * sc, mz);
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.72 * sc, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
        capRedMat,
      );
      cap.position.set(mx, 0.92 * sc, mz);
      fairyVillage.add(stem, cap);
    });
    const well = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.55, 12), wellStone);
    well.position.set(0.1, 0.28, -1.1);
    fairyVillage.add(well);
    worldRoot.add(fairyVillage);
  }

  // REALM 6: Muy Muy Lejano Royal Palace (5.8, 10.2)
  {
    const px = 5.8;
    const pz = 10.4;
    const py = getGroundHeightAt(px, pz);
    const palace = new THREE.Group();
    palace.position.set(px, py, pz);
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.45, metalness: 0.06 });
    const goldSpireMat = new THREE.MeshStandardMaterial({ color: 0xdba93b, roughness: 0.24, metalness: 0.88 });
    const turquoiseMat = new THREE.MeshStandardMaterial({ color: 0x3b7a8c, roughness: 0.45 });

    const hall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.1, 2.1), marbleMat);
    hall.position.y = 1.05;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 12), goldSpireMat);
    dome.position.y = 2.4;
    const needle = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 12), goldSpireMat);
    needle.position.y = 3.8;
    addBanner(palace, 0.35, 4.85, 0, 0x3b7a8c);
    [-1.4, 1.4].forEach((tx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 2.8, 12), marbleMat);
      col.position.set(tx, 1.4, 0.7);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 12), turquoiseMat);
      top.position.set(tx, 3.3, 0.7);
      palace.add(col, top);
    });
    palace.add(hall, dome, needle);
    palace.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) m.castShadow = true;
    });
    worldRoot.add(palace);
  }

  // REALM 7: Reino de los Villanos (16.8, 4.2)
  {
    const vx = 16.8;
    const vz = 4.2;
    const vy = getGroundHeightAt(vx, vz);
    const fortress = new THREE.Group();
    fortress.position.set(vx, vy, vz);
    const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x2e2b36, roughness: 0.68, metalness: 0.2 });
    const tavernMat = new THREE.MeshStandardMaterial({ color: 0x5c3c28, roughness: 0.86 });
    const purpleRoof = new THREE.MeshStandardMaterial({ color: 0x4b244a, roughness: 0.55 });

    const spire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, 4.0, 8), obsidianMat);
    spire1.position.y = 2.0;
    const tip1 = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.6, 8), purpleRoof);
    tip1.position.y = 4.75;
    const tavern = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.35, 1.4), tavernMat);
    tavern.position.set(-1.3, 0.68, 1.1);
    tavern.rotation.y = 0.25;
    const tavernRoof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.9, 4), purpleRoof);
    tavernRoof.position.set(-1.3, 1.75, 1.1);
    tavernRoof.rotation.y = Math.PI / 4 + 0.25;
    fortress.add(spire1, tip1, tavern, tavernRoof);
    fortress.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) m.castShadow = true;
    });
    worldRoot.add(fortress);
    addTorch(13.2, 1.8, true);
  }

  // REALM 8: Destino Final Golden Pavilion (19.6, -10.8)
  {
    const gx = 19.6;
    const gz = -10.8;
    const gy = getGroundHeightAt(gx, gz);
    const gazebo = new THREE.Group();
    gazebo.position.set(gx, gy, gz);
    const ivoryMat = new THREE.MeshStandardMaterial({ color: 0xf7efe0, roughness: 0.45 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe3b33e, roughness: 0.25, metalness: 0.85 });

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.95, 0.35, 16), ivoryMat);
    dais.position.y = 0.18;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.9, 10), ivoryMat);
      pillar.position.set(Math.cos(angle) * 1.35, 1.2, Math.sin(angle) * 1.35);
      gazebo.add(pillar);
    }
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.85, 1.25, 16), goldMat);
    canopy.position.y = 2.7;
    gazebo.add(dais, canopy);
    gazebo.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) m.castShadow = true;
    });
    worldRoot.add(gazebo);
    addTorch(16.2, -9.2, true);
  }

  // 7. Instanced Fairytale Trees & Boulders framing the world naturally
  const treeCount = 46;
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.24, 1.35, 7);
  const crownGeo = new THREE.DodecahedronGeometry(0.85, 1);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x593d28, roughness: 0.9 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
  trunkInst.castShadow = !isSoftwareGl;
  crownInst.castShadow = !isSoftwareGl;

  const dummy = new THREE.Object3D();
  const treeTint = new THREE.Color();
  const treeSpots: Array<[number, number, number]> = [
    [-20.5, 6.2, 0x2c5c29],
    [-19.8, 1.5, 0x356930],
    [-20.2, -2.5, 0x3a6e34],
    [-19.6, -9.8, 0x2b592c],
    [-15.2, 11.4, 0x274f24],
    [-11.2, 10.8, 0x34642e],
    [-14.5, 1.2, 0x3a6f35],
    [-9.5, 6.5, 0x3d7236],
    [-9.2, -1.5, 0x2e612b],
    [-10.8, -9.8, 0x3b593c],
    [-3.2, -10.8, 0x32572e],
    [-2.2, 10.6, 0x427538],
    [0.8, 2.5, 0x477d3c],
    [1.8, -9.8, 0x346431],
    [4.5, -1.5, 0x3c7335],
    [7.2, -9.2, 0x356430],
    [10.2, 11.2, 0x497e3e],
    [13.8, 10.5, 0x447339],
    [19.2, 9.2, 0x396131],
    [19.8, 0.2, 0x2b392e],
    [19.5, -4.8, 0x2f4033],
    [14.2, -11.4, 0x3f7539],
  ];

  for (let i = 0; i < treeCount; i++) {
    const base = treeSpots[i % treeSpots.length];
    const jitterX = (Math.sin(i * 17.3) * 0.5) * 2.4;
    const jitterZ = (Math.cos(i * 23.1) * 0.5) * 2.2;
    const tx = THREE.MathUtils.clamp(base[0] + jitterX, -21.2, 21.2);
    const tz = THREE.MathUtils.clamp(base[1] + jitterZ, -12.2, 12.2);
    const ty = getGroundHeightAt(tx, tz);
    const sc = 0.78 + ((i * 37) % 10) * 0.04;

    dummy.position.set(tx, ty + 0.65 * sc, tz);
    dummy.rotation.set(0, (i * 1.1) % Math.PI, 0);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx, ty + 1.55 * sc, tz);
    dummy.scale.set(sc * 1.05, sc * 1.18, sc * 1.05);
    dummy.updateMatrix();
    crownInst.setMatrixAt(i, dummy.matrix);

    treeTint.setHex(base[2]);
    crownInst.setColorAt(i, treeTint);
  }
  trunkInst.instanceMatrix.needsUpdate = true;
  crownInst.instanceMatrix.needsUpdate = true;
  if (crownInst.instanceColor) crownInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();
  animatedTrees.add(trunkInst, crownInst);

  // 8. 10 Interactive Story Canvas Station Pedestals
  const stationMarkers: StationMarkerHandle[] = [];
  const clickables: THREE.Object3D[] = [];

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0xc9bfa8,
    roughness: 0.72,
    metalness: 0.08,
  });

  stations.forEach((station) => {
    const sx = station.worldPosition.x;
    const sz = station.worldPosition.z;
    const sy = Math.max(-0.08, getGroundHeightAt(sx, sz));

    const markerGroup = new THREE.Group();
    markerGroup.position.set(sx, sy, sz);
    markerGroup.name = `StationMarker_${station.id}`;

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.92, 0.24, 16), plinthMat);
    plinth.position.y = 0.12;
    plinth.receiveShadow = true;

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x3b8c6e,
      emissive: 0x164a37,
      emissiveIntensity: 0.7,
      roughness: 0.35,
      metalness: 0.55,
    });
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.055, 8, 24), ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.26;

    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x52c48c,
      emissive: 0x208056,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.35,
    });
    const beaconMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), beaconMat);
    beaconMesh.position.y = 1.15;
    beaconMesh.castShadow = true;

    // Invisible larger raycast cylinder on layer 1 for effortless clicking/tapping
    const hitTarget = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 2.2, 10),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitTarget.position.y = 1.0;
    hitTarget.userData = { stationId: station.id };
    hitTarget.layers.enable(1);
    clickables.push(hitTarget);

    markerGroup.add(plinth, ringMesh, beaconMesh, hitTarget);
    worldRoot.add(markerGroup);

    stationMarkers.push({
      stationId: station.id,
      group: markerGroup,
      beaconMesh,
      ringMesh,
      hitTarget,
    });
  });

  // 9. Magic Floating Firefly / Dust Particles
  const particleCount = 120;
  const pPos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 42;
    pPos[i * 3 + 1] = 0.6 + Math.random() * 4.2;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 26;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xffe48f,
    size: 0.22,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const fireflies = new THREE.Points(particleGeo, particleMat);
  worldRoot.add(fireflies);

  return {
    worldRoot,
    terrainMesh,
    waterMesh,
    stationMarkers,
    torchLights,
    torchFlames,
    animatedTrees,
    dragonWings,
    animatedBanners,
    lilyPads,
    fireflies,
    clickables,
  };
}
