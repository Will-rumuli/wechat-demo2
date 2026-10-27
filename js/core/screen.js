// 画布、屏幕适配、输入与主循环
const info = wx.getSystemInfoSync();

export const W = info.windowWidth;
export const H = info.windowHeight;
export const DPR = Math.min(info.pixelRatio || 2, 3);
export const TOP = info.safeArea ? Math.max(info.safeArea.top, 24) : 24;
export const BOTTOM = info.safeArea ? Math.max(0, H - info.safeArea.bottom) : 0;

// 字号随屏幕宽度缩放，320 宽时约 0.9 倍，430 宽时封顶 1.12 倍
export const K = Math.max(0.9, Math.min(1.12, W / 375));
export const FS = (n) => Math.max(11, Math.round(n * K));

// 微信右上角胶囊：顶部内容必须落在它下面，避免被遮挡
export const MENU = (() => {
  try {
    const rect = wx.getMenuButtonBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) return rect;
  } catch (e) {
    // 部分环境不支持
  }
  return null;
})();

export const SAFE_TOP = MENU ? Math.max(TOP, MENU.bottom + 8) : TOP + 10;
export const SAFE_BOTTOM = BOTTOM + 10;

export const canvas = wx.createCanvas();
export const ctx = canvas.getContext('2d');

canvas.width = Math.floor(W * DPR);
canvas.height = Math.floor(H * DPR);
ctx.scale(DPR, DPR);

// 离屏噪点纹理：一次性生成，避免每帧重算
export const offscreen = wx.createCanvas();
const offscreenCtx = offscreen.getContext('2d');
offscreen.width = 180;
offscreen.height = 320;
const noiseData = offscreenCtx.createImageData(180, 320);
for (let i = 0; i < noiseData.data.length; i += 4) {
  const v = 120 + Math.random() * 135;
  noiseData.data[i] = v;
  noiseData.data[i + 1] = v;
  noiseData.data[i + 2] = v;
  noiseData.data[i + 3] = Math.random() * 24;
}
offscreenCtx.putImageData(noiseData, 0, 0);

export function grain(target, alpha = 0.16) {
  target.save();
  target.globalAlpha = alpha;
  target.drawImage(offscreen, 0, 0, 180, 320, 0, 0, W, H);
  target.restore();
}

function toPoint(touch) {
  return { x: touch.clientX, y: touch.clientY };
}

// 统一输入绑定：start / move / end / cancel，附带当前所有触点，供双指手势使用
export function bindInput(handlers = {}) {
  wx.onTouchStart((e) => {
    const points = (e.touches || []).map(toPoint);
    if (handlers.start && points[0]) handlers.start(points[0].x, points[0].y, points);
  });
  wx.onTouchMove((e) => {
    const points = (e.touches || []).map(toPoint);
    if (handlers.move && points[0]) handlers.move(points[0].x, points[0].y, points);
  });
  wx.onTouchEnd((e) => {
    const points = (e.touches || []).map(toPoint);
    if (handlers.end) handlers.end(points);
  });
  if (wx.onTouchCancel) {
    wx.onTouchCancel(() => {
      if (handlers.cancel) handlers.cancel();
    });
  }
}

export function lightVibrate() {
  try {
    wx.vibrateShort({ type: 'light' });
  } catch (e) {
    // 不支持震动时忽略
  }
}

export function startLoop(update, render) {
  let last = Date.now();
  const frame = () => {
    const now = Date.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    ctx.save();
    render(ctx);
    ctx.restore();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(frame);
    } else {
      setTimeout(frame, 16);
    }
  };
  requestAnimationFrame(frame);
}

try {
  wx.setKeepScreenOn({ keepScreenOn: true });
} catch (e) {
  // 忽略不支持的环境
}
