// 激励视频广告：看完才发放奖励；未配置广告位时直接放行，方便开发调试
import { AD_UNIT_ID } from '../config.js';

let ad = null;
let pending = null;

export function adsReady() {
  return !!(AD_UNIT_ID && typeof wx !== 'undefined' && wx.createRewardedVideoAd);
}

function ensure() {
  if (ad) return ad;
  if (!adsReady()) return null;
  try {
    ad = wx.createRewardedVideoAd({ adUnitId: AD_UNIT_ID });
    ad.onClose((res) => {
      // 部分基础库回调不带 res，此时按“已看完”处理
      const done = !res || res.isEnded !== false;
      const cb = pending;
      pending = null;
      if (cb) cb(done);
    });
    ad.onError(() => {
      const cb = pending;
      pending = null;
      if (cb) cb(false);
    });
  } catch (e) {
    ad = null;
  }
  return ad;
}

// 返回 Promise<boolean>；未配置广告位时 resolve(true)，由调用方提示“开发模式”
export function showRewarded() {
  if (!adsReady()) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 120);
    });
  }
  return new Promise((resolve) => {
    const inst = ensure();
    if (!inst) {
      resolve(true);
      return;
    }
    pending = resolve;
    inst.show().catch(() => inst.load()
      .then(() => inst.show())
      .catch(() => {
        pending = null;
        resolve(false);
      }));
  });
}
