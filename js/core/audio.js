// 音频：BGM + 材质音效。首次触摸后解锁播放，静音状态保存在本地
const MUTE_KEY = 'repair_muted_v1';

const FILES = {
  bgm: 'audio/bgm.m4a',
  tap: 'audio/tap.m4a',
  snap: 'audio/snap.m4a',
  stitch: 'audio/stitch.m4a',
  rub: 'audio/rub.m4a',
  chime: 'audio/chime.m4a',
  fail: 'audio/fail.m4a'
};

const VOLUME = {
  bgm: 0.3,
  tap: 0.34,
  snap: 0.5,
  stitch: 0.36,
  rub: 0.26,
  chime: 0.5,
  fail: 0.34
};

const players = {};
let unlocked = false;
let muted = false;

try {
  muted = !!wx.getStorageSync(MUTE_KEY);
} catch (e) {
  muted = false;
}

Object.keys(FILES).forEach((key) => {
  try {
    const audio = wx.createInnerAudioContext();
    audio.src = FILES[key];
    audio.volume = VOLUME[key];
    audio.loop = key === 'bgm';
    players[key] = audio;
  } catch (e) {
    players[key] = null;
  }
});

function safePlay(key) {
  const audio = players[key];
  if (!audio) return;
  try {
    audio.stop();
    audio.play();
  } catch (e) {
    // 音频失败不影响游戏
  }
}

export function unlock() {
  if (unlocked) return;
  unlocked = true;
  if (!muted) safePlay('bgm');
}

export function play(key) {
  if (muted || !players[key]) return;
  safePlay(key);
}

export function playTap() {
  play('tap');
}

export function playMaterial(material) {
  if (material === 'fabric') play('stitch');
  else if (material === 'wood' || material === 'metal') play('rub');
  else play('snap');
}

export function toggleMute() {
  muted = !muted;
  try {
    wx.setStorageSync(MUTE_KEY, muted ? 1 : '');
  } catch (e) {
    // 忽略
  }
  const bgm = players.bgm;
  if (bgm) {
    if (muted) {
      try { bgm.pause(); } catch (e) {}
    } else if (unlocked) {
      safePlay('bgm');
    }
  }
  return muted;
}

export function isMuted() {
  return muted;
}

export function duckBgm(on) {
  const bgm = players.bgm;
  if (!bgm) return;
  bgm.volume = on ? 0.1 : VOLUME.bgm;
}
