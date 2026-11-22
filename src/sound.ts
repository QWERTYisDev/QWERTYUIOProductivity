// Tiny synthesized System sounds (no audio files). Browsers only allow audio after a tap, so the context is unlocked on first touch.
export type Sfx = 'clear' | 'buy' | 'level' | 'talent' | 'hit' | 'win' | 'lose' | 'stat';
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}
export const unlockAudio = () => { ac(); };

function tone(c: AudioContext, f: number, t0: number, dur: number, vol: number, type: OscillatorType = 'sine', f2?: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.03);
}

export function play(k: Sfx) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  switch (k) {
    case 'clear': tone(c, 880, t, 0.35, 0.12); tone(c, 1320, t + 0.09, 0.5, 0.1); tone(c, 1760, t + 0.09, 0.3, 0.04); break;
    case 'buy': tone(c, 1568, t, 0.18, 0.1); tone(c, 2093, t + 0.08, 0.3, 0.1); break;
    case 'level': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(c, f, t + i * 0.1, 0.6, 0.1)); tone(c, 262, t, 1, 0.08, 'triangle'); break;
    case 'talent': tone(c, 196, t, 0.6, 0.12, 'triangle'); tone(c, 784, t + 0.15, 0.6, 0.1); tone(c, 1175, t + 0.3, 0.8, 0.08); break;
    case 'stat': tone(c, 520, t, 0.14, 0.1, 'triangle', 800); tone(c, 1040, t + 0.07, 0.22, 0.09); break;
    case 'hit': tone(c, 170, t, 0.18, 0.22, 'sawtooth', 45); break;
    case 'win': [392, 523, 659, 784].forEach((f, i) => tone(c, f, t + i * 0.12, 0.7, 0.1)); break;
    case 'lose': [330, 262, 196].forEach((f, i) => tone(c, f, t + i * 0.18, 0.6, 0.1, 'triangle')); break;
  }
}

let sw: HTMLLabelElement | null = null;
/** Vibration where supported; on iPhone Safari (no Vibration API) falls back to the switch-checkbox haptic trick (iOS 17.4+). */
export function haptic(ms = 25) {
  try {
    if (navigator.vibrate) { navigator.vibrate(ms); return; }
    if (!sw) {
      sw = document.createElement('label');
      sw.style.cssText = 'position:fixed;left:-99px;top:0;opacity:0;pointer-events:none';
      sw.innerHTML = '<input type="checkbox" switch>';
      document.body.appendChild(sw);
    }
    sw.click();
  } catch { /* unsupported */ }
}
