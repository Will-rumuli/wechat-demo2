// 账号：启动即静默登录，用 openid 作为唯一标识；离线时用本地账号，不打断游戏
import { repairApi } from './cloud.js';

const KEY = 'repair_user_v1';

let cached = null;

function digits(n) {
  let out = '';
  for (let i = 0; i < n; i += 1) out += Math.floor(Math.random() * 10);
  return out;
}

function stableDigits(id, n) {
  const str = String(id || '');
  let h = 7;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) % 100000;
  }
  return String(h).padStart(n, '0').slice(-n);
}

function normalize(user) {
  if (!user || !user.nickName) return null;
  return {
    id: user.id || `local_${Date.now()}`,
    nickName: String(user.nickName).slice(0, 12),
    local: !!user.local,
    createdAt: user.createdAt || Date.now()
  };
}

export function loadUser() {
  if (cached) return cached;
  try {
    const raw = wx.getStorageSync(KEY);
    const data = raw && typeof raw === 'string' ? JSON.parse(raw) : raw;
    cached = normalize(data);
  } catch (e) {
    cached = null;
  }
  return cached;
}

export function saveUser(user) {
  cached = normalize(user);
  if (!cached) return null;
  try {
    wx.setStorageSync(KEY, cached);
  } catch (e) {
    // 本地存储失败不影响本局
  }
  return cached;
}

export function localLogin() {
  return saveUser({
    id: `local_${Date.now()}_${digits(3)}`,
    nickName: `修复师${digits(4)}`,
    local: true
  });
}

export function wechatLogin() {
  return new Promise((resolve) => {
    if (typeof wx === 'undefined' || !wx.login) {
      resolve(null);
      return;
    }
    try {
      wx.login({
        success: async (res) => {
          if (!res || !res.code) {
            resolve(null);
            return;
          }
          const out = await repairApi.whoami();
          if (!out || !out.ok || !out.openid) {
            resolve(null);
            return;
          }
          resolve(saveUser({
            id: out.openid,
            nickName: out.nickName || `修复师${stableDigits(out.openid, 4)}`,
            local: false
          }));
        },
        fail: () => resolve(null)
      });
    } catch (e) {
      resolve(null);
    }
  });
}

// 静默登录：启动时自动完成，失败退回本地账号
export async function silentLogin() {
  const current = loadUser();
  if (current && current.id && !String(current.id).startsWith('local_')) return current;
  const wxUser = await wechatLogin();
  return wxUser || current || localLogin();
}

export function currentUser() {
  return loadUser() || localLogin();
}
