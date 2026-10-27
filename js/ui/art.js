// 程序化美术：旧物、客户剪影、记忆回放场景
import { W, H, grain } from '../core/screen.js';
import {
  MATERIALS, seeded, roundRect, fillRound, strokeRound, text
} from './theme.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
}

function shadow(ctx, cx, cy, rx, ry, alpha = 0.4) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / Math.max(rx, ry));
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function patina(ctx, cx, cy, r, seed, color, count = 10) {
  const rnd = seeded(seed);
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const angle = rnd() * Math.PI * 2;
    const dist = Math.sqrt(rnd()) * r * 0.9;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist * 0.82;
    const rr = 0.6 + rnd() * (r * 0.06);
    ctx.globalAlpha = 0.12 + rnd() * 0.2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 物件绘制：cx/cy 为中心，r 为半尺寸。time 用于轻微呼吸光
export function drawArtifact(ctx, art, cx, cy, r, time = 0, opt = {}) {
  const mat = MATERIALS[opt.material] || MATERIALS.wood;
  const alpha = opt.alpha == null ? 1 : opt.alpha;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  shadow(ctx, 0, r * 0.72, r * 0.6, r * 0.16, 0.42);

  if (art === 'cup') drawCup(ctx, r, mat, time);
  else if (art === 'fan') drawFan(ctx, r, mat);
  else if (art === 'pedal') drawPedal(ctx, r, mat, time);
  else if (art === 'radio') drawRadio(ctx, r, mat, time);
  else if (art === 'frame') drawFrame(ctx, r, mat, time);
  else if (art === 'lunchbox') drawLunchbox(ctx, r, mat, false);
  else if (art === 'lunchbox2') drawLunchbox(ctx, r, mat, true);
  else if (art === 'watch') drawWatch(ctx, r, mat, time);
  else drawCup(ctx, r, mat);

  ctx.restore();
}

function drawCup(ctx, r, mat) {
  // 缸身
  const topY = -r * 0.46;
  const bottomY = r * 0.56;
  const topW = r * 0.9;
  const bottomW = r * 0.78;
  const grad = ctx.createLinearGradient(-r * 0.5, 0, r * 0.5, 0);
  grad.addColorStop(0, mat.dark);
  grad.addColorStop(0.25, mat.base);
  grad.addColorStop(0.62, mat.light);
  grad.addColorStop(1, mat.base);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-topW / 2, topY);
  ctx.bezierCurveTo(-topW / 2, topY + r * 0.42, -bottomW / 2, bottomY - r * 0.25, -bottomW / 2, bottomY);
  ctx.quadraticCurveTo(0, bottomY + r * 0.1, bottomW / 2, bottomY);
  ctx.bezierCurveTo(bottomW / 2, bottomY - r * 0.25, topW / 2, topY + r * 0.42, topW / 2, topY);
  ctx.closePath();
  ctx.fill();

  // 口沿
  ctx.fillStyle = mat.light;
  ellipse(ctx, 0, topY, topW / 2, r * 0.11);
  ctx.fill();
  ctx.fillStyle = 'rgba(40, 54, 60, 0.55)';
  ellipse(ctx, 0, topY + r * 0.008, topW / 2 - r * 0.07, r * 0.075);
  ctx.fill();

  // 蓝色边与红字
  ctx.strokeStyle = mat.rim;
  ctx.lineWidth = Math.max(1.4, r * 0.07);
  ctx.beginPath();
  ctx.moveTo(-topW / 2 + r * 0.02, topY + r * 0.13);
  ctx.quadraticCurveTo(0, topY + r * 0.2, topW / 2 - r * 0.02, topY + r * 0.13);
  ctx.stroke();
  text(ctx, '先进', r * 0.06, r * 0.18, {
    size: Math.max(8, r * 0.22), color: 'rgba(150, 56, 42, 0.85)',
    align: 'center', baseline: 'middle', weight: 700
  });

  // 把手
  ctx.strokeStyle = mat.base;
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.beginPath();
  ctx.arc(topW * 0.48, r * 0.03, r * 0.2, -Math.PI * 0.45, Math.PI * 0.55);
  ctx.stroke();

  // 缺口与裂纹
  ctx.fillStyle = 'rgba(44, 50, 52, 0.9)';
  ctx.beginPath();
  ctx.moveTo(-topW * 0.42, topY - r * 0.02);
  ctx.lineTo(-topW * 0.22, topY - r * 0.05);
  ctx.lineTo(-topW * 0.26, topY + r * 0.09);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(80, 96, 102, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-topW * 0.28, topY + r * 0.04);
  ctx.lineTo(-r * 0.05, r * 0.1);
  ctx.lineTo(r * 0.1, r * 0.32);
  ctx.stroke();

  // 高光
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, topY + r * 0.2);
  ctx.lineTo(-r * 0.34, r * 0.4);
  ctx.stroke();
}

function drawFan(ctx, r, mat) {
  ctx.save();
  ctx.rotate(-0.22);
  // 扇面
  const grad = ctx.createLinearGradient(-r * 0.4, -r * 0.4, r * 0.4, r * 0.3);
  grad.addColorStop(0, mat.light);
  grad.addColorStop(0.6, mat.base);
  grad.addColorStop(1, mat.dark);
  ctx.fillStyle = grad;
  ellipse(ctx, 0, -r * 0.14, r * 0.54, r * 0.42);
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 54, 30, 0.55)';
  ctx.lineWidth = Math.max(1, r * 0.022);
  ctx.stroke();

  // 竹骨
  const ribs = 7;
  for (let i = 0; i < ribs; i += 1) {
    const t = i / (ribs - 1);
    const ex = -r * 0.46 + t * r * 0.92;
    const ey = -r * 0.12 + Math.sin(t * Math.PI) * -r * 0.28;
    ctx.strokeStyle = 'rgba(86, 62, 34, 0.5)';
    ctx.lineWidth = Math.max(1, r * 0.018);
    ctx.beginPath();
    ctx.moveTo(0, r * 0.5);
    ctx.quadraticCurveTo(ex * 0.5, r * 0.2, ex, ey);
    ctx.stroke();
  }

  // 裂缝
  ctx.strokeStyle = 'rgba(72, 50, 26, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, r * 0.26);
  ctx.lineTo(-r * 0.16, r * 0.02);
  ctx.lineTo(-r * 0.05, -r * 0.16);
  ctx.lineTo(-r * 0.12, -r * 0.34);
  ctx.stroke();

  // 扇柄
  ctx.fillStyle = '#7A5430';
  fillRound(ctx, -r * 0.045, r * 0.3, r * 0.09, r * 0.36, r * 0.04, '#7A5430');
  ctx.strokeStyle = 'rgba(210, 180, 130, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.02, r * 0.32);
  ctx.lineTo(-r * 0.02, r * 0.62);
  ctx.stroke();
  ctx.restore();
}

function drawPedal(ctx, r, mat, time) {
  // 铁架
  ctx.strokeStyle = mat.dark;
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.42, r * 0.24);
  ctx.lineTo(-r * 0.34, -r * 0.38);
  ctx.lineTo(r * 0.3, -r * 0.38);
  ctx.lineTo(r * 0.4, r * 0.24);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.34, -r * 0.1);
  ctx.lineTo(r * 0.32, -r * 0.1);
  ctx.stroke();

  // 飞轮
  ctx.save();
  ctx.translate(-r * 0.12, -r * 0.03);
  ctx.strokeStyle = mat.base;
  ctx.lineWidth = Math.max(1.5, r * 0.035);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + (time || 0) * 0.12;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.18, Math.sin(a) * r * 0.18);
    ctx.stroke();
  }
  ctx.restore();

  // 木踏板
  ctx.fillStyle = mat.base;
  ctx.beginPath();
  ctx.moveTo(-r * 0.56, r * 0.2);
  ctx.lineTo(r * 0.5, r * 0.2);
  ctx.lineTo(r * 0.42, r * 0.36);
  ctx.lineTo(-r * 0.5, r * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = mat.dark;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60, 38, 20, 0.4)';
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.42 + i * r * 0.24, r * 0.22);
    ctx.lineTo(-r * 0.4 + i * r * 0.24, r * 0.34);
    ctx.stroke();
  }

  // 锈斑
  patina(ctx, r * 0.05, -r * 0.18, r * 0.34, 331, '#8C4A32', 14);
  ctx.strokeStyle = 'rgba(140, 74, 50, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, r * 0.05);
  ctx.lineTo(-r * 0.1, r * 0.02);
  ctx.stroke();
}

function drawRadio(ctx, r, mat, time) {
  // 机身
  const grad = ctx.createLinearGradient(0, -r * 0.4, 0, r * 0.4);
  grad.addColorStop(0, mat.light);
  grad.addColorStop(0.35, mat.base);
  grad.addColorStop(1, mat.dark);
  fillRound(ctx, -r * 0.56, -r * 0.32, r * 1.12, r * 0.72, r * 0.08, grad);
  ctx.strokeStyle = 'rgba(40, 44, 46, 0.6)';
  ctx.lineWidth = 1.2;
  roundRect(ctx, -r * 0.56, -r * 0.32, r * 1.12, r * 0.72, r * 0.08);
  ctx.stroke();

  // 扬声器格栅
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, -r * 0.48, -r * 0.24, r * 0.56, r * 0.56, r * 0.06);
  ctx.clip();
  ctx.fillStyle = 'rgba(36, 38, 40, 0.55)';
  ctx.fillRect(-r * 0.48, -r * 0.24, r * 0.56, r * 0.56);
  for (let i = 0; i < 7; i += 1) {
    ctx.strokeStyle = 'rgba(220, 226, 228, 0.28)';
    ctx.lineWidth = Math.max(1, r * 0.014);
    ctx.beginPath();
    ctx.moveTo(-r * 0.44 + i * r * 0.08, -r * 0.22);
    ctx.lineTo(-r * 0.44 + i * r * 0.08, r * 0.3);
    ctx.stroke();
  }
  ctx.restore();

  // 调频面板
  fillRound(ctx, r * 0.16, -r * 0.24, r * 0.31, r * 0.2, r * 0.03, 'rgba(244, 232, 202, 0.82)');
  ctx.strokeStyle = 'rgba(60, 50, 36, 0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(r * 0.19 + i * r * 0.06, -r * 0.21);
    ctx.lineTo(r * 0.19 + i * r * 0.06, -r * 0.16);
    ctx.stroke();
  }
  ctx.fillStyle = '#B45A44';
  ctx.fillRect(r * 0.26, -r * 0.24, r * 0.012, r * 0.2);

  // 旋钮
  ctx.fillStyle = mat.dark;
  ellipse(ctx, r * 0.24, r * 0.17, r * 0.075, r * 0.075);
  ctx.fill();
  ellipse(ctx, r * 0.41, r * 0.17, r * 0.055, r * 0.055);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240, 240, 235, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r * 0.24, r * 0.17);
  ctx.lineTo(r * 0.24, r * 0.11);
  ctx.stroke();

  // 天线
  ctx.strokeStyle = mat.light;
  ctx.lineWidth = Math.max(1.2, r * 0.02);
  ctx.beginPath();
  ctx.moveTo(r * 0.42, -r * 0.32);
  ctx.lineTo(r * 0.78, -r * 0.72);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.78, -r * 0.72, r * 0.025, 0, Math.PI * 2);
  ctx.fillStyle = mat.light;
  ctx.fill();

  // 提手
  ctx.strokeStyle = mat.dark;
  ctx.lineWidth = Math.max(2, r * 0.045);
  ctx.beginPath();
  ctx.arc(0, -r * 0.32, r * 0.2, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  // 落灰
  const pulse = 0.5 + Math.sin(time || 0) * 0.06;
  ctx.fillStyle = `rgba(180, 172, 156, ${0.1 * pulse})`;
  ellipse(ctx, 0, r * 0.02, r * 0.52, r * 0.3);
  ctx.fill();
}

function drawFrame(ctx, r, mat, time) {
  // 外框
  const grad = ctx.createLinearGradient(-r * 0.5, -r * 0.6, r * 0.5, r * 0.6);
  grad.addColorStop(0, mat.dark);
  grad.addColorStop(0.45, mat.base);
  grad.addColorStop(1, mat.dark);
  fillRound(ctx, -r * 0.5, -r * 0.58, r * 1.0, r * 1.16, r * 0.05, grad);
  // 内框
  fillRound(ctx, -r * 0.42, -r * 0.5, r * 0.84, r * 1.0, r * 0.03, '#2B2620');

  // 照片
  ctx.save();
  ctx.beginPath();
  ctx.rect(-r * 0.38, -r * 0.46, r * 0.76, r * 0.92);
  ctx.clip();
  ctx.fillStyle = 'rgba(214, 198, 168, 0.42)';
  ctx.fillRect(-r * 0.38, -r * 0.46, r * 0.76, r * 0.92);
  // 三个人影
  for (let i = 0; i < 3; i += 1) {
    const px = -r * 0.2 + i * r * 0.2;
    const py = r * 0.04 - (i === 1 ? r * 0.06 : 0);
    ctx.fillStyle = 'rgba(42, 36, 30, 0.72)';
    ctx.beginPath();
    ctx.arc(px, py - r * 0.14, r * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px - r * 0.11, py + r * 0.3);
    ctx.quadraticCurveTo(px - r * 0.1, py - r * 0.02, px, py - r * 0.02);
    ctx.quadraticCurveTo(px + r * 0.1, py - r * 0.02, px + r * 0.11, py + r * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  // 右下角被剪掉
  ctx.fillStyle = 'rgba(20, 16, 12, 0.95)';
  ctx.beginPath();
  ctx.moveTo(r * 0.38, r * 0.15);
  ctx.lineTo(r * 0.38, r * 0.46);
  ctx.lineTo(r * 0.06, r * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 玻璃反光
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#E9F1F2';
  ctx.beginPath();
  ctx.moveTo(-r * 0.34, -r * 0.3);
  ctx.lineTo(-r * 0.1, -r * 0.46);
  ctx.lineTo(-r * 0.02, -r * 0.42);
  ctx.lineTo(-r * 0.28, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 玻璃裂纹
  ctx.strokeStyle = 'rgba(236, 244, 244, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r * 0.12, -r * 0.36);
  ctx.lineTo(r * 0.03, -r * 0.18);
  ctx.lineTo(r * 0.18, -r * 0.06);
  ctx.lineTo(r * 0.1, r * 0.1);
  ctx.stroke();

  // 灰尘
  const pulse = 0.4 + Math.sin((time || 0) * 1.2) * 0.05;
  ctx.fillStyle = `rgba(198, 190, 176, ${pulse * 0.2})`;
  ellipse(ctx, 0, 0, r * 0.4, r * 0.5);
  ctx.fill();
}

function drawLunchbox(ctx, r, mat, open) {
  if (open) {
    // 掀开的盖
    ctx.save();
    ctx.translate(0, -r * 0.24);
    ctx.rotate(-0.28);
    fillRound(ctx, -r * 0.5, -r * 0.34, r * 1.0, r * 0.24, r * 0.04, mat.dark);
    strokeRound(ctx, -r * 0.5, -r * 0.34, r * 1.0, r * 0.24, r * 0.04, 'rgba(230, 236, 238, 0.3)', 1);
    ctx.restore();
  }

  // 盒身
  const grad = ctx.createLinearGradient(0, -r * 0.1, 0, r * 0.45);
  grad.addColorStop(0, mat.light);
  grad.addColorStop(0.5, mat.base);
  grad.addColorStop(1, mat.dark);
  fillRound(ctx, -r * 0.52, -r * 0.08, r * 1.04, r * 0.56, r * 0.07, grad);
  ctx.strokeStyle = 'rgba(50, 56, 58, 0.55)';
  ctx.lineWidth = 1.2;
  roundRect(ctx, -r * 0.52, -r * 0.08, r * 1.04, r * 0.56, r * 0.07);
  ctx.stroke();

  // 盒盖线
  ctx.strokeStyle = 'rgba(50, 56, 58, 0.45)';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.04);
  ctx.lineTo(r * 0.5, r * 0.04);
  ctx.stroke();

  // 分格
  if (open) {
    ctx.fillStyle = 'rgba(60, 66, 68, 0.5)';
    ctx.fillRect(-r * 0.02, r * 0.04, r * 0.02, r * 0.42);
    fillRound(ctx, -r * 0.32, r * 0.1, r * 0.34, r * 0.3, r * 0.03, 'rgba(60, 66, 68, 0.4)');
    fillRound(ctx, r * 0.12, r * 0.1, r * 0.32, r * 0.3, r * 0.03, 'rgba(60, 66, 68, 0.4)');
    // 湿纸条
    ctx.save();
    ctx.translate(-r * 0.16, r * 0.2);
    ctx.rotate(0.12);
    ctx.fillStyle = 'rgba(232, 218, 188, 0.85)';
    ctx.fillRect(-r * 0.16, -r * 0.08, r * 0.32, r * 0.16);
    ctx.strokeStyle = 'rgba(120, 100, 70, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.12, -r * 0.03);
    ctx.lineTo(r * 0.1, -r * 0.03);
    ctx.moveTo(-r * 0.12, r * 0.02);
    ctx.lineTo(r * 0.02, r * 0.02);
    ctx.stroke();
    ctx.restore();
  }

  // 提手
  ctx.strokeStyle = mat.dark;
  ctx.lineWidth = Math.max(2, r * 0.045);
  ctx.beginPath();
  ctx.arc(0, -r * 0.08, r * 0.24, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();

  // 卡扣
  fillRound(ctx, -r * 0.06, r * 0.32, r * 0.12, r * 0.09, r * 0.02, mat.dark);

  // 凹痕与划痕
  ctx.strokeStyle = 'rgba(50, 56, 58, 0.65)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(r * 0.12, -r * 0.02);
  ctx.lineTo(r * 0.26, -r * 0.02);
  ctx.lineTo(r * 0.3, r * 0.12);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(230, 236, 238, 0.3)';
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, r * 0.14);
  ctx.lineTo(-r * 0.3, r * 0.34);
  ctx.setLineDash([2, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  patina(ctx, -r * 0.2, r * 0.24, r * 0.2, 717, '#7A5A3A', 8);
}

function drawWatch(ctx, r, mat, time) {
  // 表壳
  const outer = ctx.createRadialGradient(-r * 0.15, -r * 0.2, r * 0.1, 0, 0, r * 0.56);
  outer.addColorStop(0, mat.light);
  outer.addColorStop(0.55, mat.base);
  outer.addColorStop(1, mat.dark);
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.54, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = mat.rim;
  ctx.lineWidth = Math.max(1.5, r * 0.035);
  ctx.stroke();

  // 表盘
  ctx.fillStyle = 'rgba(244, 233, 208, 0.94)';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.43, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 90, 44, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 刻度
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const inner = i % 3 === 0 ? r * 0.35 : r * 0.39;
    ctx.strokeStyle = i % 3 === 0 ? '#5E4417' : 'rgba(94, 68, 23, 0.6)';
    ctx.lineWidth = i % 3 === 0 ? Math.max(1.4, r * 0.026) : 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42);
    ctx.stroke();
  }

  // 指针停在 3:17
  const hourAngle = ((3 + 17 / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const minuteAngle = (17 / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#3B2A13';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, r * 0.045);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(hourAngle) * r * 0.22, Math.sin(hourAngle) * r * 0.22);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.4, r * 0.028);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(minuteAngle) * r * 0.32, Math.sin(minuteAngle) * r * 0.32);
  ctx.stroke();
  ctx.fillStyle = '#3B2A13';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.035, 0, Math.PI * 2);
  ctx.fill();

  // 表冠与挂环
  ctx.fillStyle = mat.dark;
  fillRound(ctx, -r * 0.07, -r * 0.68, r * 0.14, r * 0.14, r * 0.03, mat.dark);
  ctx.strokeStyle = mat.base;
  ctx.lineWidth = Math.max(1.5, r * 0.03);
  ctx.beginPath();
  ctx.arc(0, -r * 0.78, r * 0.09, 0, Math.PI * 2);
  ctx.stroke();

  // 裂纹与氧化
  ctx.strokeStyle = 'rgba(250, 246, 232, 0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.2);
  ctx.lineTo(-r * 0.1, -r * 0.02);
  ctx.lineTo(-r * 0.2, r * 0.18);
  ctx.stroke();
  patina(ctx, r * 0.2, r * 0.24, r * 0.4, 991, '#5E4417', 12);

  // 金色呼吸光
  const glow = 0.16 + Math.sin((time || 0) * 1.6) * 0.04;
  ctx.strokeStyle = `rgba(226, 179, 106, ${glow})`;
  ctx.lineWidth = r * 0.2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
  ctx.stroke();
}

// 客户剪影：扁平身形 + 标志物
export function drawClient(ctx, prop, x, y, s, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  shadow(ctx, 0, 82, 44, 9, 0.35);

  // 身体
  const body = ctx.createLinearGradient(-40, 0, 40, 0);
  body.addColorStop(0, '#0C0A08');
  body.addColorStop(0.7, '#17120D');
  body.addColorStop(1, '#0A0806');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-38, 76);
  ctx.quadraticCurveTo(-34, 10, -15, 2);
  ctx.lineTo(15, 2);
  ctx.quadraticCurveTo(34, 10, 38, 76);
  ctx.closePath();
  ctx.fill();

  // 头
  ctx.beginPath();
  ctx.arc(0, -20, 18, 0, Math.PI * 2);
  ctx.fill();

  // 轮廓光
  ctx.strokeStyle = 'rgba(226, 179, 106, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(-4, -22, 16.5, Math.PI * 0.92, Math.PI * 1.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-15, 2);
  ctx.quadraticCurveTo(-30, 20, -32, 62);
  ctx.strokeStyle = 'rgba(226, 179, 106, 0.18)';
  ctx.stroke();

  if (prop === 'umbrella') {
    ctx.strokeStyle = 'rgba(180, 90, 68, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(-26, -46, 32, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-26, -46);
    ctx.lineTo(-26, 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-32, 26, 6, 0, Math.PI);
    ctx.stroke();
  } else if (prop === 'cane') {
    ctx.strokeStyle = 'rgba(206, 174, 120, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(34, 6);
    ctx.lineTo(40, 78);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(31, 6, 4, 0, Math.PI * 1.6);
    ctx.stroke();
  } else if (prop === 'bag') {
    ctx.fillStyle = 'rgba(206, 174, 120, 0.35)';
    fillRound(ctx, 24, 30, 24, 30, 4, 'rgba(206, 174, 120, 0.32)');
    ctx.strokeStyle = 'rgba(226, 179, 106, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(36, 30, 8, Math.PI, Math.PI * 2);
    ctx.stroke();
  } else if (prop === 'cap') {
    ctx.fillStyle = '#0A0806';
    ctx.beginPath();
    ctx.arc(0, -28, 18, Math.PI * 1.05, Math.PI * 1.95);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-22, -28, 44, 4);
    ctx.strokeStyle = 'rgba(226, 179, 106, 0.55)';
    ctx.beginPath();
    ctx.moveTo(-14, -26);
    ctx.lineTo(12, -26);
    ctx.stroke();
  } else if (prop === 'letter') {
    ctx.save();
    ctx.translate(26, 26);
    ctx.rotate(-0.18);
    ctx.fillStyle = 'rgba(238, 226, 202, 0.8)';
    ctx.fillRect(-10, -8, 22, 28);
    ctx.strokeStyle = 'rgba(150, 128, 92, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, -3);
    ctx.lineTo(8, -3);
    ctx.moveTo(-7, 2);
    ctx.lineTo(4, 2);
    ctx.stroke();
    ctx.restore();
  }

  // 呼吸微动
  const breathe = Math.sin((time || 0) * 1.4) * 0.6;
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#E2B36A';
  ctx.beginPath();
  ctx.arc(0, -20 + breathe, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 记忆回放：单色剪影场景
export function drawMemoryScene(ctx, scene, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#121211');
  grad.addColorStop(0.55, '#1C1915');
  grad.addColorStop(1, '#0C0B0A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  const ink = 'rgba(28, 24, 20, 0.95)';
  const line = 'rgba(214, 194, 160, 0.55)';
  const soft = 'rgba(214, 194, 160, 0.22)';
  const cx = W / 2;
  const s = Math.min(W, H * 0.62);
  const rnd = seeded(scene.length * 977 + 31);

  // 地面
  ctx.fillStyle = 'rgba(16, 14, 12, 0.85)';
  ctx.fillRect(0, H * 0.63, W, H * 0.37);

  if (scene === 'factory') {
    // 烟囱与厂房
    ctx.fillStyle = ink;
    ctx.fillRect(W * 0.1, H * 0.24, W * 0.1, H * 0.4);
    ctx.fillRect(W * 0.34, H * 0.34, W * 0.52, H * 0.3);
    // 锯齿屋顶
    ctx.beginPath();
    ctx.moveTo(W * 0.34, H * 0.34);
    for (let i = 0; i < 5; i += 1) {
      ctx.lineTo(W * 0.34 + i * W * 0.104, H * 0.3);
      ctx.lineTo(W * 0.34 + (i + 1) * W * 0.104, H * 0.34);
    }
    ctx.closePath();
    ctx.fill();
    // 窗
    ctx.fillStyle = line;
    for (let i = 0; i < 6; i += 1) {
      ctx.globalAlpha = 0.35 + rnd() * 0.35;
      ctx.fillRect(W * 0.38 + i * W * 0.075, H * 0.4, W * 0.045, H * 0.05);
    }
    ctx.globalAlpha = 1;
    // 烟
    ctx.strokeStyle = soft;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const ox = W * 0.15 + Math.sin(t * 0.5 + i) * 10;
      ctx.beginPath();
      ctx.moveTo(ox, H * 0.23);
      ctx.bezierCurveTo(ox - 20, H * 0.18, ox + 24, H * 0.14, ox - 6, H * 0.08);
      ctx.stroke();
    }
    // 三个工人
    drawFigure(ctx, W * 0.42, H * 0.62, 0.8, ink);
    drawFigure(ctx, W * 0.52, H * 0.63, 0.86, ink);
    drawFigure(ctx, W * 0.62, H * 0.62, 0.8, ink);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.16, H * 0.63);
    ctx.lineTo(W * 0.9, H * 0.63);
    ctx.stroke();
  } else if (scene === 'summer') {
    // 树与屋檐
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.2);
    ctx.lineTo(W * 0.55, H * 0.16);
    ctx.lineTo(W * 0.55, H * 0.22);
    ctx.lineTo(0, H * 0.27);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(0, H * 0.25, W * 0.06, H * 0.42);
    // 树干与树冠
    ctx.fillRect(W * 0.78, H * 0.3, W * 0.035, H * 0.35);
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(W * (0.7 + i * 0.06), H * 0.28 + (i % 2) * 12, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    // 竹椅上的老人
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.3, H * 0.56);
    ctx.lineTo(W * 0.3, H * 0.64);
    ctx.moveTo(W * 0.24, H * 0.6);
    ctx.lineTo(W * 0.38, H * 0.6);
    ctx.stroke();
    drawFigure(ctx, W * 0.31, H * 0.55, 0.9, ink, true);
    // 蒲扇
    ctx.save();
    ctx.translate(W * 0.37, H * 0.5);
    ctx.rotate(-0.3 + Math.sin(t * 0.8) * 0.05);
    ctx.fillStyle = 'rgba(198, 178, 146, 0.5)';
    ellipse(ctx, 0, 0, s * 0.05, s * 0.04);
    ctx.fill();
    ctx.restore();
    // 星点
    for (let i = 0; i < 20; i += 1) {
      ctx.globalAlpha = 0.15 + rnd() * 0.25;
      ctx.fillStyle = '#F3E7D3';
      ctx.fillRect(rnd() * W, rnd() * H * 0.4, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;
  } else if (scene === 'sewing') {
    // 窗
    ctx.fillStyle = ink;
    ctx.fillRect(W * 0.52, H * 0.18, W * 0.44, H * 0.34);
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.52, H * 0.18, W * 0.44, H * 0.34);
    ctx.beginPath();
    ctx.moveTo(W * 0.74, H * 0.18);
    ctx.lineTo(W * 0.74, H * 0.52);
    ctx.moveTo(W * 0.52, H * 0.35);
    ctx.lineTo(W * 0.96, H * 0.35);
    ctx.stroke();
    // 灯光
    ctx.fillStyle = 'rgba(226, 179, 106, 0.12)';
    ctx.beginPath();
    ctx.moveTo(W * 0.2, H * 0.3);
    ctx.lineTo(W * 0.42, H * 0.62);
    ctx.lineTo(W * 0.02, H * 0.62);
    ctx.closePath();
    ctx.fill();
    // 桌与缝纫机
    ctx.fillStyle = ink;
    ctx.fillRect(W * 0.08, H * 0.6, W * 0.5, H * 0.035);
    ctx.fillRect(W * 0.1, H * 0.63, W * 0.02, H * 0.14);
    ctx.fillRect(W * 0.44, H * 0.63, W * 0.02, H * 0.14);
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.18, H * 0.6);
    ctx.lineTo(W * 0.2, H * 0.5);
    ctx.lineTo(W * 0.34, H * 0.5);
    ctx.lineTo(W * 0.34, H * 0.56);
    ctx.moveTo(W * 0.23, H * 0.5);
    ctx.lineTo(W * 0.23, H * 0.44);
    ctx.stroke();
    // 布料
    ctx.fillStyle = 'rgba(198, 178, 146, 0.3)';
    ctx.beginPath();
    ctx.moveTo(W * 0.33, H * 0.55);
    ctx.quadraticCurveTo(W * 0.46, H * 0.58, W * 0.5, H * 0.64);
    ctx.lineTo(W * 0.32, H * 0.64);
    ctx.closePath();
    ctx.fill();
    // 椅子与空位
    drawFigure(ctx, W * 0.6, H * 0.62, 0.85, ink);
  } else if (scene === 'radio') {
    // 窗与雨
    ctx.fillStyle = ink;
    ctx.fillRect(W * 0.14, H * 0.18, W * 0.72, H * 0.34);
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.14, H * 0.18, W * 0.72, H * 0.34);
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.18);
    ctx.lineTo(W * 0.5, H * 0.52);
    ctx.moveTo(W * 0.14, H * 0.35);
    ctx.lineTo(W * 0.86, H * 0.35);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(170, 200, 218, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 26; i += 1) {
      const rx = W * 0.14 + rnd() * W * 0.72;
      const ry = H * 0.18 + ((rnd() * H * 0.34 + t * 40) % (H * 0.34));
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 10);
      ctx.stroke();
    }
    // 桌面
    ctx.fillStyle = ink;
    ctx.fillRect(0, H * 0.62, W, H * 0.04);
    // 收音机
    ctx.fillStyle = 'rgba(198, 178, 146, 0.22)';
    fillRound(ctx, W * 0.34, H * 0.5, W * 0.32, H * 0.13, 6, 'rgba(198, 178, 146, 0.2)');
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(W * 0.43, H * 0.55, H * 0.035, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = line;
    ctx.globalAlpha = 0.5 + Math.sin(t * 2) * 0.15;
    ctx.fillRect(W * 0.52, H * 0.55, W * 0.1, 2);
    ctx.globalAlpha = 1;
    // 人影
    drawFigure(ctx, W * 0.72, H * 0.62, 1, ink);
  } else if (scene === 'photo') {
    // 墙
    ctx.fillStyle = 'rgba(30, 26, 22, 0.6)';
    ctx.fillRect(0, 0, W, H * 0.68);
    // 相框群
    const frames = [
      [0.16, 0.2, 0.18, 0.15],
      [0.42, 0.16, 0.24, 0.19],
      [0.72, 0.22, 0.16, 0.13],
      [0.24, 0.46, 0.2, 0.16],
      [0.54, 0.44, 0.22, 0.17]
    ];
    frames.forEach((f, i) => {
      ctx.strokeStyle = line;
      ctx.lineWidth = 2;
      ctx.strokeRect(W * f[0], H * f[1], W * f[2], H * f[3]);
      if (i === 4) {
        // 空相框
        ctx.fillStyle = ink;
        ctx.fillRect(W * f[0] + 4, H * f[1] + 4, W * f[2] - 8, H * f[3] - 8);
        ctx.strokeStyle = soft;
        ctx.setLineDash([4, 5]);
        ctx.strokeRect(W * f[0] + 8, H * f[1] + 8, W * f[2] - 16, H * f[3] - 16);
        ctx.setLineDash([]);
      } else {
        drawFigure(ctx, W * (f[0] + f[2] / 2), H * (f[1] + f[3] * 0.9), 0.45, ink);
      }
    });
    // 剪刀
    ctx.strokeStyle = 'rgba(198, 178, 146, 0.6)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(W * 0.78, H * 0.55);
    ctx.lineTo(W * 0.84, H * 0.64);
    ctx.moveTo(W * 0.84, H * 0.55);
    ctx.lineTo(W * 0.78, H * 0.64);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W * 0.77, H * 0.66, 4, 0, Math.PI * 2);
    ctx.moveTo(W * 0.85, H * 0.66);
    ctx.arc(W * 0.85, H * 0.66, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (scene === 'lunch') {
    // 树荫
    ctx.fillStyle = 'rgba(26, 23, 19, 0.8)';
    ctx.beginPath();
    ctx.arc(W * 0.82, H * 0.2, W * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(W * 0.8, H * 0.28, W * 0.03, H * 0.38);
    // 长凳
    ctx.fillStyle = ink;
    ctx.fillRect(W * 0.16, H * 0.56, W * 0.56, H * 0.03);
    ctx.fillRect(W * 0.2, H * 0.59, W * 0.02, H * 0.1);
    ctx.fillRect(W * 0.64, H * 0.59, W * 0.02, H * 0.1);
    // 两个人影
    drawFigure(ctx, W * 0.34, H * 0.56, 0.95, ink);
    drawFigure(ctx, W * 0.55, H * 0.56, 0.95, ink);
    // 两个饭盒
    ctx.fillStyle = 'rgba(198, 178, 146, 0.4)';
    fillRound(ctx, W * 0.4, H * 0.58, W * 0.1, H * 0.035, 3, 'rgba(198, 178, 146, 0.4)');
    fillRound(ctx, W * 0.52, H * 0.58, W * 0.1, H * 0.035, 3, 'rgba(198, 178, 146, 0.4)');
    // 飘落的叶
    for (let i = 0; i < 8; i += 1) {
      const lx = (rnd() * W + t * 8) % W;
      const ly = (rnd() * H * 0.5 + t * 14) % (H * 0.55);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#D6C2A0';
      ctx.fillRect(lx, ly, 3, 2);
    }
    ctx.globalAlpha = 1;
  } else if (scene === 'station') {
    // 站台
    ctx.fillStyle = ink;
    ctx.fillRect(0, H * 0.58, W, H * 0.06);
    // 铁轨
    ctx.strokeStyle = soft;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.72);
    ctx.lineTo(W, H * 0.68);
    ctx.moveTo(0, H * 0.78);
    ctx.lineTo(W, H * 0.74);
    ctx.stroke();
    // 火车
    ctx.fillStyle = 'rgba(34, 30, 26, 0.95)';
    fillRound(ctx, W * 0.1, H * 0.3, W * 0.8, H * 0.28, 8, 'rgba(34, 30, 26, 0.95)');
    ctx.fillStyle = line;
    for (let i = 0; i < 5; i += 1) {
      ctx.globalAlpha = 0.25 + rnd() * 0.4;
      ctx.fillRect(W * 0.16 + i * W * 0.13, H * 0.36, W * 0.08, H * 0.05);
    }
    ctx.globalAlpha = 1;
    // 车窗光
    ctx.fillStyle = 'rgba(226, 179, 106, 0.16)';
    ctx.fillRect(W * 0.1, H * 0.3, W * 0.8, H * 0.05);
    // 站台上的人
    drawFigure(ctx, W * 0.28, H * 0.58, 0.9, ink);
    drawFigure(ctx, W * 0.7, H * 0.58, 0.8, ink);
    // 挥手
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W * 0.7, H * 0.52);
    ctx.lineTo(W * 0.75, H * 0.45);
    ctx.stroke();
  } else if (scene === 'watch') {
    // 巨大的表盘
    ctx.strokeStyle = soft;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, H * 0.36, s * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * s * 0.31, H * 0.36 + Math.sin(a) * s * 0.31);
      ctx.lineTo(cx + Math.cos(a) * s * 0.34, H * 0.36 + Math.sin(a) * s * 0.34);
      ctx.stroke();
    }
    // 指针缓慢转动
    const hour = ((3 + 17 / 60) / 12) * Math.PI * 2 - Math.PI / 2 + t * 0.02;
    const minute = (17 / 60) * Math.PI * 2 - Math.PI / 2 + t * 0.06;
    ctx.strokeStyle = 'rgba(214, 194, 160, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, H * 0.36);
    ctx.lineTo(cx + Math.cos(hour) * s * 0.16, H * 0.36 + Math.sin(hour) * s * 0.16);
    ctx.moveTo(cx, H * 0.36);
    ctx.lineTo(cx + Math.cos(minute) * s * 0.26, H * 0.36 + Math.sin(minute) * s * 0.26);
    ctx.stroke();
    // 两个人影
    drawFigure(ctx, W * 0.34, H * 0.66, 1.05, ink);
    drawFigure(ctx, W * 0.64, H * 0.66, 0.95, ink);
    // 金色裂缝
    ctx.strokeStyle = 'rgba(226, 179, 106, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(W * 0.18, H * 0.2);
    ctx.lineTo(W * 0.3, H * 0.3);
    ctx.lineTo(W * 0.24, H * 0.42);
    ctx.stroke();
  }

  // 雨/尘埃统一叠加
  ctx.fillStyle = 'rgba(226, 179, 106, 0.18)';
  for (let i = 0; i < 26; i += 1) {
    const px = (rnd() * W + t * 6) % W;
    const py = (rnd() * H * 0.7 + t * 10) % (H * 0.75);
    ctx.fillRect(px, py, 1.2, 1.2);
  }

  // 暗角与颗粒
  const vg = ctx.createRadialGradient(W / 2, H * 0.42, H * 0.16, W / 2, H * 0.42, H * 0.82);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  grain(ctx, 0.2);
}

function drawFigure(ctx, x, y, scale, color, sitting = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -26, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  if (sitting) {
    ctx.moveTo(-12, 10);
    ctx.quadraticCurveTo(-12, -14, 0, -15);
    ctx.quadraticCurveTo(12, -14, 12, 10);
    ctx.lineTo(8, 22);
    ctx.lineTo(-8, 22);
  } else {
    ctx.moveTo(-11, 12);
    ctx.quadraticCurveTo(-13, -12, 0, -14);
    ctx.quadraticCurveTo(13, -12, 11, 12);
    ctx.lineTo(6, 40);
    ctx.lineTo(-6, 40);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 卡片缩略：深色底板 + 物件
export function drawThumb(ctx, art, material, x, y, w, h, time = 0) {
  const r = Math.min(w, h) * 0.36;
  const grad = ctx.createRadialGradient(x + w / 2, y + h * 0.42, 4, x + w / 2, y + h * 0.42, Math.max(w, h) * 0.7);
  grad.addColorStop(0, 'rgba(226, 179, 106, 0.12)');
  grad.addColorStop(1, 'rgba(18, 14, 10, 0.2)');
  ctx.save();
  fillRound(ctx, x, y, w, h, 10, 'rgba(20, 16, 12, 0.55)');
  ctx.fillStyle = grad;
  fillRound(ctx, x, y, w, h, 10, grad);
  ctx.restore();
  drawArtifact(ctx, art, x + w / 2, y + h / 2, r, time, { material });
}

export function drawCoinIcon(ctx, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#C79A4A';
  ctx.fill();
  ctx.strokeStyle = '#7E5C22';
  ctx.lineWidth = Math.max(1, r * 0.14);
  ctx.stroke();
  const h = r * 0.25;
  ctx.fillStyle = '#6B4D1C';
  ctx.fillRect(x - h, y - h, h * 2, h * 2);
  ctx.restore();
}
