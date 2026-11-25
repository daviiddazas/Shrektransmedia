import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSingleActorScenePrompt,
  clampToBoard,
  computeMovementStep,
  findNearestStation,
  getGroundHeightAt,
  mapSpeakerToCharacterId,
  mergeWavBuffers,
  normalizePublicImageUrl,
  parseScreenplayLines,
  parseVideoUrl,
  sampleStationSpline,
  validateStoryConfigJson,
} from './storyLogic';
import {
  DEFAULT_SCENE_SCRIPT,
  DEFAULT_SCENE_STYLE_INSTRUCTIONS,
  DEFAULT_STORY_CONFIG,
  FULL_CAST_SCENE_SCRIPT,
} from '../data/defaultStoryData';

test('DEFAULT_STORY_CONFIG preserves all 10 Story Canvas stations', () => {
  assert.equal(DEFAULT_STORY_CONFIG.stations.length, 10);
  const expectedTitles = [
    '1. PROPÓSITO',
    '2. AUDIENCIA',
    '3. MENSAJES CLAVE',
    '4. HISTORIA',
    '5. PERSONAJES Y LUGARES',
    '6. CAMPAÑA TRANSMEDIA',
    '7. LLAMADO A LA ACCIÓN',
    '8. ESTILO Y TONO',
    '9. RESULTADOS',
    '10. INDICADORES',
  ];
  DEFAULT_STORY_CONFIG.stations.forEach((station, index) => {
    assert.equal(station.canvasTitle, expectedTitles[index]);
    assert.equal(station.canvasOrder, index + 1);
  });
});

test('clampToBoard constrains coordinates within playable book bounds', () => {
  const clamped = clampToBoard({ x: 999, z: -999 });
  assert.equal(clamped.x, 21.5);
  assert.equal(clamped.z, -13.0);
});

test('computeMovementStep advances towards target and detects arrival', () => {
  const start = { x: 0, z: 0 };
  const target = { x: 10, z: 0 };
  const step1 = computeMovementStep(start, target, 0, 5, 0.05);
  assert.equal(step1.arrived, false);
  assert.ok(step1.position.x > 0 && step1.position.x < 1);
  assert.ok(Math.abs(step1.distanceMoved - 0.25) < 1e-6);

  const nearTarget = { x: 9.9, z: 0 };
  const step2 = computeMovementStep(nearTarget, target, 0, 5, 0.05);
  assert.equal(step2.arrived, true);
  assert.equal(step2.position.x, 10);
});

test('findNearestStation returns station only within proximity threshold', () => {
  const station1Pos = DEFAULT_STORY_CONFIG.stations[0].worldPosition;
  const hit = findNearestStation(
    { x: station1Pos.x + 0.5, z: station1Pos.z - 0.5 },
    DEFAULT_STORY_CONFIG.stations,
    2.4,
  );
  assert.equal(hit?.id, 1);

  const miss = findNearestStation({ x: 0, z: 12 }, DEFAULT_STORY_CONFIG.stations, 1.5);
  assert.equal(miss, null);
});

test('sampleStationSpline produces smooth points starting and ending at stations 1 and 10', () => {
  const spline = sampleStationSpline(DEFAULT_STORY_CONFIG.stations, 10);
  assert.equal(spline.length, 9 * 10 + 1);
  assert.deepEqual(spline[0], DEFAULT_STORY_CONFIG.stations[0].worldPosition);
  assert.deepEqual(spline[spline.length - 1], DEFAULT_STORY_CONFIG.stations[9].worldPosition);
  assert.ok(Number.isFinite(getGroundHeightAt(spline[25].x, spline[25].z)));
});

test('parseVideoUrl converts YouTube, Vimeo, MP4 and handles empty strings', () => {
  assert.equal(parseVideoUrl('').kind, 'none');
  const yt = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(yt.kind, 'youtube');
  assert.ok(yt.src.includes('youtube.com/embed/dQw4w9WgXcQ'));

  const shortYt = parseVideoUrl('https://youtu.be/abc123XYZ');
  assert.equal(shortYt.kind, 'youtube');
  assert.ok(shortYt.src.includes('abc123XYZ'));

  const vimeo = parseVideoUrl('https://vimeo.com/123456789');
  assert.equal(vimeo.kind, 'vimeo');

  const mp4 = parseVideoUrl('https://example.com/cuento.mp4');
  assert.equal(mp4.kind, 'direct');
});

test('validateStoryConfigJson accepts valid config, merges voice archetypes, and rejects malformed input', () => {
  const bad = validateStoryConfigJson('{not-json');
  assert.equal(bad.ok, false);
  assert.ok(bad.error);

  const emptyStations = validateStoryConfigJson(JSON.stringify({ stations: [] }));
  assert.equal(emptyStations.ok, false);

  const modified = structuredClone(DEFAULT_STORY_CONFIG);
  modified.stations[0].modalTitle = 'Propósito Editado';
  const valid = validateStoryConfigJson(JSON.stringify(modified));
  assert.equal(valid.ok, true);
  assert.equal(valid.config?.stations[0].modalTitle, 'Propósito Editado');
  assert.equal(valid.config?.stations.length, 10);
  assert.ok(valid.config?.characterVoices.shrek.archetypeName.includes('VOICE_SHREK'));
});

test('parseScreenplayLines & buildSingleActorScenePrompt parse Spanish Voice Design scripts accurately', () => {
  assert.equal(mapSpeakerToCharacterId('Ogro'), 'shrek');
  assert.equal(mapSpeakerToCharacterId('Compañero'), 'burro');
  assert.equal(mapSpeakerToCharacterId('Princesa'), 'fiona');
  assert.equal(mapSpeakerToCharacterId('Gato espadachín'), 'gato');
  assert.equal(mapSpeakerToCharacterId('Narrador'), 'narrador');

  const parsed = parseScreenplayLines(DEFAULT_SCENE_SCRIPT);
  assert.equal(parsed.length, 4);
  assert.equal(parsed[0].characterId, 'narrador');
  assert.equal(parsed[1].characterId, 'burro');
  assert.equal(parsed[2].characterId, 'shrek');
  assert.equal(parsed[3].characterId, 'burro');
  assert.ok(parsed[2].dialogue.includes('tranquilidad'));

  const fullCast = parseScreenplayLines(FULL_CAST_SCENE_SCRIPT);
  assert.equal(fullCast.length, 9);
  assert.deepEqual(
    fullCast.map((l) => l.characterId),
    ['narrador', 'shrek', 'burro', 'fiona', 'gato', 'farquaad', 'hada', 'principe', 'jengibre'],
  );

  const combined = buildSingleActorScenePrompt(
    DEFAULT_SCENE_STYLE_INSTRUCTIONS,
    DEFAULT_SCENE_SCRIPT,
  );
  assert.ok(combined.includes('[Instrucciones de estilo]'));
  assert.ok(combined.includes('[Guion]'));
});

test('mergeWavBuffers strips secondary 44-byte RIFF headers and updates chunk sizes', () => {
  const makeFakeWav = (pcmBytes: number, fillByte: number) => {
    const buf = new Uint8Array(44 + pcmBytes);
    buf.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
    const view = new DataView(buf.buffer);
    view.setUint32(4, 36 + pcmBytes, true);
    view.setUint32(40, pcmBytes, true);
    buf.fill(fillByte, 44);
    return buf;
  };

  const merged = mergeWavBuffers([makeFakeWav(100, 1), makeFakeWav(150, 2)]);
  assert.equal(merged.byteLength, 44 + 250);
  const view = new DataView(merged.buffer);
  assert.equal(view.getUint32(4, true), 36 + 250);
  assert.equal(view.getUint32(40, true), 250);
  assert.equal(merged[44], 1);
  assert.equal(merged[144], 2);
});

test('normalizePublicImageUrl validates public URLs and converts GitHub blob URLs to raw', () => {
  const okUrl = normalizePublicImageUrl('https://example.com/foto.png');
  assert.equal(okUrl.ok, true);
  assert.equal(okUrl.url, 'https://example.com/foto.png');

  const ghBlob = normalizePublicImageUrl(
    'https://github.com/daviiddazas/Shreck2/blob/main/burro.jpg',
  );
  assert.equal(ghBlob.ok, true);
  assert.ok(ghBlob.url.includes('raw=true'));

  const badProto = normalizePublicImageUrl('javascript:alert(1)');
  assert.equal(badProto.ok, false);

  const empty = normalizePublicImageUrl('   ');
  assert.equal(empty.ok, false);
});

test('computeDialogueCameraFraming zooms in on character midpoint during conversation and restores normal follow view', async () => {
  const { computeDialogueCameraFraming } = await import('./storyLogic');
  const shrek = { x: -1.5, z: -2.0 };
  const companion = { x: -0.05, z: -2.65 };

  const normal = computeDialogueCameraFraming(shrek, companion, 0, 0, false);
  assert.equal(normal.target.x, shrek.x);
  assert.equal(normal.position.y, 14.0);

  const duel = computeDialogueCameraFraming(shrek, companion, 0, 0, true);
  assert.equal(duel.target.x, (shrek.x + companion.x) * 0.5);
  assert.equal(duel.target.z, (shrek.z + companion.z) * 0.5);

  const normalDist = Math.hypot(
    normal.position.x - normal.target.x,
    normal.position.y - normal.target.y,
    normal.position.z - normal.target.z,
  );
  const duelDist = Math.hypot(
    duel.position.x - duel.target.x,
    duel.position.y - duel.target.y,
    duel.position.z - duel.target.z,
  );
  assert.ok(duelDist < normalDist * 0.55, 'Dialogue camera should zoom significantly closer than normal follow view');

  const solo = computeDialogueCameraFraming(shrek, null, 0.2, 0, true);
  assert.equal(solo.target.x, shrek.x);
  assert.ok(solo.position.y < normal.position.y);
});

test('characterVoices assign distinct VOICE_* IDs, genders, registers, Latin American Spanish, expressivity, and pitch spread across all 9 characters', () => {
  const voices = DEFAULT_STORY_CONFIG.characterVoices;
  assert.equal(Object.keys(voices).length, 9);

  const seenVoiceIds = new Set<string>();
  for (const profile of Object.values(voices)) {
    assert.ok(profile.voiceId.startsWith('VOICE_'));
    assert.ok(!seenVoiceIds.has(profile.voiceId));
    seenVoiceIds.add(profile.voiceId);
    assert.ok(profile.voicePrompt.trim().length > 40);
    assert.ok(/español latinoamericano/i.test(profile.voicePrompt));
    assert.ok(!/castellano/i.test(profile.voicePrompt));
    assert.ok(profile.defaultActingInstruction.trim().length > 10);
    assert.ok(profile.gender === 'masculino' || profile.gender === 'femenino');
    assert.ok(['grave', 'medio', 'medio-alto', 'agudo'].includes(profile.register ?? ''));
    assert.ok(profile.pitch >= 0.5 && profile.pitch <= 1.95);
    assert.ok(profile.rate >= 0.7 && profile.rate <= 1.45);
    assert.ok(profile.volume >= 0.2 && profile.volume <= 1.0);
    assert.ok(profile.expressivity >= 0.2 && profile.expressivity <= 1.0);
  }

  assert.equal(voices.narrador.voiceId, 'VOICE_NARRATOR');
  assert.equal(voices.shrek.voiceId, 'VOICE_SHREK');
  assert.equal(voices.burro.voiceId, 'VOICE_DONKEY');
  assert.equal(voices.fiona.voiceId, 'VOICE_FIONA');
  assert.equal(voices.gato.voiceId, 'VOICE_PUSS');
  assert.equal(voices.farquaad.voiceId, 'VOICE_FARQUAAD');
  assert.equal(voices.hada.voiceId, 'VOICE_FAIRY_GODMOTHER');
  assert.equal(voices.principe.voiceId, 'VOICE_CHARMING');
  assert.equal(voices.jengibre.voiceId, 'VOICE_GINGY');

  assert.equal(voices.fiona.gender, 'femenino');
  assert.equal(voices.hada.gender, 'femenino');
  assert.equal(voices.shrek.register, 'grave');
  assert.equal(voices.gato.register, 'medio');
  assert.equal(voices.farquaad.register, 'medio-alto');
  assert.equal(voices.jengibre.register, 'agudo');

  assert.ok(voices.shrek.pitch < voices.narrador.pitch);
  assert.ok(voices.narrador.pitch < voices.gato.pitch);
  assert.ok(voices.gato.pitch < voices.hada.pitch);
  assert.ok(voices.hada.pitch < voices.principe.pitch);
  assert.ok(voices.principe.pitch < voices.farquaad.pitch);
  assert.ok(voices.farquaad.pitch < voices.fiona.pitch);
  assert.ok(voices.fiona.pitch < voices.burro.pitch);
  assert.ok(voices.burro.pitch < voices.jengibre.pitch);
  assert.ok(voices.gato.rate < voices.burro.rate);
  assert.ok(voices.shrek.rate < voices.jengibre.rate);
});

test('stations balance multi-speaker dialogues and narrator-only focus naturally', () => {
  const st1 = DEFAULT_STORY_CONFIG.stations[0];
  assert.equal(st1.dialogueTurns?.length, 3);
  assert.deepEqual(
    st1.dialogueTurns?.map((t) => t.characterId),
    ['burro', 'shrek', 'burro'],
  );

  const st7 = DEFAULT_STORY_CONFIG.stations[6];
  assert.equal(st7.id, 7);
  assert.deepEqual(st7.dialogueTurns, []);
});

test('validateStoryConfigJson upgrades legacy v1-v4 characterVoices to v5 while preserving station edits and custom audio URLs', () => {
  const legacy = structuredClone(DEFAULT_STORY_CONFIG) as unknown as Record<string, unknown>;
  legacy.version = 4;
  const legacyVoices = legacy.characterVoices as Record<string, Record<string, unknown>>;
  legacyVoices.farquaad.pitch = 0.78;
  legacyVoices.shrek.customAudioUrl = 'https://example.com/mi-shrek.mp3';
  const legacyStations = legacy.stations as Array<Record<string, unknown>>;
  legacyStations[2].imageUrl = 'https://example.com/duloc-custom.png';

  const res = validateStoryConfigJson(JSON.stringify(legacy));
  assert.equal(res.ok, true);
  assert.equal(res.config?.version, 5);
  assert.equal(res.config?.characterVoices.farquaad.pitch, DEFAULT_STORY_CONFIG.characterVoices.farquaad.pitch);
  assert.equal(res.config?.characterVoices.shrek.voiceId, 'VOICE_SHREK');
  assert.equal(res.config?.characterVoices.shrek.customAudioUrl, 'https://example.com/mi-shrek.mp3');
  assert.equal(res.config?.stations[2].imageUrl, 'https://example.com/duloc-custom.png');
});

test('getStationsToPrefetch returns destination and next station cleanly across boundaries', async () => {
  const { getStationsToPrefetch, NARRATION_TIMING } = await import('./storyLogic');

  const mid = getStationsToPrefetch(DEFAULT_STORY_CONFIG.stations, 3);
  assert.deepEqual(
    mid.map((s) => s.id),
    [3, 4],
  );

  const last = getStationsToPrefetch(DEFAULT_STORY_CONFIG.stations, 10);
  assert.deepEqual(
    last.map((s) => s.id),
    [10],
  );

  const missing = getStationsToPrefetch(DEFAULT_STORY_CONFIG.stations, 999);
  assert.equal(missing.length, 0);

  assert.ok(NARRATION_TIMING.pauseAfterNarratorMs > 0);
  assert.ok(NARRATION_TIMING.pauseAfterCompanionMs > 0);
  assert.ok(NARRATION_TIMING.pauseBetweenTurnsMs > 0);
  assert.ok(NARRATION_TIMING.maxClipDurationMs > NARRATION_TIMING.startWatchdogMs);
});



