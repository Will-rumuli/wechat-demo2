// 存档：进度、铜板、工具、体力、记忆。云端与本地合并，换设备不丢
import { repairApi } from './cloud.js';
import { loadUser } from './user.js';
import { emptyTools, toolByKey } from '../data/tools.js';
import { LEVELS } from '../data/levels.js';

const KEY = 'repair_save_v1';
export const MAX_STAMINA = 10;
export const AD_STAMINA = 3;

let cache = null;
let pushTimer = null;

export function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function emptySave() {
  return {
    version: 1,
    coins: 0,
    staminaDate: todayKey(),
    staminaUsed: 0,
    staminaBonus: 0,
    completed: {},
    tools: emptyTools(),
    seenIntro: false,
    updatedAt: Date.now()
  };
}

function normalize(save) {
  const base = emptySave();
  const data = save && typeof save === 'object' ? save : {};
  const out = {
    version: 1,
    coins: Math.max(0, Number(data.coins) || 0),
    staminaDate: data.staminaDate || base.staminaDate,
    staminaUsed: Math.max(0, Number(data.staminaUsed) || 0),
    staminaBonus: Math.max(0, Math.min(AD_STAMINA, Number(data.staminaBonus) || 0)),
    completed: data.completed && typeof data.completed === 'object' ? data.completed : {},
    tools: { ...emptyTools(), ...(data.tools || {}) },
    seenIntro: !!data.seenIntro,
    updatedAt: Number(data.updatedAt) || Date.now()
  };
  Object.keys(out.tools).forEach((key) => {
    out.tools[key] = Math.max(0, Math.min(3, Number(out.tools[key]) || 0));
  });
  Object.keys(out.completed).forEach((id) => {
    const item = out.completed[id] || {};
    out.completed[id] = {
      stars: Math.max(1, Math.min(3, Number(item.stars) || 1)),
      choice: item.choice === 'client' || item.choice === 'hide' ? 'client' : 'object',
      quote: String(item.quote || ''),
      at: Number(item.at) || 0
    };
  });
  return out;
}

function readLocal() {
  try {
    const raw = wx.getStorageSync(KEY);
    if (!raw) return null;
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return normalize(data);
  } catch (e) {
    return null;
  }
}

function writeLocal(save) {
  try {
    wx.setStorageSync(KEY, save);
  } catch (e) {
    // 忽略存储失败
  }
}

function resetDaily(save) {
  const today = todayKey();
  if (save.staminaDate !== today) {
    save.staminaDate = today;
    save.staminaUsed = 0;
    save.staminaBonus = 0;
  }
  return save;
}

export function getSave() {
  if (!cache) {
    cache = resetDaily(readLocal() || emptySave());
  }
  return cache;
}

function cloudUser() {
  const user = loadUser();
  if (!user || user.local || !user.id) return null;
  return user;
}

function pushCloud(save) {
  if (!cloudUser()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    repairApi.writeSave(save);
  }, 700);
}

// 本地保存 + 延迟上云
export function persist() {
  const save = getSave();
  save.updatedAt = Date.now();
  writeLocal(save);
  pushCloud(save);
  return save;
}

export function saveNow() {
  const save = getSave();
  resetDaily(save);
  writeLocal(save);
  if (cloudUser()) repairApi.writeSave(save);
  return save;
}

export function staminaLeft() {
  const save = getSave();
  return Math.max(0, MAX_STAMINA + save.staminaBonus - save.staminaUsed);
}

export function useStamina() {
  const save = getSave();
  resetDaily(save);
  if (staminaLeft() <= 0) return false;
  save.staminaUsed += 1;
  persist();
  return true;
}

export function grantAdStamina() {
  const save = getSave();
  resetDaily(save);
  if (save.staminaBonus >= AD_STAMINA) return false;
  save.staminaBonus = AD_STAMINA;
  persist();
  return true;
}

export function addCoins(amount) {
  const save = getSave();
  save.coins = Math.max(0, save.coins + Math.round(amount || 0));
  persist();
  return save.coins;
}

export function spendCoins(amount) {
  const save = getSave();
  if (save.coins < amount) return false;
  save.coins -= amount;
  persist();
  return true;
}

export function upgradeTool(key) {
  const save = getSave();
  const def = toolByKey(key);
  const level = save.tools[key] || 0;
  if (level >= 3) return { ok: false, reason: 'max' };
  const cost = def.costs[level];
  if (save.coins < cost) return { ok: false, reason: 'coins' };
  save.coins -= cost;
  save.tools[key] = level + 1;
  persist();
  return { ok: true, level: level + 1, cost };
}

export function completeLevel(id, stars, choice, quote) {
  const save = getSave();
  const old = save.completed[id];
  save.completed[id] = {
    stars: Math.max(old ? old.stars : 0, stars),
    choice,
    quote,
    at: Date.now()
  };
  persist();
  return save.completed[id];
}

export function isComplete(id) {
  return !!getSave().completed[id];
}

export function completedCount() {
  const save = getSave();
  return LEVELS.filter((item) => !!save.completed[item.id]).length;
}

export function nextLevel() {
  const save = getSave();
  return LEVELS.find((item) => !save.completed[item.id]) || null;
}

export function markIntroSeen() {
  const save = getSave();
  if (save.seenIntro) return;
  save.seenIntro = true;
  persist();
}

// 两份存档合并：完成记录取星数高者，铜板与工具取最大，体力按当天保守合并
export function mergeSaves(a, b) {
  const A = normalize(a);
  const B = normalize(b);
  const out = emptySave();
  out.coins = Math.max(A.coins, B.coins);
  out.seenIntro = A.seenIntro || B.seenIntro;
  out.tools = emptyTools();
  Object.keys(out.tools).forEach((key) => {
    out.tools[key] = Math.max(A.tools[key] || 0, B.tools[key] || 0);
  });
  out.completed = { ...A.completed };
  Object.keys(B.completed).forEach((id) => {
    const x = out.completed[id];
    const y = B.completed[id];
    if (!x || (y.at || 0) >= (x.at || 0)) out.completed[id] = y;
    else out.completed[id] = { ...y, stars: Math.max(x.stars, y.stars) };
  });
  const today = todayKey();
  const aToday = A.staminaDate === today;
  const bToday = B.staminaDate === today;
  out.staminaDate = aToday || bToday ? today : (A.staminaDate > B.staminaDate ? A.staminaDate : B.staminaDate);
  out.staminaUsed = Math.max(aToday ? A.staminaUsed : 0, bToday ? B.staminaUsed : 0);
  out.staminaBonus = Math.max(aToday ? A.staminaBonus : 0, bToday ? B.staminaBonus : 0);
  out.updatedAt = Date.now();
  return out;
}

// 启动时拉取云存档并与本地合并，失败就继续用本地
export async function pullCloudSave() {
  if (!cloudUser()) return null;
  const res = await repairApi.loadSave();
  if (!res || !res.ok || !res.save) return null;
  const local = getSave();
  const merged = mergeSaves(local, res.save);
  cache = merged;
  writeLocal(merged);
  pushCloud(merged);
  return merged;
}
