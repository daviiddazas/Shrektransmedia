import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  animateCompanionRig,
  animateShrekRig,
  createCompanionMesh,
  createCompanionRig,
  createShrekHero,
} from './characters3d';
import { CharacterId } from '../types/story';

function countMeshes(root: THREE.Object3D): number {
  let count = 0;
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) count++;
  });
  return count;
}

test('createShrekHero builds articulated multi-part Shrek rig and animates without NaN', () => {
  const rig = createShrekHero();
  assert.ok(countMeshes(rig.root) >= 16, 'Shrek hero should have at least 16 meshes');
  animateShrekRig(rig, 1.2, true, 0, 2.5, 0.016);
  animateShrekRig(rig, 0, false, 1.0, 3.0, 0.016);
  assert.ok(Number.isFinite(rig.bodyGroup.position.y));
  assert.ok(Number.isFinite(rig.leftEar.rotation.z));
});

test('createCompanionRig creates distinct multi-part articulated rigs for every story character', () => {
  const allCharacters: CharacterId[] = [
    'burro',
    'fiona',
    'gato',
    'farquaad',
    'hada',
    'principe',
    'jengibre',
    'shrek',
  ];

  for (const cid of allCharacters) {
    const rig = createCompanionRig(cid);
    const meshes = countMeshes(rig.root);
    assert.ok(
      meshes >= 14,
      `Expected ${cid} to have at least 14 meshes for recognizable silhouette/features, got ${meshes}`,
    );
    assert.ok(rig.head, `${cid} should expose an articulated head group`);
    assert.ok(rig.bodyGroup, `${cid} should expose a bodyGroup`);
    assert.ok(rig.shadowDisc, `${cid} should have a grounded contact shadow`);

    if (cid === 'burro') {
      assert.ok(rig.leftEar && rig.rightEar && rig.tail, 'burro must have ears and tail');
    } else if (cid === 'fiona') {
      assert.ok(
        rig.leftArm && rig.rightArm && rig.leftEar && rig.rightEar && rig.tail,
        'fiona must have articulated arms, ogre ears, and braid',
      );
    } else if (cid === 'gato') {
      assert.ok(
        rig.leftArm && rig.rightArm && rig.cape && rig.tail && rig.leftEar && rig.rightEar,
        'gato must have arms (rapier), cape, tail, and cat ears',
      );
    } else if (cid === 'hada') {
      assert.ok(
        rig.leftArm && rig.rightArm && rig.leftWing && rig.rightWing,
        'hada must have articulated arms (wand) and fairy wings',
      );
    } else if (cid === 'farquaad' || cid === 'principe') {
      assert.ok(
        rig.leftArm && rig.rightArm && rig.cape,
        `${cid} must have articulated arms and royal cape`,
      );
    } else if (cid === 'jengibre') {
      assert.ok(rig.leftArm && rig.rightArm, 'jengibre must have articulated cookie arms');
    }

    // Run animation over multiple timestamps and verify finite transforms
    for (let t = 0.1; t <= 2.5; t += 0.4) {
      animateCompanionRig(rig, t, true, 0.016);
      assert.ok(Number.isFinite(rig.bodyGroup.position.y));
      assert.ok(Number.isFinite(rig.head.rotation.x));
      if (rig.leftWing) assert.ok(Number.isFinite(rig.leftWing.rotation.y));
      if (rig.tail) assert.ok(Number.isFinite(rig.tail.rotation.y));
    }
  }
});

test('createCompanionMesh backward-compatible wrapper returns THREE.Group', () => {
  const grp = createCompanionMesh('gato');
  assert.ok(grp instanceof THREE.Group);
  assert.ok(countMeshes(grp) >= 14);
});
