import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeMonoWav,
  encodeMonoWav,
  formatPitchDescription,
  mapVoicePitchToFrequencyRatio,
  transformWavBuffer,
} from './pitchProcessor';

function generateSyntheticVoiceWav(freqHz: number, durationSec = 0.35, sampleRate = 24000): Uint8Array {
  const len = Math.round(durationSec * sampleRate);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    // Fundamental + 2 harmonics like a glottal pulse
    samples[i] =
      0.55 * Math.sin(2 * Math.PI * freqHz * t) +
      0.22 * Math.sin(2 * Math.PI * freqHz * 2 * t) +
      0.1 * Math.sin(2 * Math.PI * freqHz * 3 * t);
  }
  return encodeMonoWav(samples, sampleRate);
}

function estimateZeroCrossingFreq(samples: Float32Array, sampleRate: number): number {
  let crossings = 0;
  // Measure steady middle section
  const start = Math.floor(samples.length * 0.2);
  const end = Math.floor(samples.length * 0.8);
  for (let i = start + 1; i < end; i++) {
    if ((samples[i - 1] < 0 && samples[i] >= 0) || (samples[i - 1] >= 0 && samples[i] < 0)) {
      crossings += 1;
    }
  }
  const dur = (end - start) / sampleRate;
  return crossings / (2 * dur);
}

test('mapVoicePitchToFrequencyRatio separates deep ogre, female, and super-high Gingy registers', () => {
  const shrekRatio = mapVoicePitchToFrequencyRatio(0.52, 'muy-grave');
  const gatoRatio = mapVoicePitchToFrequencyRatio(0.94, 'medio');
  const fionaRatio = mapVoicePitchToFrequencyRatio(1.56, 'medio-alto');
  const jengibreRatio = mapVoicePitchToFrequencyRatio(2.08, 'muy-agudo');

  assert.ok(shrekRatio < 0.78);
  assert.ok(gatoRatio < 1.0);
  assert.ok(fionaRatio > 1.28);
  assert.ok(jengibreRatio > 1.55);
  assert.ok(formatPitchDescription(2.08).includes('Bien agudo'));
  assert.ok(formatPitchDescription(0.52).includes('Muy grave'));
});

test('transformWavBuffer shifts frequency clearly downward for Shrek and sharply upward for Jengibre & Fiona', () => {
  const baseWav = generateSyntheticVoiceWav(150, 0.4, 24000);
  const baseParsed = decodeMonoWav(baseWav)!;
  const baseFreq = estimateZeroCrossingFreq(baseParsed.samples, 24000);

  const shrekWav = transformWavBuffer(baseWav, {
    pitch: 0.52,
    rate: 0.84,
    gender: 'masculino',
    register: 'muy-grave',
  });
  const shrekParsed = decodeMonoWav(shrekWav)!;
  const shrekFreq = estimateZeroCrossingFreq(shrekParsed.samples, 24000);

  const fionaWav = transformWavBuffer(baseWav, {
    pitch: 1.56,
    rate: 1.0,
    gender: 'femenino',
    register: 'medio-alto',
  });
  const fionaParsed = decodeMonoWav(fionaWav)!;
  const fionaFreq = estimateZeroCrossingFreq(fionaParsed.samples, 24000);

  const jengibreWav = transformWavBuffer(baseWav, {
    pitch: 2.08,
    rate: 1.28,
    gender: 'masculino',
    register: 'muy-agudo',
  });
  const jengibreParsed = decodeMonoWav(jengibreWav)!;
  const jengibreFreq = estimateZeroCrossingFreq(jengibreParsed.samples, 24000);

  assert.ok(shrekFreq < baseFreq * 0.85, `Expected Shrek freq ${shrekFreq} < ${baseFreq * 0.85}`);
  assert.ok(fionaFreq > baseFreq * 1.2, `Expected Fiona freq ${fionaFreq} > ${baseFreq * 1.2}`);
  assert.ok(
    jengibreFreq > baseFreq * 1.45,
    `Expected Jengibre freq ${jengibreFreq} > ${baseFreq * 1.45}`,
  );
  // Rate 0.84 should make Shrek slightly longer than Fiona (1.0), and Jengibre (1.28) shorter
  assert.ok(shrekParsed.samples.length > fionaParsed.samples.length);
  assert.ok(fionaParsed.samples.length > jengibreParsed.samples.length);

  for (const buf of [shrekParsed.samples, fionaParsed.samples, jengibreParsed.samples]) {
    assert.ok(buf.every((s) => Number.isFinite(s)));
  }
});
