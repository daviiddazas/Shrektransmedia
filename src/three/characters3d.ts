import * as THREE from 'three';
import { CharacterId } from '../types/story';

export interface ShrekRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Group;
  leftEar: THREE.Group;
  rightEar: THREE.Group;
  shadowDisc: THREE.Mesh;
}

export interface CompanionRig {
  characterId: CharacterId;
  root: THREE.Group;
  bodyGroup: THREE.Group;
  head: THREE.Group;
  leftArm?: THREE.Group;
  rightArm?: THREE.Group;
  leftEar?: THREE.Group;
  rightEar?: THREE.Group;
  leftWing?: THREE.Group;
  rightWing?: THREE.Group;
  tail?: THREE.Group;
  cape?: THREE.Group;
  shadowDisc: THREE.Mesh;
}

function createContactShadow(
  radius: number,
  shadowTexture?: THREE.Texture,
  opacity = 0.68,
): THREE.Mesh {
  const mat = shadowTexture
    ? new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
        opacity,
      })
    : new THREE.MeshBasicMaterial({
        color: 0x16120c,
        transparent: true,
        depthWrite: false,
        opacity: opacity * 0.4,
      });

  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 22), mat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.025;
  return disc;
}

function addExpressiveEyes(
  head: THREE.Group,
  options: {
    xOffset: number;
    yOffset: number;
    zOffset: number;
    eyeRadius: number;
    pupilRadius: number;
    irisColor?: number;
    browColor?: number;
    browAngle?: number;
    browY?: number;
    lashColor?: number;
    catchlight?: boolean;
  },
): void {
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf9f8f3, roughness: 0.18 });
  const irisMat = new THREE.MeshStandardMaterial({
    color: options.irisColor ?? 0x3b2414,
    roughness: 0.14,
  });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x120d0a, roughness: 0.1 });

  ([-1, 1] as const).forEach((side) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(options.eyeRadius, 12, 10),
      whiteMat,
    );
    eye.position.set(side * options.xOffset, options.yOffset, options.zOffset);
    head.add(eye);

    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(options.pupilRadius * 1.15, 10, 8),
      irisMat,
    );
    iris.position.set(
      side * options.xOffset,
      options.yOffset,
      options.zOffset + options.eyeRadius * 0.62,
    );
    head.add(iris);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(options.pupilRadius * 0.78, 8, 8),
      pupilMat,
    );
    pupil.position.set(
      side * options.xOffset,
      options.yOffset,
      options.zOffset + options.eyeRadius * 0.85,
    );
    head.add(pupil);

    if (options.catchlight) {
      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(options.pupilRadius * 0.28, 6, 6),
        whiteMat,
      );
      glint.position.set(
        side * options.xOffset + options.pupilRadius * 0.25,
        options.yOffset + options.pupilRadius * 0.25,
        options.zOffset + options.eyeRadius * 1.02,
      );
      head.add(glint);
    }

    if (options.browColor !== undefined) {
      const browMat = new THREE.MeshStandardMaterial({
        color: options.browColor,
        roughness: 0.72,
      });
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(options.eyeRadius * 2.1, options.eyeRadius * 0.55, 0.03),
        browMat,
      );
      brow.position.set(
        side * options.xOffset,
        options.browY ?? options.yOffset + options.eyeRadius * 1.5,
        options.zOffset + options.eyeRadius * 0.45,
      );
      brow.rotation.z = side * (options.browAngle ?? 0.12);
      head.add(brow);
    }
  });
}

export function createShrekHero(shadowTexture?: THREE.Texture): ShrekRig {
  const root = new THREE.Group();
  root.name = 'ShrekHero';

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x6fa63b,
    roughness: 0.6,
    metalness: 0.04,
  });
  const tunicMat = new THREE.MeshStandardMaterial({
    color: 0xe6dcc2,
    roughness: 0.85,
    metalness: 0.02,
  });
  const vestMat = new THREE.MeshStandardMaterial({
    color: 0x4b3120,
    roughness: 0.78,
    metalness: 0.08,
  });
  const trousersMat = new THREE.MeshStandardMaterial({
    color: 0x5c4734,
    roughness: 0.85,
  });
  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x2b1a10,
    roughness: 0.45,
    metalness: 0.25,
  });
  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0xd4a438,
    roughness: 0.25,
    metalness: 0.85,
  });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5ee,
    roughness: 0.2,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x3a2414,
    roughness: 0.15,
  });

  // Legs (articulated at hip)
  const makeLeg = (xOffset: number): THREE.Group => {
    const leg = new THREE.Group();
    leg.position.set(xOffset, 0.52, 0);
    const thigh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.24, 6, 10),
      trousersMat,
    );
    thigh.position.y = -0.18;
    thigh.castShadow = true;
    leg.add(thigh);

    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.18, 0.34),
      beltMat,
    );
    boot.position.set(0, -0.42, 0.05);
    boot.castShadow = true;
    leg.add(boot);
    return leg;
  };

  const leftLeg = makeLeg(-0.2);
  const rightLeg = makeLeg(0.2);
  bodyGroup.add(leftLeg, rightLeg);

  // Torso (broad ogre silhouette)
  const torso = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 18, 14),
    tunicMat,
  );
  torso.scale.set(1.06, 1.18, 0.88);
  torso.position.y = 0.96;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Dark leather vest panels + chest lacing
  const vest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.46, 0.62, 16, 1, true, -0.35, Math.PI * 1.55),
    vestMat,
  );
  vest.position.y = 0.98;
  vest.rotation.y = Math.PI * 0.22;
  vest.castShadow = true;
  bodyGroup.add(vest);

  for (let i = 0; i < 3; i++) {
    const lace = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.025, 0.04),
      beltMat,
    );
    lace.position.set(0, 0.88 + i * 0.12, 0.41);
    bodyGroup.add(lace);
  }

  // Belt + gold buckle
  const belt = new THREE.Mesh(
    new THREE.TorusGeometry(0.43, 0.06, 8, 22),
    beltMat,
  );
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.68;
  bodyGroup.add(belt);

  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.11, 0.07),
    buckleMat,
  );
  buckle.position.set(0, 0.68, 0.44);
  bodyGroup.add(buckle);

  // Arms (articulated at shoulders)
  const makeArm = (side: -1 | 1): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.49, 1.2, 0);
    const sleeve = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.32, 6, 10),
      tunicMat,
    );
    sleeve.position.y = -0.22;
    sleeve.rotation.z = side * 0.16;
    sleeve.castShadow = true;
    arm.add(sleeve);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 10),
      skinMat,
    );
    hand.position.set(side * 0.06, -0.44, 0.04);
    hand.castShadow = true;
    arm.add(hand);
    return arm;
  };

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  bodyGroup.add(leftArm, rightArm);

  // Head + iconic trumpet ears + nose + expressive eyes & brow
  const head = new THREE.Group();
  head.position.set(0, 1.64, 0.03);
  bodyGroup.add(head);

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 18, 16),
    skinMat,
  );
  cranium.scale.set(1.05, 1.08, 0.98);
  cranium.castShadow = true;
  head.add(cranium);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.098, 12, 10),
    skinMat,
  );
  nose.scale.set(1.2, 0.85, 1.12);
  nose.position.set(0, -0.02, 0.31);
  head.add(nose);

  const browMat = new THREE.MeshStandardMaterial({ color: 0x55822a, roughness: 0.7 });
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.045, 0.08), browMat);
  brow.position.set(0, 0.14, 0.27);
  head.add(brow);

  const grin = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.02, 6, 12, Math.PI),
    beltMat,
  );
  grin.rotation.z = Math.PI;
  grin.position.set(0, -0.13, 0.28);
  head.add(grin);

  const makeEye = (side: -1 | 1) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), eyeWhiteMat);
    eye.position.set(side * 0.12, 0.07, 0.27);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), pupilMat);
    pupil.position.set(side * 0.12, 0.07, 0.315);
    head.add(eye, pupil);
  };
  makeEye(-1);
  makeEye(1);

  const makeEar = (side: -1 | 1): THREE.Group => {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.3, 0.13, -0.02);
    earGroup.rotation.z = -side * 0.72;
    earGroup.rotation.y = side * 0.15;

    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.035, 0.21, 10),
      skinMat,
    );
    stalk.position.y = 0.095;
    const bell = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.11, 12, 1, true),
      skinMat,
    );
    bell.position.y = 0.21;
    bell.rotation.x = Math.PI;
    earGroup.add(stalk, bell);
    head.add(earGroup);
    return earGroup;
  };
  const leftEar = makeEar(-1);
  const rightEar = makeEar(1);

  const shadowDisc = createContactShadow(0.66, shadowTexture, 0.75);
  root.add(shadowDisc);

  return {
    root,
    bodyGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    leftEar,
    rightEar,
    shadowDisc,
  };
}

export function animateShrekRig(
  rig: ShrekRig,
  gaitPhase: number,
  isMoving: boolean,
  celebratingTimer: number,
  elapsedTime: number,
  dt: number,
  isConversing = false,
): void {
  if (celebratingTimer > 0) {
    const jump = Math.abs(Math.sin(elapsedTime * 9)) * 0.4;
    rig.bodyGroup.position.y = THREE.MathUtils.damp(rig.bodyGroup.position.y, jump, 14, dt);
    rig.leftArm.rotation.z = THREE.MathUtils.damp(rig.leftArm.rotation.z, -2.25, 12, dt);
    rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, 2.25, 12, dt);
    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, 0.22, 10, dt);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, -0.22, 10, dt);
    rig.head.rotation.y = Math.sin(elapsedTime * 5.5) * 0.26;
    rig.leftEar.rotation.z = 0.72 + Math.sin(elapsedTime * 14) * 0.2;
    rig.rightEar.rotation.z = -0.72 - Math.sin(elapsedTime * 14) * 0.2;
    rig.bodyGroup.scale.set(1.05, 0.95 + jump * 0.28, 1.05);
    return;
  }

  if (isMoving) {
    const swing = Math.sin(gaitPhase) * 0.65;
    const bounce = Math.abs(Math.cos(gaitPhase)) * 0.11;
    rig.leftLeg.rotation.x = swing;
    rig.rightLeg.rotation.x = -swing;
    rig.leftArm.rotation.x = -swing * 0.78;
    rig.rightArm.rotation.x = swing * 0.78;
    rig.leftArm.rotation.z = THREE.MathUtils.damp(rig.leftArm.rotation.z, -0.1, 10, dt);
    rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, 0.1, 10, dt);
    rig.bodyGroup.position.y = bounce;
    rig.head.rotation.z = Math.sin(gaitPhase) * 0.07;
    rig.head.rotation.y = THREE.MathUtils.damp(rig.head.rotation.y, 0, 10, dt);
    rig.leftEar.rotation.z = 0.72 + Math.sin(gaitPhase * 2) * 0.09;
    rig.rightEar.rotation.z = -0.72 - Math.sin(gaitPhase * 2) * 0.09;
    rig.bodyGroup.scale.set(
      1 + bounce * 0.32,
      1 - bounce * 0.26,
      1 + bounce * 0.32,
    );
  } else if (isConversing) {
    // Expressive conversational gestures & attentive nodding while talking
    const bob = Math.abs(Math.sin(elapsedTime * 3.1)) * 0.04;
    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, 0, 10, dt);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, 0, 10, dt);
    rig.leftArm.rotation.x = THREE.MathUtils.damp(
      rig.leftArm.rotation.x,
      -0.38 + Math.sin(elapsedTime * 3.8) * 0.24,
      10,
      dt,
    );
    rig.rightArm.rotation.x = THREE.MathUtils.damp(
      rig.rightArm.rotation.x,
      -0.45 + Math.cos(elapsedTime * 4.3) * 0.28,
      10,
      dt,
    );
    rig.leftArm.rotation.z = THREE.MathUtils.damp(
      rig.leftArm.rotation.z,
      -0.18 - Math.abs(Math.sin(elapsedTime * 2.4)) * 0.14,
      10,
      dt,
    );
    rig.rightArm.rotation.z = THREE.MathUtils.damp(
      rig.rightArm.rotation.z,
      0.18 + Math.abs(Math.cos(elapsedTime * 2.4)) * 0.14,
      10,
      dt,
    );
    rig.bodyGroup.position.y = THREE.MathUtils.damp(rig.bodyGroup.position.y, bob, 10, dt);
    rig.head.rotation.x = Math.sin(elapsedTime * 4.6) * 0.08;
    rig.head.rotation.y = Math.sin(elapsedTime * 1.8) * 0.12;
    rig.head.rotation.z = Math.sin(elapsedTime * 2.5) * 0.05;
    rig.leftEar.rotation.z = 0.72 + Math.sin(elapsedTime * 6.5) * 0.1;
    rig.rightEar.rotation.z = -0.72 - Math.sin(elapsedTime * 6.5) * 0.1;
    rig.bodyGroup.scale.set(1, 1 + bob * 0.3, 1);
  } else {
    // Calm idle breathing + playful ear twitch
    const breath = Math.sin(elapsedTime * 2.2) * 0.025;
    const twitch = Math.sin(elapsedTime * 3.1) > 0.92 ? Math.sin(elapsedTime * 18) * 0.12 : 0;
    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, 0, 10, dt);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, 0, 10, dt);
    rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, 0, 10, dt);
    rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, 0, 10, dt);
    rig.leftArm.rotation.z = THREE.MathUtils.damp(rig.leftArm.rotation.z, -0.05, 10, dt);
    rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, 0.05, 10, dt);
    rig.bodyGroup.position.y = THREE.MathUtils.damp(rig.bodyGroup.position.y, breath, 8, dt);
    rig.head.rotation.x = THREE.MathUtils.damp(rig.head.rotation.x, 0, 8, dt);
    rig.head.rotation.y = Math.sin(elapsedTime * 0.9) * 0.16;
    rig.head.rotation.z = THREE.MathUtils.damp(rig.head.rotation.z, 0, 8, dt);
    rig.leftEar.rotation.z = 0.72 + twitch;
    rig.rightEar.rotation.z = -0.72 - twitch;
    rig.bodyGroup.scale.set(1, 1 + breath * 0.4, 1);
  }
}

function buildBurroRig(bodyGroup: THREE.Group, head: THREE.Group): Partial<CompanionRig> {
  const coatMat = new THREE.MeshStandardMaterial({ color: 0x8e867d, roughness: 0.82 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xded5c7, roughness: 0.8 });
  const muzzleMat = new THREE.MeshStandardMaterial({ color: 0xeae1d4, roughness: 0.7 });
  const maneMat = new THREE.MeshStandardMaterial({ color: 0x2b231e, roughness: 0.9 });
  const innerEarMat = new THREE.MeshStandardMaterial({ color: 0xd896a0, roughness: 0.72 });
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xfdfcf7, roughness: 0.2 });
  const hoofMat = new THREE.MeshStandardMaterial({ color: 0x221c18, roughness: 0.55 });

  // Torso + lighter chest/belly
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.5, 8, 12), coatMat);
  torso.rotation.x = Math.PI / 2;
  torso.position.y = 0.58;
  bodyGroup.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), bellyMat);
  belly.scale.set(0.95, 0.85, 1.45);
  belly.position.set(0, 0.51, 0.04);
  bodyGroup.add(belly);

  // Neck + tufted dark mane along crest
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.17, 0.42, 12), coatMat);
  neck.position.set(0, 0.82, 0.24);
  neck.rotation.x = 0.42;
  bodyGroup.add(neck);

  for (let i = 0; i < 4; i++) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.13, 6), maneMat);
    tuft.position.set(0, 0.78 + i * 0.09, 0.07 + i * 0.045);
    tuft.rotation.x = -0.7;
    bodyGroup.add(tuft);
  }

  // 4 articulated-look legs + hooves
  [
    [-0.14, 0.24],
    [0.14, 0.24],
    [-0.14, -0.22],
    [0.14, -0.22],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.46, 10), coatMat);
    leg.position.set(lx, 0.29, lz);
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.06, 0.09, 10), hoofMat);
    hoof.position.set(lx, 0.045, lz);
    bodyGroup.add(leg, hoof);
  });

  // Tail (pivoted at rump)
  const tail = new THREE.Group();
  tail.position.set(0, 0.62, -0.36);
  const tailStem = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.32, 8), coatMat);
  tailStem.position.set(0, -0.14, -0.06);
  tailStem.rotation.x = -0.45;
  const tailTuft = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 8), maneMat);
  tailTuft.position.set(0, -0.29, -0.14);
  tailTuft.rotation.x = 2.65;
  tail.add(tailStem, tailTuft);
  bodyGroup.add(tail);

  // Expressive Donkey Head (pivoted at neck top)
  head.position.set(0, 1.04, 0.37);
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12), coatMat);
  cranium.scale.set(0.95, 1.05, 1.1);
  head.add(cranium);

  const forelock = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 6), maneMat);
  forelock.position.set(0, 0.18, 0.08);
  forelock.rotation.x = 0.5;
  head.add(forelock);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), muzzleMat);
  muzzle.scale.set(0.96, 0.88, 1.24);
  muzzle.position.set(0, -0.05, 0.18);
  head.add(muzzle);

  // Nostrils + iconic Burro wide toothy smile!
  ([-1, 1] as const).forEach((s) => {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), maneMat);
    nostril.position.set(s * 0.05, -0.01, 0.33);
    head.add(nostril);
  });

  const mouthOpening = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.055, 0.05), maneMat);
  mouthOpening.position.set(0, -0.1, 0.29);
  const bigGrin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.036, 0.055), toothMat);
  bigGrin.position.set(0, -0.092, 0.305);
  head.add(mouthOpening, bigGrin);

  addExpressiveEyes(head, {
    xOffset: 0.088,
    yOffset: 0.075,
    zOffset: 0.14,
    eyeRadius: 0.052,
    pupilRadius: 0.028,
    irisColor: 0x5c3a1e,
    browColor: 0x5c544c,
    browAngle: -0.12,
    browY: 0.155,
    catchlight: true,
  });

  // Tall donkey ears with pink inner lining
  const makeEar = (side: -1 | 1): THREE.Group => {
    const ear = new THREE.Group();
    ear.position.set(side * 0.11, 0.15, -0.02);
    ear.rotation.z = -side * 0.22;
    ear.rotation.x = 0.08;
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.34, 10), coatMat);
    outer.position.y = 0.16;
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.24, 8), innerEarMat);
    inner.position.set(0, 0.15, 0.026);
    ear.add(outer, inner);
    head.add(ear);
    return ear;
  };

  return {
    leftEar: makeEar(-1),
    rightEar: makeEar(1),
    tail,
  };
}

function buildFionaRig(bodyGroup: THREE.Group, head: THREE.Group): Partial<CompanionRig> {
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x6fa63b, roughness: 0.58 });
  const gownMat = new THREE.MeshStandardMaterial({ color: 0x1e5c40, roughness: 0.68 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x2a7654, roughness: 0.65 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe0b241,
    roughness: 0.26,
    metalness: 0.78,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x99381d, roughness: 0.72 });
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xb84c49, roughness: 0.4 });

  // Flowing emerald medieval gown skirt + golden front panel trim
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.84, 16), gownMat);
  skirt.position.y = 0.43;
  bodyGroup.add(skirt);

  const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.76, 0.05), goldMat);
  frontTrim.position.set(0, 0.41, 0.2);
  frontTrim.rotation.x = -0.26;
  bodyGroup.add(frontTrim);

  // Fitted bodice + gold collar/belt
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.42, 14), gownMat);
  torso.position.y = 0.96;
  bodyGroup.add(torso);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 18), goldMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.81;
  bodyGroup.add(belt);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.14, 10), skinMat);
  neck.position.y = 1.21;
  bodyGroup.add(neck);

  // Articulated arms with puffed emerald shoulders + green hands
  const makeArm = (side: -1 | 1): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.23, 1.12, 0);
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), sleeveMat);
    puff.position.y = -0.04;
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.22, 6, 8), gownMat);
    forearm.position.set(side * 0.03, -0.22, 0.02);
    forearm.rotation.z = side * 0.18;
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.015, 6, 12), goldMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(side * 0.05, -0.34, 0.03);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), skinMat);
    hand.position.set(side * 0.06, -0.4, 0.04);
    arm.add(puff, forearm, cuff, hand);
    bodyGroup.add(arm);
    return arm;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  // Head + ogre face + trumpet ears + copper braid + royal tiara
  head.position.set(0, 1.38, 0.02);
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 14), skinMat);
  cranium.scale.set(1.02, 1.04, 0.96);
  head.add(cranium);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), skinMat);
  nose.scale.set(1.15, 0.85, 1.05);
  nose.position.set(0, -0.015, 0.2);
  head.add(nose);

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.065, 0.015, 6, 10, Math.PI),
    lipMat,
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.08, 0.185);
  head.add(smile);

  addExpressiveEyes(head, {
    xOffset: 0.08,
    yOffset: 0.045,
    zOffset: 0.175,
    eyeRadius: 0.042,
    pupilRadius: 0.022,
    irisColor: 0x3b6e35,
    browColor: 0x722815,
    browAngle: -0.1,
    browY: 0.105,
    catchlight: true,
  });

  // Copper hair crown + side bangs + long braided ponytail
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.222, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat,
  );
  hairCap.position.set(0, 0.03, -0.02);
  hairCap.rotation.x = -0.18;
  head.add(hairCap);

  ([-1, 1] as const).forEach((s) => {
    const bang = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), hairMat);
    bang.scale.set(0.85, 1.25, 0.75);
    bang.position.set(s * 0.12, 0.12, 0.12);
    head.add(bang);
  });

  const braid = new THREE.Group();
  braid.position.set(0, -0.06, -0.18);
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(new THREE.SphereGeometry(0.068 - i * 0.01, 10, 8), hairMat);
    seg.position.set(0, -i * 0.11, -i * 0.022);
    braid.add(seg);
  }
  const hairTie = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.014, 6, 12), goldMat);
  hairTie.rotation.x = Math.PI / 2;
  hairTie.position.set(0, -0.37, -0.075);
  braid.add(hairTie);
  head.add(braid);

  // Iconic Fiona trumpet ogre ears
  const makeEar = (side: -1 | 1): THREE.Group => {
    const ear = new THREE.Group();
    ear.position.set(side * 0.2, 0.05, -0.02);
    ear.rotation.z = -side * 0.78;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.022, 0.14, 8), skinMat);
    stalk.position.y = 0.065;
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.075, 10, 1, true), skinMat);
    bell.position.y = 0.14;
    bell.rotation.x = Math.PI;
    ear.add(stalk, bell);
    head.add(ear);
    return ear;
  };
  const leftEar = makeEar(-1);
  const rightEar = makeEar(1);

  // Royal golden crown with spire tips
  const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.025, 8, 18), goldMat);
  crownRing.rotation.x = Math.PI / 2;
  crownRing.position.y = 0.21;
  head.add(crownRing);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.085, 6), goldMat);
    point.position.set(Math.sin(a) * 0.13, 0.26, Math.cos(a) * 0.13);
    head.add(point);
  }

  return { leftArm, rightArm, leftEar, rightEar, tail: braid };
}

function buildGatoRig(bodyGroup: THREE.Group, head: THREE.Group): Partial<CompanionRig> {
  const furMat = new THREE.MeshStandardMaterial({ color: 0xda7d2a, roughness: 0.72 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf7ead2, roughness: 0.74 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x9b4814, roughness: 0.78 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x241a16, roughness: 0.52 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x201815, roughness: 0.62 });
  const featherMat = new THREE.MeshStandardMaterial({ color: 0xf0ca4d, roughness: 0.48 });
  const capeMat = new THREE.MeshStandardMaterial({
    color: 0x7b1b20,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xdcb03e,
    roughness: 0.25,
    metalness: 0.85,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xe1e8f0,
    metalness: 0.9,
    roughness: 0.18,
  });
  const pinkNoseMat = new THREE.MeshStandardMaterial({ color: 0xe88b92, roughness: 0.45 });

  // Tall musketeer boots + cuffs
  ([-1, 1] as const).forEach((s) => {
    const bootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.062, 0.26, 10), bootMat);
    bootShaft.position.set(s * 0.095, 0.15, 0);
    const bootCuff = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 6, 12), bootMat);
    bootCuff.rotation.x = Math.PI / 2;
    bootCuff.position.set(s * 0.095, 0.26, 0);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.18), bootMat);
    foot.position.set(s * 0.095, 0.04, 0.035);
    bodyGroup.add(bootShaft, bootCuff, foot);
  });

  // Compact agile feline torso + cream belly bib + leather belt + gold buckle
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.165, 0.22, 8, 12), furMat);
  torso.position.y = 0.45;
  bodyGroup.add(torso);

  const chestBib = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), creamMat);
  chestBib.scale.set(0.85, 1.1, 0.65);
  chestBib.position.set(0, 0.46, 0.1);
  bodyGroup.add(chestBib);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.028, 6, 16), bootMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.36;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.06, 0.04), goldMat);
  buckle.position.set(0, 0.36, 0.18);
  bodyGroup.add(belt, buckle);

  // Flowing crimson cape
  const cape = new THREE.Group();
  cape.position.set(0, 0.6, -0.12);
  const capeMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.52, 12, 1, true, -Math.PI * 0.42, Math.PI * 0.84),
    capeMat,
  );
  capeMesh.position.y = -0.25;
  capeMesh.rotation.y = Math.PI;
  cape.add(capeMesh);
  bodyGroup.add(cape);

  // Fluffy swishing cat tail
  const tail = new THREE.Group();
  tail.position.set(0, 0.34, -0.16);
  const tailBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.34, 6, 8), furMat);
  tailBase.position.set(0, 0.12, -0.14);
  tailBase.rotation.x = -0.95;
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), creamMat);
  tailTip.position.set(0, 0.26, -0.28);
  tail.add(tailBase, tailTip);
  bodyGroup.add(tail);

  // Arms + silver rapier sword in right paw!
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.2, 0.57, 0.02);
  const lLimb = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.18, 6, 8), furMat);
  lLimb.position.y = -0.11;
  lLimb.rotation.z = -0.18;
  const lPaw = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 8), creamMat);
  lPaw.position.set(-0.04, -0.22, 0.02);
  leftArm.add(lLimb, lPaw);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.2, 0.57, 0.02);
  const rLimb = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.18, 6, 8), furMat);
  rLimb.position.y = -0.11;
  rLimb.rotation.z = 0.25;
  const rPaw = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 8), creamMat);
  rPaw.position.set(0.05, -0.22, 0.04);
  const hilt = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), goldMat);
  hilt.position.set(0.06, -0.21, 0.09);
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.015, 0.46, 6), steelMat);
  blade.position.set(0.11, -0.05, 0.25);
  blade.rotation.x = Math.PI * 0.36;
  blade.rotation.z = -0.18;
  rightArm.add(rLimb, rPaw, hilt, blade);
  bodyGroup.add(rightArm);

  // Expressive feline head + huge adorable eyes + musketeer hat with feather!
  head.position.set(0, 0.79, 0.03);
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.195, 16, 14), furMat);
  cranium.scale.set(1.08, 0.96, 1.0);
  head.add(cranium);

  // Cream whisker cheeks + pink nose
  ([-1, 1] as const).forEach((s) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), creamMat);
    cheek.position.set(s * 0.055, -0.055, 0.15);
    head.add(cheek);
    // Whiskers
    const whisker = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.007, 0.007), creamMat);
    whisker.position.set(s * 0.13, -0.055, 0.16);
    whisker.rotation.z = s * 0.1;
    head.add(whisker);
  });

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.03, 6), pinkNoseMat);
  nose.position.set(0, -0.025, 0.205);
  nose.rotation.x = Math.PI / 2;
  head.add(nose);

  // Signature huge Puss in Boots eyes with bright white catchlights!
  addExpressiveEyes(head, {
    xOffset: 0.076,
    yOffset: 0.035,
    zOffset: 0.155,
    eyeRadius: 0.056,
    pupilRadius: 0.039,
    irisColor: 0x3f6e24,
    browColor: 0x9b4814,
    browAngle: 0.14,
    browY: 0.102,
    catchlight: true,
  });

  // Tabby forehead stripes
  for (let i = -1; i <= 1; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.07, 0.025), stripeMat);
    stripe.position.set(i * 0.045, 0.125, 0.15);
    head.add(stripe);
  }

  // Pointed cat ears peeking under the hat
  const makeEar = (side: -1 | 1): THREE.Group => {
    const ear = new THREE.Group();
    ear.position.set(side * 0.145, 0.115, 0.03);
    ear.rotation.z = -side * 0.42;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.12, 6), furMat);
    cone.position.y = 0.05;
    ear.add(cone);
    head.add(ear);
    return ear;
  };
  const leftEar = makeEar(-1);
  const rightEar = makeEar(1);

  // Tilted musketeer hat + gold band + sweeping plume feather
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.175, -0.01);
  hatGroup.rotation.z = -0.14;
  hatGroup.rotation.x = -0.08;
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.026, 20), hatMat);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.18, 16), hatMat);
  crown.position.y = 0.095;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.018, 6, 16), goldMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.035;
  const feather = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.34, 8), featherMat);
  feather.position.set(0.2, 0.19, -0.04);
  feather.rotation.z = -0.78;
  feather.rotation.x = -0.22;
  hatGroup.add(brim, crown, band, feather);
  head.add(hatGroup);

  return { leftArm, rightArm, leftEar, rightEar, tail, cape };
}

function buildFarquaadRig(bodyGroup: THREE.Group, head: THREE.Group): Partial<CompanionRig> {
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c7a5, roughness: 0.56 });
  const tunicMat = new THREE.MeshStandardMaterial({ color: 0xa11824, roughness: 0.64 });
  const ermineMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.85 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x161110, roughness: 0.72 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e1612, roughness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe2b33d,
    roughness: 0.25,
    metalness: 0.82,
  });

  // Short stubby legs + black boots (signature short stature!)
  ([-1, 1] as const).forEach((s) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.22, 10), bootMat);
    leg.position.set(s * 0.11, 0.12, 0);
    const bootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.19), bootMat);
    bootFoot.position.set(s * 0.11, 0.04, 0.04);
    bodyGroup.add(leg, bootFoot);
  });

  // Crimson velvet flared tunic + golden belt + white ermine collar/shoulder mantle
  const tunicSkirt = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.46, 14), tunicMat);
  tunicSkirt.position.y = 0.42;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.34, 14), tunicMat);
  torso.position.y = 0.7;
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.032, 6, 16), goldMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.55;
  const ermineMantle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.075, 10, 18), ermineMat);
  ermineMantle.rotation.x = Math.PI / 2;
  ermineMantle.position.y = 0.84;
  bodyGroup.add(tunicSkirt, torso, belt, ermineMantle);

  // Crimson royal cape
  const cape = new THREE.Group();
  cape.position.set(0, 0.82, -0.15);
  const capeMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.65, 12, 1, true, -Math.PI * 0.45, Math.PI * 0.9),
    tunicMat,
  );
  capeMesh.position.y = -0.32;
  capeMesh.rotation.y = Math.PI;
  cape.add(capeMesh);
  bodyGroup.add(cape);

  // Articulated arms in crimson sleeves + white cuffs
  const makeArm = (side: -1 | 1): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.26, 0.82, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.2, 6, 8), tunicMat);
    sleeve.position.y = -0.14;
    sleeve.rotation.z = side * 0.18;
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.02, 6, 10), ermineMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(side * 0.04, -0.25, 0.02);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), skinMat);
    hand.position.set(side * 0.05, -0.31, 0.03);
    arm.add(sleeve, cuff, hand);
    bodyGroup.add(arm);
    return arm;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  // Iconic square-jawed Farquaad head + jet-black pageboy bob haircut + small gold crown
  head.position.set(0, 1.08, 0.02);
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.195, 14, 12), skinMat);
  head.add(cranium);

  // Square prominent chiseled jaw/chin!
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.22), skinMat);
  jaw.position.set(0, -0.095, 0.045);
  head.add(jaw);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.07, 6), skinMat);
  nose.position.set(0, -0.015, 0.2);
  nose.rotation.x = Math.PI / 2;
  head.add(nose);

  const smirk = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.02, 0.03), hairMat);
  smirk.position.set(0, -0.085, 0.16);
  head.add(smirk);

  addExpressiveEyes(head, {
    xOffset: 0.07,
    yOffset: 0.04,
    zOffset: 0.165,
    eyeRadius: 0.036,
    pupilRadius: 0.02,
    irisColor: 0x3b2a1e,
    browColor: 0x161110,
    browAngle: -0.26,
    browY: 0.09,
  });

  // Jet-black pageboy bob (top cap + straight bangs + left/right curtains + back block)
  const hairTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.215, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat,
  );
  hairTop.position.set(0, 0.03, -0.01);
  const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.085, 0.12), hairMat);
  bangs.position.set(0, 0.145, 0.12);
  const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.29, 0.18), hairMat);
  backHair.position.set(0, -0.02, -0.14);
  head.add(hairTop, bangs, backHair);
  ([-1, 1] as const).forEach((s) => {
    const sideCurtain = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.27, 0.22), hairMat);
    sideCurtain.position.set(s * 0.185, -0.01, -0.02);
    sideCurtain.rotation.z = sideCurtainAngle(s);
    head.add(sideCurtain);
  });

  // Small Duloc golden crown perched atop his bob
  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.07, 10), goldMat);
  crownBase.position.y = 0.245;
  head.add(crownBase);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.06, 5), goldMat);
    tip.position.set(Math.sin(a) * 0.09, 0.295, Math.cos(a) * 0.09);
    head.add(tip);
  }

  return { leftArm, rightArm, cape };
}

function sideCurtainAngle(side: -1 | 1): number {
  return side * 0.12;
}

function buildHadaRig(bodyGroup: THREE.Group, head: THREE.Group): Partial<CompanionRig> {
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf7d7bd, roughness: 0.54 });
  const gownMat = new THREE.MeshStandardMaterial({ color: 0x7954bd, roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf6d365,
    roughness: 0.24,
    metalness: 0.8,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xeee6dc, roughness: 0.72 });
  const glassesMat = new THREE.MeshStandardMaterial({ color: 0x9e1b32, roughness: 0.3 });
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xd14357, roughness: 0.35 });
  const wandWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.6 });
  const starGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffeb82,
    emissive: 0xdba124,
    emissiveIntensity: 0.65,
    roughness: 0.2,
    metalness: 0.6,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xd9f4ff,
    emissive: 0x5877b8,
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.72,
    roughness: 0.18,
    side: THREE.DoubleSide,
  });

  // Enchantress lavender gown + golden sash
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.88, 16), gownMat);
  skirt.position.y = 0.44;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.42, 14), gownMat);
  torso.position.y = 0.98;
  const goldSash = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.032, 8, 18), goldMat);
  goldSash.rotation.x = Math.PI / 2;
  goldSash.position.y = 0.84;
  bodyGroup.add(skirt, torso, goldSash);

  // Articulated arms + magic star wand in right hand
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.22, 1.14, 0);
  const lSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.26, 6, 8), gownMat);
  lSleeve.position.y = -0.17;
  lSleeve.rotation.z = -0.2;
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 8), skinMat);
  lHand.position.set(-0.05, -0.34, 0.03);
  leftArm.add(lSleeve, lHand);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.22, 1.14, 0);
  const rSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.26, 6, 8), gownMat);
  rSleeve.position.y = -0.17;
  rSleeve.rotation.z = 0.22;
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 8), skinMat);
  rHand.position.set(0.05, -0.34, 0.04);
  const wandShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.46, 6), wandWoodMat);
  wandShaft.position.set(0.08, -0.2, 0.22);
  wandShaft.rotation.x = Math.PI * 0.32;
  const wandStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), starGlowMat);
  wandStar.position.set(0.08, -0.05, 0.42);
  rightArm.add(rSleeve, rHand, wandShaft, wandStar);
  bodyGroup.add(rightArm);

  // Sculpted butterfly/dragonfly fairy wings (using curved ExtrudeGeometry)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.bezierCurveTo(0.2, 0.36, 0.56, 0.38, 0.52, 0.08);
  wingShape.bezierCurveTo(0.46, -0.1, 0.28, -0.14, 0.36, -0.34);
  wingShape.bezierCurveTo(0.32, -0.46, 0.08, -0.36, 0, -0.08);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 2,
  });

  const makeWing = (side: -1 | 1): THREE.Group => {
    const wg = new THREE.Group();
    wg.position.set(side * 0.12, 1.06, -0.16);
    const mesh = new THREE.Mesh(wingGeo, wingMat);
    mesh.scale.x = side;
    wg.rotation.y = side * 0.38;
    wg.add(mesh);
    bodyGroup.add(wg);
    return wg;
  };
  const leftWing = makeWing(-1);
  const rightWing = makeWing(1);

  // Head + tall silver-white bouffant updo + iconic cat-eye glasses!
  head.position.set(0, 1.38, 0.02);
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.195, 14, 12), skinMat);
  head.add(cranium);

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.013, 6, 10, Math.PI), lipMat);
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.07, 0.175);
  head.add(smile);

  addExpressiveEyes(head, {
    xOffset: 0.072,
    yOffset: 0.032,
    zOffset: 0.165,
    eyeRadius: 0.038,
    pupilRadius: 0.02,
    irisColor: 0x3b6cb5,
    browColor: 0xbcb3aa,
    browAngle: -0.16,
    browY: 0.095,
    catchlight: true,
  });

  // Iconic glasses frames!
  ([-1, 1] as const).forEach((s) => {
    const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.01, 6, 14), glassesMat);
    lensRing.position.set(s * 0.072, 0.032, 0.205);
    head.add(lensRing);
  });
  const glassesBridge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.014, 0.015), glassesMat);
  glassesBridge.position.set(0, 0.04, 0.205);
  head.add(glassesBridge);

  // Tall voluminous bouffant silver-white hair + side curls
  const bouffant = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 12), hairMat);
  bouffant.scale.set(1.06, 1.18, 1.02);
  bouffant.position.set(0, 0.14, -0.04);
  head.add(bouffant);
  ([-1, 1] as const).forEach((s) => {
    const curl = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), hairMat);
    curl.position.set(s * 0.17, 0.04, 0.04);
    head.add(curl);
  });

  return { leftArm, rightArm, leftWing, rightWing };
}

function buildPrincipeRig(bodyGroup: THREE.Group, head: THREE.Group): Partial<CompanionRig> {
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf4ccb0, roughness: 0.54 });
  const tunicMat = new THREE.MeshStandardMaterial({ color: 0x2b4887, roughness: 0.62 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf0e7d2, roughness: 0.72 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe3b84b,
    roughness: 0.25,
    metalness: 0.82,
  });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x2a1d17, roughness: 0.5 });
  const capeMat = new THREE.MeshStandardMaterial({
    color: 0x8d232b,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xd9a73b, roughness: 0.64 });

  // Athletic legs & tall prince riding boots (zero skirt!)
  ([-1, 1] as const).forEach((s) => {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.22, 6, 8), creamMat);
    thigh.position.set(s * 0.11, 0.44, 0);
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.068, 0.3, 10), bootMat);
    boot.position.set(s * 0.11, 0.18, 0);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.075, 0.2), bootMat);
    foot.position.set(s * 0.11, 0.04, 0.04);
    bodyGroup.add(thigh, boot, foot);
  });

  // Royal blue tunic + gold chest sash & shoulder epaulets
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.52, 14), tunicMat);
  torso.position.y = 0.86;
  const tunicHem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.16, 14), tunicMat);
  tunicHem.position.y = 0.56;
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 16), goldMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.64;
  bodyGroup.add(torso, tunicHem, belt);

  ([-1, 1] as const).forEach((s) => {
    const ep = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.14), goldMat);
    ep.position.set(s * 0.22, 1.12, 0);
    ep.rotation.z = -s * 0.2;
    bodyGroup.add(ep);
  });

  // Crimson-lined prince cape
  const cape = new THREE.Group();
  cape.position.set(0, 1.09, -0.15);
  const capeMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.78, 12, 1, true, -Math.PI * 0.42, Math.PI * 0.84),
    capeMat,
  );
  capeMesh.position.y = -0.39;
  capeMesh.rotation.y = Math.PI;
  cape.add(capeMesh);
  bodyGroup.add(cape);

  // Articulated arms in cream/blue sleeves
  const makeArm = (side: -1 | 1): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.26, 1.06, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.28, 6, 8), creamMat);
    sleeve.position.y = -0.18;
    sleeve.rotation.z = side * 0.16;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), skinMat);
    hand.position.set(side * 0.05, -0.36, 0.04);
    arm.add(sleeve, hand);
    bodyGroup.add(arm);
    return arm;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  // Chiseled vain face + iconic golden flowing prince locks!
  head.position.set(0, 1.32, 0.02);
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.195, 14, 12), skinMat);
  cranium.scale.set(0.95, 1.05, 1.0);
  head.add(cranium);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.18), skinMat);
  jaw.position.set(0, -0.09, 0.05);
  head.add(jaw);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.06, 6), skinMat);
  nose.position.set(0, -0.01, 0.2);
  nose.rotation.x = Math.PI / 2;
  head.add(nose);

  const smirk = new THREE.Mesh(
    new THREE.TorusGeometry(0.052, 0.012, 6, 10, Math.PI * 0.85),
    new THREE.MeshStandardMaterial({ color: 0xa6504b, roughness: 0.45 }),
  );
  smirk.rotation.z = Math.PI + 0.18;
  smirk.position.set(0.01, -0.08, 0.17);
  head.add(smirk);

  addExpressiveEyes(head, {
    xOffset: 0.072,
    yOffset: 0.038,
    zOffset: 0.165,
    eyeRadius: 0.036,
    pupilRadius: 0.02,
    irisColor: 0x3b78b8,
    browColor: 0xa87c24,
    browAngle: 0.15,
    browY: 0.092,
    catchlight: true,
  });

  // Voluminous golden wavy prince hair (swept crown + side flips + back locks)
  const hairMain = new THREE.Mesh(
    new THREE.SphereGeometry(0.225, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
    hairMat,
  );
  hairMain.position.set(0, 0.035, -0.015);
  const swoop = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), hairMat);
  swoop.scale.set(1.35, 0.72, 1.1);
  swoop.position.set(-0.04, 0.17, 0.11);
  swoop.rotation.z = 0.24;
  const backLocks = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.16, 6, 10), hairMat);
  backLocks.position.set(0, -0.03, -0.15);
  head.add(hairMain, swoop, backLocks);

  return { leftArm, rightArm, cape };
}

function buildJengibreRig(bodyGroup: THREE.Group, head: THREE.Group): Partial<CompanionRig> {
  const cookieMat = new THREE.MeshStandardMaterial({ color: 0xba7437, roughness: 0.86 });
  const icingMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f1, roughness: 0.34 });
  const gumdropPurple = new THREE.MeshStandardMaterial({ color: 0x923ec2, roughness: 0.25 });
  const gumdropTeal = new THREE.MeshStandardMaterial({ color: 0x2ba890, roughness: 0.25 });
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xe3707f, roughness: 0.45 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x5c2718, roughness: 0.5 });

  // Rounded gingerbread cookie legs with white frosting cuffs!
  ([-1, 1] as const).forEach((s) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.18, 6, 10), cookieMat);
    leg.position.set(s * 0.1, 0.15, 0);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.018, 6, 12), icingMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(s * 0.1, 0.12, 0);
    bodyGroup.add(leg, cuff);
  });

  // Rounded gingerbread cookie torso + gumdrop buttons + frosting collar
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.12, 18), cookieMat);
  torso.scale.set(1.0, 1.0, 1.35);
  torso.rotation.x = Math.PI / 2;
  torso.position.y = 0.43;
  bodyGroup.add(torso);

  const btn1 = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 8), gumdropPurple);
  btn1.position.set(0, 0.49, 0.075);
  const btn2 = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 8), gumdropTeal);
  btn2.position.set(0, 0.37, 0.075);
  const collarIcing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 6, 14), icingMat);
  collarIcing.rotation.x = Math.PI / 2;
  collarIcing.position.set(0, 0.58, 0);
  bodyGroup.add(btn1, btn2, collarIcing);

  // Articulated cookie arms with white frosting wrist cuffs!
  const makeArm = (side: -1 | 1): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.21, 0.51, 0);
    const cookieArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.18, 6, 8), cookieMat);
    cookieArm.position.y = -0.12;
    cookieArm.rotation.z = side * 0.35;
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 6, 10), icingMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(side * 0.06, -0.18, 0);
    arm.add(cookieArm, cuff);
    bodyGroup.add(arm);
    return arm;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  // Iconic flat-disc cookie head + white wavy frosting hair + big expressive eyes & arched icing brows!
  head.position.set(0, 0.77, 0.01);
  const cookieHead = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.11, 20), cookieMat);
  cookieHead.rotation.x = Math.PI / 2;
  head.add(cookieHead);

  // Frosting hairline waves across top of cookie head
  for (let i = -2; i <= 2; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), icingMat);
    dot.position.set(i * 0.055, 0.155 - Math.abs(i) * 0.015, 0.05);
    head.add(dot);
  }

  // Big round icing eyes + dark pupils
  addExpressiveEyes(head, {
    xOffset: 0.07,
    yOffset: 0.035,
    zOffset: 0.048,
    eyeRadius: 0.038,
    pupilRadius: 0.022,
    irisColor: 0x261a12,
    browColor: 0xfbf8f1,
    browAngle: 0.26,
    browY: 0.095,
    catchlight: true,
  });

  // Rosy cheeks + cheeky open icing mouth
  ([-1, 1] as const).forEach((s) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), cheekMat);
    cheek.position.set(s * 0.105, -0.025, 0.052);
    head.add(cheek);
  });
  const mouthOuter = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.014, 6, 12), icingMat);
  mouthOuter.position.set(0, -0.065, 0.055);
  const mouthInner = new THREE.Mesh(new THREE.CircleGeometry(0.038, 10), mouthMat);
  mouthInner.position.set(0, -0.065, 0.058);
  head.add(mouthOuter, mouthInner);

  return { leftArm, rightArm };
}

function buildShrekCompanionRig(
  bodyGroup: THREE.Group,
  head: THREE.Group,
): Partial<CompanionRig> {
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x6fa63b, roughness: 0.6 });
  const tunicMat = new THREE.MeshStandardMaterial({ color: 0xe6dcc2, roughness: 0.85 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0x4b3120, roughness: 0.78 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x2b1a10, roughness: 0.45 });
  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0xd4a438,
    roughness: 0.25,
    metalness: 0.85,
  });

  ([-1, 1] as const).forEach((s) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.22, 6, 8), vestMat);
    leg.position.set(s * 0.16, 0.24, 0);
    bodyGroup.add(leg);
  });

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), tunicMat);
  torso.scale.set(1.06, 1.15, 0.88);
  torso.position.y = 0.78;
  const vest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.37, 0.48, 14, 1, true, -0.35, Math.PI * 1.55),
    vestMat,
  );
  vest.position.y = 0.79;
  vest.rotation.y = Math.PI * 0.22;
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.048, 6, 18), beltMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.56;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.06), buckleMat);
  buckle.position.set(0, 0.56, 0.36);
  bodyGroup.add(torso, vest, belt, buckle);

  const makeArm = (side: -1 | 1): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.39, 0.96, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.26, 6, 8), tunicMat);
    sleeve.position.y = -0.18;
    sleeve.rotation.z = side * 0.16;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), skinMat);
    hand.position.set(side * 0.05, -0.36, 0.03);
    arm.add(sleeve, hand);
    bodyGroup.add(arm);
    return arm;
  };

  head.position.set(0, 1.34, 0.02);
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), skinMat);
  head.add(cranium);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), skinMat);
  nose.position.set(0, -0.015, 0.25);
  head.add(nose);
  addExpressiveEyes(head, {
    xOffset: 0.095,
    yOffset: 0.055,
    zOffset: 0.22,
    eyeRadius: 0.048,
    pupilRadius: 0.026,
    browColor: 0x55822a,
    browY: 0.115,
  });

  const makeEar = (side: -1 | 1): THREE.Group => {
    const ear = new THREE.Group();
    ear.position.set(side * 0.24, 0.1, -0.02);
    ear.rotation.z = -side * 0.72;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.028, 0.17, 8), skinMat);
    stalk.position.y = 0.08;
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.072, 0.09, 10, 1, true), skinMat);
    bell.position.y = 0.17;
    bell.rotation.x = Math.PI;
    ear.add(stalk, bell);
    head.add(ear);
    return ear;
  };

  return {
    leftArm: makeArm(-1),
    rightArm: makeArm(1),
    leftEar: makeEar(-1),
    rightEar: makeEar(1),
  };
}

/**
 * Builds an articulated, movie-inspired 3D companion rig with distinct facial features,
 * costume silhouettes, and animatable parts matching Shrek's level of craft.
 */
export function createCompanionRig(
  characterId: CharacterId,
  shadowTexture?: THREE.Texture,
): CompanionRig {
  const root = new THREE.Group();
  root.name = `Companion_${characterId}`;

  const bodyGroup = new THREE.Group();
  const head = new THREE.Group();
  bodyGroup.add(head);
  root.add(bodyGroup);

  const shadowRadius = characterId === 'jengibre' ? 0.34 : characterId === 'gato' ? 0.38 : 0.5;
  const shadowDisc = createContactShadow(shadowRadius, shadowTexture, 0.65);
  root.add(shadowDisc);

  let parts: Partial<CompanionRig>;
  switch (characterId) {
    case 'burro':
      parts = buildBurroRig(bodyGroup, head);
      break;
    case 'fiona':
      parts = buildFionaRig(bodyGroup, head);
      break;
    case 'gato':
      parts = buildGatoRig(bodyGroup, head);
      break;
    case 'farquaad':
      parts = buildFarquaadRig(bodyGroup, head);
      break;
    case 'hada':
      parts = buildHadaRig(bodyGroup, head);
      break;
    case 'principe':
      parts = buildPrincipeRig(bodyGroup, head);
      break;
    case 'jengibre':
      parts = buildJengibreRig(bodyGroup, head);
      break;
    case 'shrek':
    case 'narrador':
    default:
      parts = buildShrekCompanionRig(bodyGroup, head);
      break;
  }

  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && obj !== shadowDisc) {
      obj.castShadow = true;
    }
  });

  return {
    characterId,
    root,
    bodyGroup,
    head,
    shadowDisc,
    ...parts,
  };
}

/**
 * Animates the speaking companion next to Shrek with character-specific gestures.
 */
export function animateCompanionRig(
  rig: CompanionRig,
  elapsedTime: number,
  isSpeaking: boolean,
  dt: number,
): void {
  const talkSpeed = isSpeaking ? 5.2 : 2.1;
  const talkAmp = isSpeaking ? 1.0 : 0.35;

  // Grounded springy bounce on bodyGroup so shadowDisc remains flat on terrain
  const hop = isSpeaking
    ? Math.abs(Math.sin(elapsedTime * 4.4)) * 0.09
    : Math.sin(elapsedTime * 2.3) * 0.02;
  rig.bodyGroup.position.y = THREE.MathUtils.damp(rig.bodyGroup.position.y, hop, 10, dt);

  // Expressive head nod & gaze tilt while conversing with Shrek
  rig.head.rotation.x = Math.sin(elapsedTime * talkSpeed) * 0.08 * talkAmp;
  rig.head.rotation.y = Math.sin(elapsedTime * 1.9) * 0.14;
  rig.head.rotation.z = Math.sin(elapsedTime * 2.6) * 0.06 * talkAmp;

  // Arm gestures tailored per character personality
  if (rig.leftArm && rig.rightArm) {
    if (rig.characterId === 'gato') {
      // Swashbuckling rapier flourish!
      rig.rightArm.rotation.x = -0.35 + Math.sin(elapsedTime * 4.2) * 0.25 * talkAmp;
      rig.rightArm.rotation.z = 0.28 + Math.cos(elapsedTime * 3.1) * 0.18;
      rig.leftArm.rotation.z = -0.22 - Math.sin(elapsedTime * 3.4) * 0.14;
    } else if (rig.characterId === 'hada') {
      // Gentle wand casting arc
      rig.rightArm.rotation.x = -0.5 + Math.sin(elapsedTime * 3.8) * 0.22 * talkAmp;
      rig.rightArm.rotation.z = 0.2 + Math.cos(elapsedTime * 2.5) * 0.15;
      rig.leftArm.rotation.z = -0.18 + Math.sin(elapsedTime * 2.8) * 0.12;
    } else if (rig.characterId === 'farquaad') {
      // Pompous commanding hand waves
      rig.rightArm.rotation.x = -0.45 + Math.sin(elapsedTime * 5.6) * 0.28 * talkAmp;
      rig.leftArm.rotation.x = -0.2 + Math.cos(elapsedTime * 4.8) * 0.16 * talkAmp;
    } else {
      rig.leftArm.rotation.x = Math.sin(elapsedTime * 4.1) * 0.22 * talkAmp;
      rig.rightArm.rotation.x = -Math.sin(elapsedTime * 4.1) * 0.26 * talkAmp;
      rig.leftArm.rotation.z = -0.12 - Math.abs(Math.sin(elapsedTime * 2.5)) * 0.14 * talkAmp;
      rig.rightArm.rotation.z = 0.12 + Math.abs(Math.cos(elapsedTime * 2.5)) * 0.14 * talkAmp;
    }
  }

  // Ear wiggle (Burro / Fiona / Shrek / Gato)
  if (rig.leftEar && rig.rightEar) {
    const baseZ = rig.characterId === 'fiona' || rig.characterId === 'shrek' ? 0.74 : 0.24;
    const wiggle = Math.sin(elapsedTime * (rig.characterId === 'burro' ? 10 : 6)) * 0.12 * talkAmp;
    rig.leftEar.rotation.z = baseZ + wiggle;
    rig.rightEar.rotation.z = -baseZ - wiggle;
  }

  // Fairy wing flutter (Hada Madrina — swept backward from shoulders)
  if (rig.leftWing && rig.rightWing) {
    const flap = Math.sin(elapsedTime * 14) * 0.26;
    rig.leftWing.rotation.y = -0.38 - flap;
    rig.rightWing.rotation.y = 0.38 + flap;
  }

  // Tail wag / braid sway / cape billow
  if (rig.tail) {
    if (rig.characterId === 'burro' || rig.characterId === 'gato') {
      rig.tail.rotation.y = Math.sin(elapsedTime * 7.5) * 0.38;
    } else {
      rig.tail.rotation.z = Math.sin(elapsedTime * 2.8) * 0.08;
    }
  }
  if (rig.cape) {
    rig.cape.rotation.x = 0.08 + Math.sin(elapsedTime * 3.5) * 0.08;
  }
}

/**
 * Legacy helper returning the root THREE.Group of createCompanionRig.
 */
export function createCompanionMesh(
  characterId: CharacterId,
  shadowTexture?: THREE.Texture,
): THREE.Group {
  return createCompanionRig(characterId, shadowTexture).root;
}
