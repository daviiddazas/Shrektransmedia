import { VoiceRegister } from '../types/story';

export interface VocalSculptOptions {
  /** Character slider pitch (0.45..2.20, default 1.0) */
  pitch: number;
  /** Speaking rate (0.70..1.45, default 1.0) */
  rate?: number;
  gender?: 'masculino' | 'femenino';
  register?: VoiceRegister;
}

/**
 * Maps the UI pitch slider (0.45..2.20) to a natural acoustic fundamental-frequency
 * ratio (~0.72x to ~1.72x) so extreme characters sound clearly deep or "bien agudos"
 * without turning speech into metallic noise.
 */
export function mapVoicePitchToFrequencyRatio(
  pitch: number,
  register?: VoiceRegister,
): number {
  const clamped = Math.max(0.45, Math.min(2.25, Number.isFinite(pitch) ? pitch : 1.0));
  let ratio: number;
  if (clamped >= 1.0) {
    // 1.0 -> 1.0, 1.56 -> 1.32 (+4.8 st), 1.78 -> 1.46 (+6.5 st), 2.08 -> 1.66 (+8.8 st)
    ratio = 1.0 + (clamped - 1.0) * 0.61;
  } else {
    // 1.0 -> 1.0, 0.78 -> 0.87 (-2.4 st), 0.52 -> 0.71 (-5.9 st)
    ratio = 1.0 - (1.0 - clamped) * 0.6;
  }

  if (register === 'muy-agudo' && ratio < 1.52) {
    ratio = Math.max(ratio, 1.52);
  } else if (register === 'muy-grave' && ratio > 0.8) {
    ratio = Math.min(ratio, 0.8);
  }
  return Math.max(0.68, Math.min(1.78, ratio));
}

export function formatPitchDescription(pitch: number): string {
  const ratio = mapVoicePitchToFrequencyRatio(pitch);
  const semitones = Math.round(12 * Math.log2(ratio));
  const stLabel = semitones > 0 ? `+${semitones} st` : `${semitones} st`;
  if (pitch <= 0.64) return `Muy grave (${stLabel})`;
  if (pitch <= 0.88) return `Grave (${stLabel})`;
  if (pitch <= 1.12) return `Medio (${stLabel})`;
  if (pitch <= 1.34) return `Medio-alto (${stLabel})`;
  if (pitch <= 1.64) return `Brillante / Femenino (${stLabel})`;
  if (pitch <= 1.88) return `Agudo (${stLabel})`;
  return `Bien agudo (${stLabel})`;
}

/**
 * WSOLA (Waveform Similarity Overlap-Add) time-scaler on mono Float32 PCM.
 * Stretches/compresses audio duration by `stretchFactor` (>1 = longer, <1 = shorter)
 * while preserving original pitch and avoiding phase-cancellation artifacts.
 */
function wsolaTimeScale(
  input: Float32Array,
  sampleRate: number,
  stretchFactor: number,
): Float32Array {
  if (input.length < 512 || Math.abs(stretchFactor - 1.0) < 0.015) {
    return new Float32Array(input);
  }

  const winSize = Math.max(256, Math.round(sampleRate * 0.03)); // ~30 ms
  const halfWin = winSize >> 1;
  const synthesisHop = Math.max(64, Math.round(winSize / 3)); // ~10 ms
  const searchRadius = Math.max(32, Math.round(sampleRate * 0.006)); // +-6 ms

  const hann = new Float32Array(winSize);
  for (let i = 0; i < winSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (winSize - 1)));
  }

  const outLen = Math.max(winSize, Math.round(input.length * stretchFactor));
  const output = new Float32Array(outLen + winSize);
  const norm = new Float32Array(outLen + winSize);

  // Seed first frame directly
  for (let i = 0; i < winSize && i < input.length; i++) {
    output[i] += input[i] * hann[i];
    norm[i] += hann[i];
  }

  let outPos = synthesisHop;
  while (outPos + winSize < outLen) {
    const idealInPos = Math.round(outPos / stretchFactor);
    if (idealInPos + winSize >= input.length) break;

    const overlapStart = Math.max(0, idealInPos - searchRadius);
    const overlapEnd = Math.min(input.length - winSize - 1, idealInPos + searchRadius);

    let bestOffset = idealInPos;
    let bestCorr = -Infinity;

    // Cross-correlate candidate first half-window against already synthesized tail at outPos
    const stride = 3;
    for (let cand = overlapStart; cand <= overlapEnd; cand++) {
      let corr = 0;
      let energy = 1e-8;
      for (let j = 0; j < halfWin; j += stride) {
        const refVal = output[outPos + j];
        const candVal = input[cand + j];
        corr += refVal * candVal;
        energy += candVal * candVal;
      }
      const score = corr / Math.sqrt(energy);
      if (score > bestCorr) {
        bestCorr = score;
        bestOffset = cand;
      }
    }

    for (let j = 0; j < winSize; j++) {
      const w = hann[j];
      output[outPos + j] += input[bestOffset + j] * w;
      norm[outPos + j] += w;
    }

    outPos += synthesisHop;
  }

  const finalLen = outLen;
  const result = new Float32Array(finalLen);
  for (let i = 0; i < finalLen; i++) {
    result[i] = norm[i] > 1e-4 ? output[i] / norm[i] : (input[Math.min(input.length - 1, Math.round(i / stretchFactor))] ?? 0);
  }
  return result;
}

/**
 * Linear-interpolated resampler. Reading with `step > 1` raises pitch and shortens buffer;
 * reading with `step < 1` lowers pitch and lengthens buffer.
 */
function resampleLinear(input: Float32Array, step: number): Float32Array {
  if (input.length === 0 || Math.abs(step - 1.0) < 0.005) {
    return new Float32Array(input);
  }
  const outLen = Math.max(1, Math.floor((input.length - 1) / step));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * step;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx] ?? 0;
    const b = input[Math.min(input.length - 1, idx + 1)] ?? a;
    out[i] = a + (b - a) * frac;
  }
  return out;
}

interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

function makeHighPass(sampleRate: number, freq: number, q = 0.707): BiquadCoeffs {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  const a0 = 1 + alpha;
  return {
    b0: (1 + cosW0) / 2 / a0,
    b1: -(1 + cosW0) / a0,
    b2: (1 + cosW0) / 2 / a0,
    a1: (-2 * cosW0) / a0,
    a2: (1 - alpha) / a0,
  };
}

function makePeakingEq(
  sampleRate: number,
  freq: number,
  q: number,
  gainDb: number,
): BiquadCoeffs {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  const a0 = 1 + alpha / A;
  return {
    b0: (1 + alpha * A) / a0,
    b1: (-2 * cosW0) / a0,
    b2: (1 - alpha * A) / a0,
    a1: (-2 * cosW0) / a0,
    a2: (1 - alpha / A) / a0,
  };
}

function makeLowShelf(sampleRate: number, freq: number, gainDb: number): BiquadCoeffs {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = (sinW0 / 2) * Math.sqrt((A + 1 / A) * (1 / 0.9 - 1) + 2);
  const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;
  const a0 = A + 1 + (A - 1) * cosW0 + twoSqrtAAlpha;
  return {
    b0: (A * (A + 1 - (A - 1) * cosW0 + twoSqrtAAlpha)) / a0,
    b1: (2 * A * (A - 1 - (A + 1) * cosW0)) / a0,
    b2: (A * (A + 1 - (A - 1) * cosW0 - twoSqrtAAlpha)) / a0,
    a1: (-2 * (A - 1 + (A + 1) * cosW0)) / a0,
    a2: (A + 1 + (A - 1) * cosW0 - twoSqrtAAlpha) / a0,
  };
}

function applyBiquad(samples: Float32Array, c: BiquadCoeffs): Float32Array {
  const out = new Float32Array(samples.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i];
    const y0 = c.b0 * x0 + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
    out[i] = y0;
  }
  return out;
}

/**
 * Applies pitch shifting, pacing, and character formant EQ to mono PCM samples.
 */
export function applyVocalSculptingToPcm(
  input: Float32Array,
  sampleRate: number,
  options: VocalSculptOptions,
): Float32Array {
  if (input.length === 0) return new Float32Array(0);

  const pitchRatio = mapVoicePitchToFrequencyRatio(options.pitch, options.register);
  const rateRatio = Math.max(0.7, Math.min(1.45, options.rate ?? 1.0));

  // Stretch by pitchRatio / rateRatio, then resample by pitchRatio:
  // Net duration = input / rateRatio, net pitch = original * pitchRatio.
  const stretchFactor = pitchRatio / rateRatio;
  let signal = wsolaTimeScale(input, sampleRate, stretchFactor);
  signal = resampleLinear(signal, pitchRatio);

  // Character vocal-tract formant EQ
  if (options.gender === 'femenino') {
    signal = applyBiquad(signal, makeHighPass(sampleRate, 145));
    signal = applyBiquad(signal, makePeakingEq(sampleRate, 2850, 1.1, 3.8));
    signal = applyBiquad(signal, makePeakingEq(sampleRate, 4900, 1.2, 2.2));
  } else if (options.register === 'muy-grave' || pitchRatio <= 0.8) {
    signal = applyBiquad(signal, makeLowShelf(sampleRate, 165, 4.5));
    signal = applyBiquad(signal, makePeakingEq(sampleRate, 3200, 1.0, -2.5));
  } else if (options.register === 'muy-agudo' || pitchRatio >= 1.48) {
    signal = applyBiquad(signal, makeHighPass(sampleRate, 220));
    signal = applyBiquad(signal, makePeakingEq(sampleRate, 3400, 1.2, 4.0));
  } else if (options.register === 'agudo') {
    signal = applyBiquad(signal, makeHighPass(sampleRate, 175));
    signal = applyBiquad(signal, makePeakingEq(sampleRate, 2700, 1.2, 3.2));
  } else if (options.register === 'medio-alto') {
    signal = applyBiquad(signal, makePeakingEq(sampleRate, 2100, 1.1, 2.4));
  }

  // Soft-limiting normalization to prevent clipping
  let peak = 0;
  for (let i = 0; i < signal.length; i++) {
    const a = Math.abs(signal[i]);
    if (a > peak) peak = a;
  }
  if (peak > 0.96) {
    const gain = 0.94 / peak;
    for (let i = 0; i < signal.length; i++) {
      signal[i] *= gain;
    }
  }

  return signal;
}

interface ParsedWav {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  samples: Float32Array;
}

export function decodeMonoWav(wavBytes: Uint8Array): ParsedWav | null {
  if (wavBytes.byteLength < 44) return null;
  const view = new DataView(wavBytes.buffer, wavBytes.byteOffset, wavBytes.byteLength);

  // Check RIFF / WAVE magic
  if (
    view.getUint32(0, false) !== 0x52494646 || // RIFF
    view.getUint32(8, false) !== 0x57415645 // WAVE
  ) {
    return null;
  }

  let offset = 12;
  let sampleRate = 24000;
  let channels = 1;
  let bitsPerSample = 16;
  let dataStart = -1;
  let dataSize = 0;

  while (offset + 8 <= wavBytes.byteLength) {
    const chunkId = view.getUint32(offset, false);
    const chunkSize = view.getUint32(offset + 4, true);
    const bodyStart = offset + 8;

    if (chunkId === 0x666d7420 && bodyStart + 16 <= wavBytes.byteLength) {
      // 'fmt '
      channels = view.getUint16(bodyStart + 2, true);
      sampleRate = view.getUint32(bodyStart + 4, true);
      bitsPerSample = view.getUint16(bodyStart + 14, true);
    } else if (chunkId === 0x64617461) {
      // 'data'
      dataStart = bodyStart;
      dataSize = Math.min(chunkSize, wavBytes.byteLength - bodyStart);
      break;
    }

    offset = bodyStart + chunkSize + (chunkSize % 2);
  }

  if (dataStart < 0 || dataSize <= 0 || bitsPerSample !== 16) {
    return null;
  }

  const frameCount = Math.floor(dataSize / (2 * channels));
  const samples = new Float32Array(frameCount);
  for (let i = 0; i < frameCount; i++) {
    let sum = 0;
    for (let ch = 0; ch < channels; ch++) {
      const s = view.getInt16(dataStart + (i * channels + ch) * 2, true);
      sum += s / 32768;
    }
    samples[i] = sum / channels;
  }

  return { sampleRate, channels: 1, bitsPerSample: 16, samples };
}

export function encodeMonoWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const pcmBytes = samples.length * 2;
  const out = new Uint8Array(44 + pcmBytes);
  const view = new DataView(out.buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // RIFF
  view.setUint32(4, 36 + pcmBytes, true);
  view.setUint32(8, 0x57415645, false); // WAVE
  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // 'fmt '
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byteRate
  view.setUint16(32, 2, true); // blockAlign
  view.setUint16(34, 16, true); // bitsPerSample
  // data chunk
  view.setUint32(36, 0x64617461, false); // 'data'
  view.setUint32(40, pcmBytes, true);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }
  return out;
}

/**
 * Transforms an existing 16-bit WAV buffer according to character pitch, rate, gender, and register.
 */
export function transformWavBuffer(
  wavBytes: Uint8Array,
  options: VocalSculptOptions,
): Uint8Array {
  const parsed = decodeMonoWav(wavBytes);
  if (!parsed) return wavBytes;

  const pitchRatio = mapVoicePitchToFrequencyRatio(options.pitch, options.register);
  const rateRatio = options.rate ?? 1.0;
  const needsEq =
    options.gender === 'femenino' ||
    options.register === 'muy-grave' ||
    options.register === 'agudo' ||
    options.register === 'muy-agudo';

  if (
    Math.abs(pitchRatio - 1.0) < 0.015 &&
    Math.abs(rateRatio - 1.0) < 0.015 &&
    !needsEq
  ) {
    return wavBytes;
  }

  const sculpted = applyVocalSculptingToPcm(parsed.samples, parsed.sampleRate, options);
  return encodeMonoWav(sculpted, parsed.sampleRate);
}

export function wavBytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...sub);
  }
  return btoa(binary);
}

export function dataUrlToWavBytes(dataUrl: string): Uint8Array | null {
  const match = dataUrl.match(/^data:audio\/wav;base64,(.+)$/i);
  if (!match) return null;
  const b64 = match[1];
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function transformWavDataUrl(
  dataUrl: string,
  options: VocalSculptOptions,
): string {
  const bytes = dataUrlToWavBytes(dataUrl);
  if (!bytes) return dataUrl;
  const transformed = transformWavBuffer(bytes, options);
  if (transformed === bytes) return dataUrl;
  return `data:audio/wav;base64,${wavBytesToBase64(transformed)}`;
}
