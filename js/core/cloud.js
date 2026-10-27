// 云开发调用层：登录识别与云存档
import { CLOUD_ENV, CLOUD_FN } from '../config.js';

let inited = false;
let ready = false;
let envId = CLOUD_ENV;

export function initCloud() {
  if (inited) return ready;
  inited = true;
  try {
    if (typeof wx === 'undefined' || !wx.cloud) {
      ready = false;
      return ready;
    }
    const opt = { traceUser: true };
    if (envId) opt.env = envId;
    wx.cloud.init(opt);
    ready = true;
  } catch (e) {
    ready = false;
  }
  return ready;
}

export function cloudReady() {
  return inited ? ready : initCloud();
}

async function invoke(action, data) {
  if (!cloudReady()) return { ok: false, error: 'cloud' };
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FN,
      data: { action, ...data }
    });
    return (res && res.result) || { ok: false, error: 'empty' };
  } catch (e) {
    return { ok: false, error: 'network', message: e && e.errMsg };
  }
}

export async function callCloud(action, data = {}) {
  const first = await invoke(action, data);
  if (first.ok || !envId) return first;
  if (first.error !== 'network' && first.error !== 'cloud') return first;
  // 环境 ID 填错时会直接抛错，换默认环境再试一次
  envId = '';
  inited = false;
  ready = false;
  return invoke(action, data);
}

export const repairApi = {
  whoami: () => callCloud('whoami'),
  loadSave: () => callCloud('loadSave'),
  writeSave: (save) => callCloud('writeSave', { save })
};
