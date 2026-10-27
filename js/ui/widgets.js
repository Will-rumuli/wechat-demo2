// 通用组件：按钮、图标按钮、滚动容器、进度条
import { COLORS, fillRound, strokeRound, text, clamp, drawCoin } from './theme.js';
import { FS } from '../core/screen.js';

export class Button {
  constructor(opt) {
    this.x = opt.x;
    this.y = opt.y;
    this.w = opt.w;
    this.h = opt.h;
    this.label = opt.label || '';
    this.sub = opt.sub || '';
    this.kind = opt.kind || 'primary'; // primary | ghost | paper | danger | gold
    this.size = opt.size || 16;
    this.onTap = opt.onTap || null;
    this.disabled = !!opt.disabled;
    this.pressed = 0;
  }

  hit(px, py) {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }

  tap(px, py) {
    if (this.disabled || !this.onTap) return false;
    if (!this.hit(px, py)) return false;
    this.pressed = 0.12;
    this.onTap();
    return true;
  }

  update(dt) {
    if (this.pressed > 0) this.pressed = Math.max(0, this.pressed - dt);
  }

  draw(ctx, time = 0) {
    const y = this.y - (this.pressed > 0 ? 1.5 : 0);
    const disabled = this.disabled;
    const r = Math.min(14, this.h / 2);
    // 有副标题时把主标题上移，避免两行文字挤在一起
    const labelY = this.sub && this.h >= 48 ? y + this.h / 2 - 7 : y + this.h / 2;
    if (this.kind === 'primary' || this.kind === 'gold') {
      const grad = ctx.createLinearGradient(0, y, 0, y + this.h);
      if (disabled) {
        grad.addColorStop(0, 'rgba(120, 105, 82, 0.9)');
        grad.addColorStop(1, 'rgba(90, 78, 60, 0.9)');
      } else {
        grad.addColorStop(0, '#EDC17C');
        grad.addColorStop(1, this.kind === 'gold' ? '#C49539' : '#D8A34D');
      }
      fillRound(ctx, this.x, y, this.w, this.h, r, grad);
      text(ctx, this.label, this.x + this.w / 2, labelY, {
        size: this.size,
        color: disabled ? 'rgba(35, 27, 18, 0.55)' : '#2A1E12',
        align: 'center',
        baseline: 'middle',
        weight: 600,
        maxWidth: this.w - 20
      });
    } else if (this.kind === 'paper') {
      fillRound(ctx, this.x, y, this.w, this.h, r, disabled ? 'rgba(60, 50, 40, 0.5)' : 'rgba(243, 231, 211, 0.92)');
      text(ctx, this.label, this.x + this.w / 2, labelY, {
        size: this.size,
        color: disabled ? 'rgba(40, 30, 20, 0.45)' : COLORS.ink,
        align: 'center',
        baseline: 'middle',
        weight: 600,
        maxWidth: this.w - 20
      });
    } else if (this.kind === 'danger') {
      fillRound(ctx, this.x, y, this.w, this.h, r, 'rgba(140, 74, 50, 0.24)');
      strokeRound(ctx, this.x + 0.5, y + 0.5, this.w - 1, this.h - 1, r, 'rgba(190, 110, 82, 0.65)', 1);
      text(ctx, this.label, this.x + this.w / 2, labelY, {
        size: this.size,
        color: '#E0A48C',
        align: 'center',
        baseline: 'middle',
        weight: 500,
        maxWidth: this.w - 20
      });
    } else {
      const glow = disabled ? 0.25 : 0.45 + Math.sin(time * 2) * 0.08;
      strokeRound(ctx, this.x + 0.5, y + 0.5, this.w - 1, this.h - 1, r, `rgba(243, 231, 211, ${glow})`, 1.2);
      text(ctx, this.label, this.x + this.w / 2, labelY, {
        size: this.size,
        color: disabled ? 'rgba(243, 231, 211, 0.38)' : COLORS.paper,
        align: 'center',
        baseline: 'middle',
        weight: 500,
        maxWidth: this.w - 20
      });
    }
    if (this.sub && this.h >= 48) {
      text(ctx, this.sub, this.x + this.w / 2, y + this.h - 13, {
        size: FS(11),
        color: this.kind === 'primary' || this.kind === 'gold' || this.kind === 'paper'
          ? 'rgba(42, 30, 18, 0.62)'
          : COLORS.gray,
        align: 'center',
        baseline: 'middle',
        maxWidth: this.w - 16
      });
    }
  }
}

export class IconButton {
  constructor(opt) {
    this.x = opt.x;
    this.y = opt.y;
    this.r = opt.r || 16;
    this.icon = opt.icon || 'back';
    this.onTap = opt.onTap || null;
    this.pressed = 0;
  }

  hit(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= (this.r + 10) * (this.r + 10);
  }

  tap(px, py) {
    if (!this.onTap || !this.hit(px, py)) return false;
    this.pressed = 0.12;
    this.onTap();
    return true;
  }

  update(dt) {
    if (this.pressed > 0) this.pressed = Math.max(0, this.pressed - dt);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.pressed > 0 ? 0.65 : 1;
    fillRound(ctx, this.x - this.r, this.y - this.r, this.r * 2, this.r * 2, this.r, 'rgba(24, 18, 13, 0.6)');
    strokeRound(ctx, this.x - this.r + 0.5, this.y - this.r + 0.5, this.r * 2 - 1, this.r * 2 - 1, this.r, 'rgba(226, 179, 106, 0.3)', 1);
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (this.icon === 'back') {
      ctx.beginPath();
      ctx.moveTo(this.x + 3, this.y - 6);
      ctx.lineTo(this.x - 3, this.y);
      ctx.lineTo(this.x + 3, this.y + 6);
      ctx.stroke();
    } else if (this.icon === 'sound') {
      ctx.beginPath();
      ctx.moveTo(this.x - 6, this.y - 3);
      ctx.lineTo(this.x - 2, this.y - 3);
      ctx.lineTo(this.x + 2, this.y - 7);
      ctx.lineTo(this.x + 2, this.y + 7);
      ctx.lineTo(this.x - 2, this.y + 3);
      ctx.lineTo(this.x - 6, this.y + 3);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x + 2, this.y, 5, -0.9, 0.9);
      ctx.stroke();
    } else if (this.icon === 'mute') {
      ctx.beginPath();
      ctx.moveTo(this.x - 6, this.y - 3);
      ctx.lineTo(this.x - 2, this.y - 3);
      ctx.lineTo(this.x + 2, this.y - 7);
      ctx.lineTo(this.x + 2, this.y + 7);
      ctx.lineTo(this.x - 2, this.y + 3);
      ctx.lineTo(this.x - 6, this.y + 3);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.x + 3, this.y - 3);
      ctx.lineTo(this.x + 8, this.y + 3);
      ctx.moveTo(this.x + 8, this.y - 3);
      ctx.lineTo(this.x + 3, this.y + 3);
      ctx.stroke();
    } else if (this.icon === 'book') {
      ctx.strokeRect(this.x - 7, this.y - 7, 14, 14);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 7);
      ctx.lineTo(this.x, this.y + 7);
      ctx.moveTo(this.x - 7, this.y - 2);
      ctx.lineTo(this.x - 2, this.y - 2);
      ctx.moveTo(this.x + 2, this.y - 2);
      ctx.lineTo(this.x + 7, this.y - 2);
      ctx.stroke();
    } else if (this.icon === 'tool') {
      ctx.beginPath();
      ctx.moveTo(this.x - 6, this.y + 6);
      ctx.lineTo(this.x + 2, this.y - 2);
      ctx.moveTo(this.x + 1, this.y - 6);
      ctx.lineTo(this.x + 5, this.y - 6);
      ctx.lineTo(this.x + 6, this.y - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x - 7, this.y + 7, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function tag(ctx, label, x, y, color, padding = 7) {
  ctx.save();
  ctx.font = `500 ${FS(11)}px "PingFang SC", sans-serif`;
  const w = ctx.measureText(label).width + padding * 2;
  fillRound(ctx, x, y - 9, w, 18, 9, 'rgba(255,255,255,0.05)');
  strokeRound(ctx, x, y - 9, w, 18, 9, color, 1);
  text(ctx, label, x + padding, y + 0.5, { size: FS(11), color, baseline: 'middle' });
  ctx.restore();
  return w;
}

// 通用纵向滚动容器：拖动 + 松手惯性 + 边界钳位
export class ScrollView {
  constructor(opt) {
    this.x = opt.x;
    this.y = opt.y;
    this.w = opt.w;
    this.h = opt.h;
    this.contentH = 0;
    this.offset = 0;
    this.max = 0;
    this.dragging = false;
    this.lastY = 0;
    this.velocity = 0;
    this.moved = 0;
  }

  setContent(height) {
    this.contentH = height;
    this.max = Math.max(0, height - this.h);
    this.offset = clamp(this.offset, 0, this.max);
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h;
  }

  start(x, y) {
    if (!this.contains(x, y)) return false;
    this.dragging = true;
    this.lastY = y;
    this.velocity = 0;
    this.moved = 0;
    return true;
  }

  move(y) {
    if (!this.dragging) return;
    const dy = y - this.lastY;
    this.lastY = y;
    this.offset = clamp(this.offset - dy, 0, this.max);
    this.velocity = -dy;
    this.moved += Math.abs(dy);
  }

  end() {
    if (!this.dragging) return false;
    this.dragging = false;
    const tapped = this.moved < 6;
    this.moved = 0;
    return tapped;
  }

  update(dt) {
    if (this.dragging || Math.abs(this.velocity) < 0.2) return;
    this.offset = clamp(this.offset + this.velocity * 60 * dt, 0, this.max);
    this.velocity *= Math.pow(0.02, dt);
    if (Math.abs(this.velocity) < 0.2) this.velocity = 0;
  }

  drawBar(ctx) {
    if (this.max <= 0.5) return;
    const height = Math.max(24, this.h * this.h / this.contentH);
    const y = this.y + (this.h - height) * (this.offset / this.max);
    fillRound(ctx, this.x + this.w - 4, y, 3, height, 1.5, 'rgba(243, 231, 211, 0.24)');
  }
}

export function progressBar(ctx, x, y, w, h, value, color = COLORS.amber) {
  fillRound(ctx, x, y, w, h, h / 2, 'rgba(243, 231, 211, 0.12)');
  const v = clamp(value, 0, 1);
  if (v > 0) fillRound(ctx, x, y, Math.max(h, w * v), h, h / 2, color);
}

export function coinText(ctx, amount, x, y, size = FS(14), align = 'left') {
  ctx.save();
  ctx.font = `600 ${size}px "PingFang SC", sans-serif`;
  const label = String(amount);
  const labelW = ctx.measureText(label).width;
  const r = size * 0.55;
  const totalW = labelW + r * 2 + 6;
  let startX = x;
  if (align === 'right') startX = x - totalW;
  else if (align === 'center') startX = x - totalW / 2;
  ctx.restore();
  drawCoin(ctx, startX + r, y, r);
  text(ctx, label, startX + r * 2 + 6, y, {
    size, color: COLORS.amber, baseline: 'middle', weight: 600
  });
  return totalW;
}

// 步骤圆点：当前高亮，完成打勾
export function stepDots(ctx, cx, y, total, current, done) {
  const gap = 18;
  const startX = cx - ((total - 1) * gap) / 2;
  for (let i = 0; i < total; i += 1) {
    const x = startX + i * gap;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    if (i < current || done) {
      ctx.fillStyle = COLORS.amber;
      ctx.fill();
    } else if (i === current) {
      ctx.fillStyle = COLORS.amber;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(226, 179, 106, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(243, 231, 211, 0.22)';
      ctx.fill();
    }
    ctx.restore();
  }
}
