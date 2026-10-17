/** Soft sound effects drawn as notes, so no audio files are shipped. */

export const SOUND_NAMES = ["tap", "correct", "star"] as const;
export type SoundName = (typeof SOUND_NAMES)[number];

export type Note = {
  hz: number;
  /** Seconds after the sound starts. */
  at: number;
  seconds: number;
  /** Peak volume, 0 to 1. */
  peak: number;
};

/** Nothing louder than this: the sounds are a pat on the back, not an alarm. */
export const MAX_PEAK = 0.15;
const ATTACK_SECONDS = 0.012;
const SILENCE = 0.0001;

export const RECIPES: Record<SoundName, Note[]> = {
  tap: [{ hz: 523, at: 0, seconds: 0.09, peak: 0.1 }],
  correct: [
    { hz: 523, at: 0, seconds: 0.16, peak: 0.12 },
    { hz: 659, at: 0.11, seconds: 0.16, peak: 0.12 },
    { hz: 784, at: 0.22, seconds: 0.28, peak: 0.12 },
  ],
  star: [
    { hz: 1319, at: 0, seconds: 0.14, peak: 0.07 },
    { hz: 1568, at: 0.08, seconds: 0.14, peak: 0.07 },
    { hz: 2093, at: 0.16, seconds: 0.22, peak: 0.07 },
  ],
};

/** Plays one sound on an audio context, starting `delay` seconds from now. */
export function playRecipe(ctx: AudioContext, name: SoundName, delay = 0): void {
  const start = ctx.currentTime + delay;
  for (const note of RECIPES[name]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const from = start + note.at;
    osc.type = "sine";
    osc.frequency.value = note.hz;
    gain.gain.setValueAtTime(SILENCE, from);
    gain.gain.linearRampToValueAtTime(note.peak, from + ATTACK_SECONDS);
    gain.gain.exponentialRampToValueAtTime(SILENCE, from + note.seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(from);
    osc.stop(from + note.seconds);
  }
}
