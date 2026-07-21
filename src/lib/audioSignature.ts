/**
 * Audio "signature" → sunburst rays. The signature is the compact fixed-length
 * summary the mobile app produces (see audio-signature.md): time-aligned
 * `peak` (linear 0..255) and `rms` (dB-quantized 0..255) tracks. Here we either
 * parse that JSON directly, or decode a raw audio file in-browser into the same
 * shape, then turn it into ray lengths for the corona.
 *
 * Per the contract: `rms` carries the shape → normalize to the recording's own
 * max, apply perceptual (gamma) scaling, downsample to the ray count; `peak` is
 * used only to accent transient spikes.
 */
export interface AudioSignature {
  rms: number[];
  peak: number[];
  version?: number;
}

export interface RayData {
  /** Per-ray length, 0..1 (already normalized + perceptually scaled). */
  len: number[];
  /** Per-ray accent flag (a `peak` transient sits here). */
  accent: boolean[];
}

/** Max-in-bucket pooling from arbitrary length → `count` (length-agnostic). */
function maxPool(arr: number[], count: number): number[] {
  const n = arr.length;
  const out = new Array(count).fill(0);
  if (n === 0) return out;
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i * n) / count);
    const end = Math.max(start + 1, Math.floor(((i + 1) * n) / count));
    let m = 0;
    for (let j = start; j < end && j < n; j++) if (arr[j] > m) m = arr[j];
    out[i] = m;
  }
  return out;
}

/** Downsample + normalize + perceptual-scale a signature into ray lengths. */
export function toRays(rms: number[], peak: number[], count: number): RayData {
  const maxRms = rms.reduce((a, b) => (b > a ? b : a), 1);
  const maxPeak = peak.reduce((a, b) => (b > a ? b : a), 1);
  const rp = maxPool(rms, count);
  const pp = maxPool(peak, count);
  const len: number[] = new Array(count);
  const accent: boolean[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const norm = rp[i] / maxRms; // absolute → per-recording 0..1
    const scaled = Math.sqrt(norm < 0 ? 0 : norm); // gamma 0.5 (perceptual)
    len[i] = Math.max(0.04, Math.min(1, scaled)); // small floor so quiet rays still show
    accent[i] = pp[i] / maxPeak > 0.5;
  }
  return { len, accent };
}

/** Parse an uploaded audio-signature `.json` (the mobile contract). */
export function parseSignatureJSON(text: string): AudioSignature {
  const obj = JSON.parse(text);
  if (!obj || !Array.isArray(obj.rms) || !Array.isArray(obj.peak)) {
    throw new Error("Not an audio signature — expected rms[] and peak[] arrays.");
  }
  if (obj.rms.length === 0) {
    throw new Error("Audio signature has no samples.");
  }
  return { rms: obj.rms.map(Number), peak: obj.peak.map(Number), version: obj.version };
}

const SIGNATURE_SAMPLES = 2048;
const BUCKET_MS = 20;

/** Decode a raw audio file in the browser into the same {peak, rms} shape. */
export async function decodeAudioToSignature(file: File): Promise<AudioSignature> {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  let audioBuf: AudioBuffer;
  try {
    audioBuf = await ctx.decodeAudioData(await file.arrayBuffer());
  } finally {
    ctx.close?.();
  }

  const chN = audioBuf.numberOfChannels;
  const chans: Float32Array[] = [];
  for (let c = 0; c < chN; c++) chans.push(audioBuf.getChannelData(c));
  const frames = audioBuf.length;
  const bucketSize = Math.max(1, Math.round((audioBuf.sampleRate * BUCKET_MS) / 1000));
  const nBuckets = Math.ceil(frames / bucketSize);

  const peakEnv: number[] = new Array(nBuckets);
  const rmsEnv: number[] = new Array(nBuckets);
  for (let b = 0; b < nBuckets; b++) {
    const s = b * bucketSize;
    const e = Math.min(frames, s + bucketSize);
    let pk = 0;
    let sumSq = 0;
    let cnt = 0;
    for (let i = s; i < e; i++) {
      let v = 0;
      for (let c = 0; c < chN; c++) v += chans[c][i];
      v /= chN;
      const a = v < 0 ? -v : v;
      if (a > pk) pk = a;
      sumSq += v * v;
      cnt++;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, cnt));
    peakEnv[b] = Math.round(Math.min(1, pk) * 255);
    const db = 20 * Math.log10(Math.max(1e-6, rms)); // -inf..0
    const clamped = Math.max(-60, Math.min(0, db));
    rmsEnv[b] = Math.round(((clamped + 60) / 60) * 255);
  }

  return {
    version: 1,
    peak: maxPool(peakEnv, SIGNATURE_SAMPLES),
    rms: maxPool(rmsEnv, SIGNATURE_SAMPLES),
  };
}

/** Load either a `.json` signature or a raw audio file into a signature. */
export async function loadSignatureFile(file: File): Promise<AudioSignature> {
  const isJson = file.type.includes("json") || file.name.toLowerCase().endsWith(".json");
  return isJson ? parseSignatureJSON(await file.text()) : decodeAudioToSignature(file);
}
