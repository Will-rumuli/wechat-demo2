// 主题：暖褐修复铺配色、中文排版与通用绘制
import { W, H, TOP, FS, grain } from '../core/screen.js';

export const COLORS = {
  night: '#0E0D0C',
  night2: '#17130F',
  wood: '#3A2A1E',
  wood2: '#261B13',
  wood3: '#4A3524',
  paper: '#F3E7D3',
  paperDim: '#CDBFA9',
  amber: '#E2B36A',
  gold: '#D9A441',
  goldSoft: 'rgba(226, 179, 106, 0.22)',
  rust: '#8C4A32',
  ink: '#241A12',
  gray: '#9C8B76',
  gray2: '#6F6152',
  blue: '#7FA3B8',
  green: '#8FA97C',
  red: '#B45A44',
  shadow: 'rgba(0,0,0,0.35)'
};

// 材质色：决定物件主色、裂纹与音效分组
export const MATERIALS = {
  enamel: { base: '#D6DDE0', light: '#EFF4F5', dark: '#8E9BA1', rim: '#4E7E97' },
  fabric: { base: '#C8A66C', light: '#E0C590', dark: '#8A6C3D', rim: '#6F5430' },
  wood: { base: '#8C5B35', light: '#B07C4C', dark: '#5B3A20', rim: '#402813' },
  metal: { base: '#9DA6AA', light: '#C6CDD0', dark: '#667075', rim: '#495256' },
  glass: { base: '#AFC3C9', light: '#D8E5E8', dark: '#6E848C', rim: '#4E646C' },
  brass: { base: '#C89A50', light: '#E7C482', dark: '#8A6526', rim: '#5E4417' }
};

export function colorWithAlpha(hex, alpha) {
  const value = String(hex || '').replace('#', '');
  if (value.length !== 6) return hex;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function fillRound(ctx, x, y, w, h, r, color) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

export function strokeRound(ctx, x, y, w, h, r, color, lineWidth = 1) {
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function fontOf(opt = {}) {
  const size = opt.size || FS(14);
  return `${opt.weight || 400} ${size}px "PingFang SC", "Helvetica Neue", sans-serif`;
}

// 单行截断：必须按实际字号测量，否则中文会被截断
export function ellipsis(ctx, str, maxWidth) {
  const value = String(str);
  if (maxWidth <= 0) return '';
  if (ctx.measureText(value).width <= maxWidth) return value;
  const mark = '…';
  let out = '';
  for (let i = 0; i < value.length; i += 1) {
    const test = value.slice(0, i + 1) + mark;
    if (ctx.measureText(test).width > maxWidth) break;
    out = value.slice(0, i + 1);
  }
  return out + mark;
}

export function text(ctx, str, x, y, opt = {}) {
  ctx.save();
  ctx.font = fontOf(opt);
  ctx.fillStyle = opt.color || COLORS.paper;
  ctx.textAlign = opt.align || 'left';
  ctx.textBaseline = opt.baseline || 'alphabetic';
  ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
  const value = opt.maxWidth ? ellipsis(ctx, str, opt.maxWidth) : String(str);
  ctx.fillText(value, x, y);
  ctx.restore();
}

// 中文断行：行首不出现收尾标点，行尾不留下开引号/括号
const NO_LINE_START = '，。、！？；：）】》”』…,.!?;:)]}';
const NO_LINE_END = '（【《“‘『([{';

function breakLines(ctx, str, maxWidth) {
  const chars = String(str).split('');
  const lines = [];
  let line = '';
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const test = line + ch;
    if (line && ctx.measureText(test).width > maxWidth) {
      if (NO_LINE_START.indexOf(ch) !== -1) {
        lines.push(test);
        line = '';
        continue;
      }
      let carry = '';
      while (line && NO_LINE_END.indexOf(line.slice(-1)) !== -1) {
        carry = line.slice(-1) + carry;
        line = line.slice(0, -1);
      }
      lines.push(line);
      line = carry + ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function wrapText(ctx, str, x, y, maxWidth, lineHeight, maxLines = 99, opt = {}) {
  ctx.save();
  ctx.font = fontOf(opt);
  let lines = breakLines(ctx, str, maxWidth);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = ellipsis(ctx, `${lines[maxLines - 1]}…`, maxWidth);
  }
  ctx.restore();
  for (let i = 0; i < lines.length; i += 1) {
    text(ctx, lines[i], x, y + i * lineHeight, opt);
  }
  return lines.length;
}

// 传入 opt 时按 opt 字号测量；不传则沿用调用方已设置的 ctx.font
export function measureLines(ctx, str, maxWidth, opt) {
  ctx.save();
  if (opt) ctx.font = fontOf(opt);
  const count = breakLines(ctx, str, maxWidth).length;
  ctx.restore();
  return count;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// 卡片底板：半透明深色 + 细金边
export function panel(ctx, x, y, w, h, r = 14, alpha = 0.72) {
  fillRound(ctx, x, y, w, h, r, `rgba(26, 20, 15, ${alpha})`);
  strokeRound(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r, 'rgba(226, 179, 106, 0.18)', 1);
}

export function divider(ctx, x1, y, x2, color = 'rgba(243, 231, 211, 0.12)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y + 0.5);
  ctx.lineTo(x2, y + 0.5);
  ctx.stroke();
  ctx.restore();
}

// 修复铺背景：木柜台俯视 + 台灯暖光 + 雨窗
export function drawWorkbench(ctx, time, dim = 0) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#17120E');
  bg.addColorStop(0.42, '#241A13');
  bg.addColorStop(1, '#120E0B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 木纹板
  const top = H * 0.1;
  const bottom = H * 0.94;
  const plank = (bottom - top) / 7;
  const rnd = seeded(20261022);
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 7; i += 1) {
    const y = top + i * plank;
    ctx.fillStyle = i % 2 ? 'rgba(74, 51, 34, 0.34)' : 'rgba(58, 41, 28, 0.34)';
    ctx.fillRect(0, y, W, plank);
    ctx.strokeStyle = 'rgba(18, 12, 8, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();

    // 木纹细线
    for (let k = 0; k < 4; k += 1) {
      const wy = y + 8 + rnd() * (plank - 16);
      ctx.strokeStyle = `rgba(20, 13, 9, ${0.08 + rnd() * 0.1})`;
      ctx.beginPath();
      ctx.moveTo(0, wy);
      ctx.bezierCurveTo(W * 0.3, wy + rnd() * 6 - 3, W * 0.7, wy - rnd() * 6 + 3, W, wy);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 台灯暖光
  const lampX = W * 0.5;
  const lampY = H * 0.3;
  const glow = ctx.createRadialGradient(lampX, lampY, 10, lampX, lampY, Math.max(W, H) * 0.7);
  glow.addColorStop(0, 'rgba(240, 188, 112, 0.20)');
  glow.addColorStop(0.45, 'rgba(226, 160, 86, 0.08)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 左上窗格与雨
  ctx.save();
  ctx.globalAlpha = 0.5;
  const wx = -W * 0.06;
  const wy = TOP + 6;
  const ww = W * 0.34;
  const wh = H * 0.2;
  ctx.fillStyle = 'rgba(18, 26, 32, 0.55)';
  ctx.fillRect(wx, wy, ww, wh);
  ctx.strokeStyle = 'rgba(12, 16, 18, 0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 2);
  ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(170, 200, 218, 0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i += 1) {
    const rx = wx + ((i * 53 + time * 26) % ww);
    const ry = wy + ((i * 97 + time * 220) % wh);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 2, ry + 8);
    ctx.stroke();
  }
  ctx.restore();

  // 暗角
  const vg = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.24, W / 2, H * 0.46, H * 0.86);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  if (dim > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${dim})`;
    ctx.fillRect(0, 0, W, H);
  }
  grain(ctx, 0.14);
}

// 旧铜板图标
export function drawCoin(ctx, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#C79A4A';
  ctx.fill();
  ctx.strokeStyle = '#7E5C22';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 233, 180, 0.55)';
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.stroke();
  // 方孔
  const h = r * 0.24;
  ctx.fillStyle = '#6B4D1C';
  ctx.fillRect(x - h, y - h, h * 2, h * 2);
  ctx.restore();
}

export function drawStar(ctx, x, y, r, filled, color = COLORS.amber) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(243, 231, 211, 0.32)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();
}
