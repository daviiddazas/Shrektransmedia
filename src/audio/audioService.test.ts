import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAudioCacheKey,
  composeGeminiActingPrompt,
  computeExpressiveProsody,
  stripActingAnnotations,
} from './audioService';
import {
  ALL_VOICES_COMPARISON_LINES,
  CHARACTER_VOICE_IDS,
  VOICE_PROFILES_REGISTRY,
} from '../data/voiceProfiles';

test('stripActingAnnotations removes parenthetical acting notes and bracket tags without losing speech text', () => {
  const clean = stripActingAnnotations(
    '(Grave, lento y suspirando) [Shrek] ¡Este es mi pantano! (pausa breve)',
  );
  assert.equal(clean, '¡Este es mi pantano!');
});

test('buildAudioCacheKey distinguishes voiceId, actingInstruction, rate, and text cleanly', () => {
  const keyA = buildAudioCacheKey({
    voiceId: 'VOICE_SHREK',
    text: '¡Este es mi pantano!',
    actingInstruction: 'Seco e impaciente',
    geminiVoiceName: 'Fenrir',
    expressivity: 0.72,
    rate: 0.85,
  });
  const keySame = buildAudioCacheKey({
    voiceId: 'VOICE_SHREK',
    text: '(suspirando) ¡Este es mi pantano!',
    actingInstruction: 'seco e impaciente',
    geminiVoiceName: 'Fenrir',
    expressivity: 0.72,
    rate: 0.85,
  });
  const keyDifferentActing = buildAudioCacheKey({
    voiceId: 'VOICE_SHREK',
    text: '¡Este es mi pantano!',
    actingInstruction: 'Con ternura hacia su familia',
    geminiVoiceName: 'Fenrir',
    expressivity: 0.72,
    rate: 0.85,
  });

  assert.equal(keyA, keySame);
  assert.notEqual(keyA, keyDifferentActing);
});

test('composeGeminiActingPrompt keeps permanent vocal identity separate from temporary acting direction', () => {
  const shrek = VOICE_PROFILES_REGISTRY.shrek;
  const prompt = composeGeminiActingPrompt(shrek, 'Tono tierno al mirar a sus hijos');
  assert.ok(prompt.includes(shrek.voicePrompt));
  assert.ok(prompt.includes('Tono tierno al mirar a sus hijos'));
  assert.ok(/español latinoamericano/i.test(prompt));
});

test('computeExpressiveProsody adjusts rate, pitch, volume and Latin American Spanish tag per profile and acting', () => {
  const burro = VOICE_PROFILES_REGISTRY.burro;
  const shrek = VOICE_PROFILES_REGISTRY.shrek;
  const gato = VOICE_PROFILES_REGISTRY.gato;

  const pBurro = computeExpressiveProsody(
    burro,
    'Rápido y entusiasta con sorpresa',
    0.8,
  );
  const pShrek = computeExpressiveProsody(
    shrek,
    'Pausado y sereno con suspiro',
    0.8,
  );
  const pGato = computeExpressiveProsody(gato, undefined, 0.5);

  assert.equal(pBurro.lang, 'es-MX');
  assert.equal(pGato.lang, 'es-MX');
  assert.ok(pBurro.rate > pShrek.rate);
  assert.ok(pBurro.pitch > pShrek.pitch);
  assert.ok(Math.abs(pGato.volume - 0.5 * gato.volume) < 1e-6);
});

test('ALL_VOICES_COMPARISON_LINES covers every persistent VOICE_* character without omissions', () => {
  assert.equal(ALL_VOICES_COMPARISON_LINES.length, 9);
  const expectedIds = Object.values(CHARACTER_VOICE_IDS);
  const actualIds = ALL_VOICES_COMPARISON_LINES.map((l) => l.voiceId);
  for (const vid of expectedIds) {
    assert.ok(actualIds.includes(vid), `Missing comparison line for ${vid}`);
  }
});
