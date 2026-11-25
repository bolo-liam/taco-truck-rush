// Taco Truck Rush — tiny WebAudio synth: no audio files, every sound is
// generated in code so the game stays fully offline.

const TacoSounds = (function () {
  let ctx = null;

  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Play one short oscillator blip.
  function blip(freq, seconds, type, gainValue, when) {
    const ac = ensureContext();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue || 0.12, ac.currentTime + (when || 0));
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + (when || 0) + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + (when || 0));
    osc.stop(ac.currentTime + (when || 0) + seconds + 0.02);
  }

  return {
    // Warm-up call from the first user gesture (autoplay policy).
    unlock: ensureContext,
    // Grill finished: a bright two-note ding.
    ding() { blip(880, 0.12, 'sine', 0.14); blip(1318, 0.18, 'sine', 0.12, 0.09); },
    // Chopping done: a quick wooden knock.
    chop() { blip(220, 0.07, 'square', 0.08); blip(180, 0.07, 'square', 0.08, 0.08); },
    // Correct serve: happy cha-ching arpeggio.
    chaChing() { blip(523, 0.1, 'triangle', 0.14); blip(659, 0.1, 'triangle', 0.14, 0.08); blip(784, 0.16, 'triangle', 0.16, 0.16); },
    // Wrong serve: low buzz.
    buzz() { blip(140, 0.25, 'sawtooth', 0.12); },
    // Customer walked away: sad slide down.
    walkAway() { blip(392, 0.14, 'sine', 0.1); blip(262, 0.22, 'sine', 0.1, 0.12); },
    // Shift over: little fanfare.
    fanfare() { blip(523, 0.12, 'triangle', 0.14); blip(659, 0.12, 'triangle', 0.14, 0.1); blip(784, 0.12, 'triangle', 0.14, 0.2); blip(1046, 0.3, 'triangle', 0.16, 0.3); },
  };
})();
