// Short native WebAudio arrangements, not NES ROM data or an APU emulation.
const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function notes(sequence, beat, wave, volume) {
  let time = 0;
  const events = [];
  for (const token of sequence.trim().split(/\s+/)) {
    const [name, length = '1'] = token.split(':');
    const duration = Number(length) * beat;
    if (name !== 'R') {
      const match = /^([A-G])([#b]?)(\d)$/.exec(name);
      const midi = (Number(match[3]) + 1) * 12 + SEMITONES[match[1]] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
      events.push({ time, duration: duration * 0.83, frequency: 440 * 2 ** ((midi - 69) / 12), wave, volume });
    }
    time += duration;
  }
  return { events, length: time };
}
function song(lead, bass, beat, loop = true, harmony = '') {
  const channels = [notes(lead, beat, 'square', 0.065), notes(bass, beat, 'triangle', 0.12)];
  if (harmony) channels.push(notes(harmony, beat, 'square', 0.028));
  return { events: channels.flatMap(c => c.events).sort((a, b) => a.time - b.time),
    length: Math.max(...channels.map(c => c.length)), loop };
}
const GROUND = 'E5 E5 R E5 R C5 E5 R G5:2 R:2 G4:2 R:2 C5:2 R G4 R:2 E4:2 R A4 R B4 R Bb4 A4:2 G4:1.5 E5:1.5 G5 A5:2 F5 G5 R E5 R C5 D5 B4:2 R:2 C5:2 R G4 R:2 E4:2 R A4 R B4 R Bb4 A4:2 G4:1.5 E5:1.5 G5 A5:2 F5 G5 R E5 R C5 D5 B4:2 R:2 R:2 G5 F#5 F5 D#5:2 E5 R G#4 A4 C5 R A4 C5 D5 R:2 G5 F#5 F5 D#5:2 E5 R C6 R C6 C6 R:3 R:2 G5 F#5 F5 D#5:2 E5 R G#4 A4 C5 R A4 C5 D5 R:2 Eb5:2 R D5 R C5:3 R:3';
const GROUND_BASS = 'D3 D3 R D3 R D3 D3 R G3:2 R:2 G2:2 R:2 G3:2 R E3 R:2 C3:2 R F3 R G3 R Gb3 F3:2 E3:1.5 C4:1.5 E4 F4:2 D4 E4 R C4 R A3 B3 G3:2 R:2 G3:2 R E3 R:2 C3:2 R F3 R G3 R Gb3 F3:2 E3:1.5 C4:1.5 E4 F4:2 D4 E4 R C4 R A3 B3 G3:2 R:2 C3:2 G3:2 C4:2 G3:2 F3:2 C4:2 F4:2 C4:2 C3:2 G3:2 C4:2 G3:2 G2:2 D3:2 G3:2 D3:2 C3:2 G3:2 C4:2 G3:2 F3:2 C4:2 F4:2 C4:2 Ab2:2 Eb3:2 Ab3:2 Bb3:2 C3:4 R:4';
const TRACKS = {
  // Named-note transcriptions of CastleMusData, WaterMusData and VictoryMusData.
  castle: song('G4:5 A#4:5 G4:5 A4:5 G4:5 G#4:5 G4:5 A4:5 G4:5 A#4:5 G4:5 B4:5 G4:5 A#4:5 G4:5 A4:5 G4:5 A#4:5 G4:5 A4:5 G4:5 G#4:5 G4:5 A4:5 G4:5 A#4:5 G4:5 B4:5 G4:5 A#4:5 G4:5 A4:5 F#4:5 A4:5 F#4:5 G#4:5 F#4:5 A4:5 F#4:5 A#4:5 F#4:5 A4:5 F#4:5 A#4:5 F#4:5 A4:5 F#4:5 G#4:5 F#4:5 A4:5 F#4:5 G#4:5 F#4:5 A4:5 F#4:5 A#4:5 F#4:5 A4:5 F#4:5 A#4:5 F#4:5 A4:5 F#4:5 G#4:5 A#4:5 D5:5 A#4:5 D#5:5 A#4:5 D5:5 A#4:5 C#5:5 A#4:5 D5:5 A#4:5 C#5:5 A#4:5 C5:5 A#4:5 C#5:5 A#4:5 D5:5 A#4:5 D#5:5 A#4:5 D5:5 A#4:5 C#5:5 A#4:5 D5:5 A#4:5 C#5:5 A#4:5 C5:5 A#4:5 C#5:5',
    'D#3:80 D3:40 F#3:40 F3:80 E3:40 A#3:40 A3:40 E3:40 D#3:40 E3:40', 1 / 60),
  water: song('D4:16 E4:16 F#4:16 G4:16 A4:16 A#4:16 B4:8 B4:8 B4:8 R:8 B4:8 R:8 B4:32 G4:16 E5:48 D#5:48 E5:48 R:8 G4:8 A4:8 B4:8 C5:8 D5:8 E5:48 D#5:32 F5:16 E5:64 R:24 G4:8 D5:48 C#5:48 D5:48 R:8 G4:8 A4:8 B4:8 C5:8 C#5:8 D5:48 G4:32 F5:16 E5:64 R:24 G4:8 G5:48 G5:48 G5:48 G5:16 A5:8 R:16 G5:8 F5:48 F5:48 F5:48 F5:16 G5:8 R:16 F5:8 E5:48 A4:16 B4:16 F5:16 E5:8 E5:8 E5:24 B4:8 C5:48',
    'R:64 R:64 G3:16 G3:48 C3:16 G3:16 C4:16 B2:16 G3:16 B3:16 C3:16 G3:16 C4:16 E3:16 G3:16 C4:16 C3:16 G3:16 C4:16 B2:16 G3:16 B3:16 C3:16 G3:16 C4:16 E3:16 G3:16 C4:16 D3:16 G3:16 B3:16 C#3:16 F#3:16 A#3:16 D3:16 G3:16 B3:16 B2:16 G3:16 B3:16 D3:16 G3:16 B3:16 B2:16 G3:16 B3:16 C3:16 G3:16 C4:16 G2:16 G3:16 C4:16 C3:16 G3:16 E4:16 B2:16 G3:16 D4:16 A#2:16 G3:16 C#4:16 C#3:16 G3:16 E4:16 D3:16 A3:16 F4:16 C#3:16 A3:16 F4:16 C3:16 A3:16 F4:16 B2:16 G3:16 F4:16 C2:16 G3:16 E4:16 G2:16 G3:16 G3:16 F3:8 F3:8 F3:24 B2:8 C3:48', 1 / 60),
  ending: song('R:24 G3:48 A3:24 A#3:24 B3:48 E4:24 G4:24 F4:24 G4:24 A4:24 D4:24 F4:24 R:24 E4:24',
    'B2:24 C3:24 R:24 D3:24 D#3:24 E3:24 C3:24 A3:24 G3:24 F3:24 E3:24 D3:24 F3:24 G3:24 G2:24 C3:24', 1 / 60, false),
  ground: song(GROUND, GROUND_BASS, 0.135),
  hurry: song(GROUND, GROUND_BASS, 0.103),
  underground: song('C3 C4 A2 A3 Bb2 Bb3 R:2 C3 C4 A2 A3 Bb2 Bb3 R:2 F2 F3 D2 D3 Eb2 Eb3 R:2 F2 F3 D2 D3 Eb2 Eb3 R:2 Eb3:.5 D3:.5 Db3:.5 C3:1.5 Eb3:1.5 D3:1.5 Ab2:1.5 G2:1.5 Db3:1.5 C3:1.5 B2:1.5 Bb2:1.5 R:4',
    'C2:2 R:2 A1:2 R:2 Bb1:2 R:2 C2:2 R:2 F1:2 R:2 D1:2 R:2 Eb1:2 R:2 F1:2 R:2 Ab1:4 G1:4 C2:4 R:4', 0.145),
  star: song('C5 C5 C5 R C5 R C5 C5 R C5 R C5 R C5:2 R F4 F4 F4 R F4 R F4 F4 R F4 R F4 R F4:2 R C5 C5 C5 R C5 R C5 C5 R C5 R C5 R C5:2 R F4 F4 F4 R F4 R F4 F4 R F4 R F4 R F4:2 R',
    'D4 D4 D4 R D4 R D4 D4 R D4 R D4 R D4:2 R G3 G3 G3 R G3 R G3 G3 R G3 R G3 R G3:2 R D4 D4 D4 R D4 R D4 D4 R D4 R D4 R D4:2 R G3 G3 G3 R G3 R G3 G3 R G3 R G3 R G3:2 R', 0.115),
  end: song('G4:.67 C5:.67 E5:.67 G5:.67 C6:.67 E6:.67 G6:2 E6:2 Ab4:.67 C5:.67 Eb5:.67 Ab5:.67 C6:.67 Eb6:.67 Ab6:2 Eb6:2 Bb4:.67 D5:.67 F5:.67 Bb5:.67 D6:.67 F6:.67 Bb6:2 B6 B6 B6 C7:4',
    'C3:4 G3:4 Ab2:4 Eb3:4 Bb2:4 F3:4 G3:3 C3:4', 0.15, false),
  death: song('C5:.5 C5:.5 R:.5 C5:.5 R:.5 B4:.5 C5:1.5 R:.5 E4:1.5 A4:1.5 G4:1.5 E4:1.5 C4:1.5 F4:1.5 E4:1.5 D4:1.5 C4:3 R:2',
    'C3:2 R C3:2 R Ab2:3 G2:3 F2:3 E2:3 C2:3', 0.14, false),
};
for (const name of ['underground', 'castle', 'water', 'star']) {
  const track = TRACKS[name], ratio = 0.103 / 0.135;
  TRACKS[name + 'Hurry'] = { ...track, length: track.length * ratio,
    events: track.events.map(note => ({ ...note, time: note.time * ratio, duration: note.duration * ratio })) };
}
const SFX = {
  axe: [[523, 1047, .1, 'square']],
  bridge: [[150, 40, .12, 'noise']],
  blast: [[110, 35, .18, 'noise']],
  jump: [[330, 660, .13, 'square']],
  coin: [[988, 988, .07, 'square'], [1319, 1319, .22, 'square']],
  bump: [[150, 55, .09, 'triangle']],
  break: [[170, 45, .15, 'noise']],
  powerup: [[262, 523, .12, 'square'], [330, 659, .12, 'square'], [392, 784, .12, 'square'], [523, 1047, .18, 'square']],
  spawn: [[196, 294, .07, 'square'], [262, 392, .07, 'square'], [330, 494, .07, 'square'], [392, 587, .07, 'square'], [523, 784, .12, 'square']],
  stomp: [[400, 90, .10, 'square']],
  kick: [[160, 50, .10, 'noise']],
  fire: [[760, 130, .11, 'noise']],
  hurt: [[660, 220, .1, 'square'], [440, 110, .1, 'square'], [220, 55, .18, 'square']],
  oneup: [[659, 659, .09, 'square'], [784, 784, .09, 'square'], [1319, 1319, .09, 'square'], [1047, 1047, .09, 'square'], [1175, 1175, .09, 'square'], [1568, 1568, .22, 'square']],
  pipe: [[220, 110, .09, 'square'], [196, 98, .09, 'square'], [165, 82, .09, 'square']],
  flag: [[784, 196, .5, 'triangle']],
  hurry: [[659, 659, .06, 'square'], [784, 784, .06, 'square'], [1319, 1319, .06, 'square'], [1047, 1047, .06, 'square'], [1175, 1175, .06, 'square'], [1568, 1568, .13, 'square']],
};

export function createAudio() {
  let context = null, master = null, noise = null;
  let destroyed = false, muted = false, unlocked = false, pendingUnlock = null;
  let latest = null, seenGame = null, seenFrame = null, seenEvents = null;
  let track = null, trackName = null, origin = 0, index = 0, cycle = 0, finished = false;
  let lastCue = null;
  const voices = new Set();

  function cancel() {
    for (const voice of voices) {
      voice.source.onended = null;
      voice.source.stop();
      voice.source.disconnect();
      voice.gain.disconnect();
    }
    voices.clear();
    track = null; trackName = null; index = 0; cycle = 0; finished = false;
  }

  function voice(frequency, endFrequency, start, duration, wave, volume) {
    if (!context || muted || destroyed || !unlocked) return;
    const gain = context.createGain();
    const source = wave === 'noise' ? context.createBufferSource() : context.createOscillator();
    if (wave === 'noise') {
      if (!noise) {
        noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const data = noise.getChannelData(0);
        let register = 1;
        for (let i = 0; i < data.length; i++) {
          register = (register >> 1) | (((register ^ (register >> 1)) & 1) << 14);
          data[i] = (register & 1) ? 0.7 : -0.7;
        }
      }
      source.buffer = noise;
      source.loop = true;
      source.playbackRate.setValueAtTime(frequency / 440, start);
      source.playbackRate.exponentialRampToValueAtTime(Math.max(0.02, endFrequency / 440), start + duration);
    } else {
      source.type = wave;
      source.frequency.setValueAtTime(frequency, start);
      source.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    }
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + Math.min(.003, duration / 4));
    gain.gain.setValueAtTime(volume, start + duration * .7);
    gain.gain.linearRampToValueAtTime(0, start + duration);
    source.connect(gain); gain.connect(master);
    const entry = { source, gain };
    voices.add(entry);
    source.onended = () => { source.disconnect(); gain.disconnect(); voices.delete(entry); };
    source.start(start); source.stop(start + duration + .002);
  }

  function effect(type) {
    const sequence = SFX[type];
    if (!sequence) return;
    let time = context.currentTime + .005;
    for (const [from, to, duration, wave] of sequence) {
      voice(from, to, time, duration, wave, wave === 'noise' ? .07 : .09);
      time += duration;
    }
  }

  function desired(game) {
    if (game.status === 'dying') return 'death';
    if (game.status === 'gameover') return trackName === 'death' ? 'death' : null;
    if (game.status === 'won' || (game.status === 'flag' && game.finish?.kind === 'ending' && game.finish.phase === 'ending')) return 'ending';
    if (game.status === 'flag' && ['castle', 'ending'].includes(game.finish?.kind) && game.finish.phase === 'bridge') return null;
    if (game.status === 'flag' || game.status === 'clear') return 'end';
    if (game.status !== 'playing') return null;
    if (game.player.invincible > 0) return 'star';
    const theme = game.world?.theme ?? game.area;
    const biome = theme === 'underground' || theme === 'castle' ? theme
      : theme === 'underwater' ? 'water' : theme === 'sky' ? 'star' : 'ground';
    return game.time <= 100 ? biome === 'ground' ? 'hurry' : biome + 'Hurry' : biome;
  }

  function music(game, name, cue, newCue) {
    // Automatic respawn leaves the death melody intact until its final note finishes.
    if (trackName === 'death' && game.status === 'playing' && context.currentTime < origin + track.length) return;
    if (name !== trackName || newCue) {
      cancel();
      if (!name || (cue && !newCue)) return;
      trackName = name; track = TRACKS[name]; origin = context.currentTime + .01;
    }
    if (!track || finished) return;
    const now = context.currentTime;
    // One-shots must finish even when gameover/won stops simulation updates.
    const horizon = track.loop ? now + .12 : origin + track.length;
    // Drop stale scheduled beats after a suspended tab instead of emitting a burst.
    if (origin + cycle * track.length + track.events[index].time < now - .2) {
      if (!track.loop) { finished = true; return; }
      origin = now + .01; index = 0; cycle = 0;
    }
    while (!finished) {
      const note = track.events[index], start = origin + cycle * track.length + note.time;
      if (start > horizon) break;
      if (start >= now - .015)
        voice(note.frequency, note.frequency, Math.max(now, start), note.duration, note.wave, note.volume);
      index++;
      if (index === track.events.length) {
        index = 0;
        if (track.loop) cycle++;
        else finished = true;
      }
    }
  }

  function remember(game) {
    const fresh = game !== seenGame || game.frame !== seenFrame || game.events !== seenEvents;
    seenGame = game; seenFrame = game.frame; seenEvents = game.events;
    return fresh;
  }

  function sync(game) {
    if (destroyed) return;
    latest = game;
    const fresh = remember(game);
    const name = desired(game);
    const cue = name && !TRACKS[name].loop ? name : null;
    const newCue = cue && cue !== lastCue;
    // Leaving a cue resets its identity even when playback is unavailable.
    if (!cue) lastCue = null;
    if (!context || !unlocked || muted || context.state !== 'running') return;
    music(game, name, cue, newCue);
    if (cue && trackName === name) lastCue = cue;
    if (!fresh) return;
    if (game.status === 'flag' && game.finish?.phase === 'bridge') {
      for (const event of game.events) if (event.type === 'axe' || event.type === 'bridge') effect(event.type);
      return;
    }
    // Death and completion own their full melody; later tick events must not interrupt it.
    if (game.status === 'dying' || game.status === 'gameover' || game.status === 'flag' || game.status === 'clear' || game.status === 'won') return;
    for (const event of game.events) effect(event.type);
  }

  async function unlock() {
    if (destroyed) return false;
    if (pendingUnlock) return pendingUnlock;
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) return false;
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = muted ? 0 : .7;
      master.connect(context.destination);
    }
    const target = context;
    pendingUnlock = (async () => {
      try {
        await (target.state === 'suspended' ? target.resume() : Promise.resolve());
        if (destroyed || target !== context || target.state === 'closed') return false;
        unlocked = true;
        if (latest && !muted) sync(latest);
        return true;
      } catch {
        return false;
      } finally {
        pendingUnlock = null;
      }
    })();
    return pendingUnlock;
  }

  function setMuted(value) {
    if (destroyed) return;
    const next = Boolean(value);
    if (muted === next) return;
    muted = next;
    if (master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(muted ? 0 : .7, context.currentTime);
    }
    cancel();
  }

  function stop() {
    if (destroyed) return;
    latest = null;
    cancel();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true; unlocked = false; latest = null;
    cancel();
    if (master) master.disconnect();
    if (context && context.state !== 'closed') context.close().catch(() => {});
    context = null; master = null; noise = null;
  }

  return { unlock, setMuted, sync, stop, destroy };
}
