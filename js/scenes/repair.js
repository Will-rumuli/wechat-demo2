// 修复工作台：拼、缝、转、磨、拂五种指尖手势
import { W, H, SAFE_TOP, SAFE_BOTTOM, FS, lightVibrate } from '../core/screen.js';
import {
  COLORS, MATERIALS, drawWorkbench, panel, text, wrapText,
  clamp, seeded
} from '../ui/theme.js';
import { IconButton, progressBar, stepDots } from '../ui/widgets.js';
import { drawArtifact } from '../ui/art.js';
import { levelById, LEVELS } from '../data/levels.js';
import { getSave } from '../core/storage.js';
import { finishThreshold, toleranceScale, hintDelay } from '../data/tools.js';
import { play, playMaterial, playTap } from '../core/audio.js';

const PAD = 18;
const TAU = Math.PI * 2;

const HINT = {
  pick: '拖动碎片，对准虚线轮廓',
  trace: '按住裂缝起点，沿裂纹慢慢移动',
  rotate: '绕着物件画圈，带动齿轮',
  rub: '在锈迹上反复打圈打磨',
  swipe: '沿箭头方向快速拂过'
};

function dist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

export default class Repair {
  constructor(app, params) {
    this.app = app;
    this.level = levelById(params.id) || LEVELS[0];
    this.time = 0;
    this.elapsed = 0;
    this.stepIndex = 0;
    this.totalSteps = this.level.steps.length;
    this.done = false;
    this.exitArm = 0;
    this.save = getSave();
    this.threshold = finishThreshold(this.save.tools);
    this.tolScale = toleranceScale(this.save.tools);
    this.hintAfter = hintDelay(this.save.tools);

    this.back = new IconButton({
      x: PAD + 14, y: SAFE_TOP + 14, r: 15, icon: 'back',
      onTap: () => this.onBack()
    });

    this.work = {
      x: PAD,
      y: SAFE_TOP + 58,
      w: W - PAD * 2,
      h: 0
    };
    this.work.h = H - SAFE_BOTTOM - 100 - this.work.y;
    this.cx = W / 2;
    this.cy = this.work.y + this.work.h * 0.5;
    this.R = Math.min(this.work.w * 0.38, this.work.h * 0.44);

    this.panelY = H - SAFE_BOTTOM - 90;
    this.panelH = 82;

    this.particles = [];
    this.trail = [];
    this.idleT = 0;
    this.hintT = 0;
    this.stepEndT = 0;
    this.touch = null;
    this.initStep();
  }

  initStep() {
    const def = this.level.steps[this.stepIndex];
    this.def = def;
    this.progress = 0;
    this.stepDone = false;
    this.stepEndT = 0;
    this.accum = 0;
    this.trail = [];
    this.snapT = 0;
    this.pieces = [];
    this.grid = [];
    this.samples = [];
    this.rotateActive = false;
    this.rotateLast = 0;
    this.sourceCells = 0;

    if (def.type === 'pick') this.buildPick(def);
    else if (def.type === 'trace') this.buildTrace(def);
    else if (def.type === 'rotate') this.buildRotate(def);
    else if (def.type === 'rub') this.buildGrid(def, 'rub');
    else if (def.type === 'swipe') this.buildGrid(def, 'swipe');
  }

  buildPick(def) {
    const layouts = {
      3: [[0, -0.32], [-0.34, 0.22], [0.34, 0.22]],
      4: [[-0.3, -0.28], [0.3, -0.28], [-0.3, 0.26], [0.3, 0.26]],
      5: [[0, -0.42], [-0.4, -0.06], [0.4, -0.06], [-0.22, 0.4], [0.22, 0.4]],
      6: [[-0.3, -0.38], [0.3, -0.38], [-0.42, 0.02], [0.42, 0.02], [-0.24, 0.4], [0.24, 0.4]]
    };
    const slots = layouts[def.pieces] || layouts[5];
    const rnd = seeded(this.level.id.length * 97 + this.stepIndex * 31 + 7);
    const pieceSize = Math.min(this.R * 0.19, 38);

    const starts = shuffle([
      { x: this.work.x + this.work.w * 0.12, y: this.work.y + this.work.h * 0.18 },
      { x: this.work.x + this.work.w * 0.88, y: this.work.y + this.work.h * 0.2 },
      { x: this.work.x + this.work.w * 0.1, y: this.work.y + this.work.h * 0.82 },
      { x: this.work.x + this.work.w * 0.9, y: this.work.y + this.work.h * 0.8 },
      { x: this.work.x + this.work.w * 0.3, y: this.work.y + this.work.h * 0.92 },
      { x: this.work.x + this.work.w * 0.7, y: this.work.y + this.work.h * 0.92 }
    ]);

    this.pieceSize = pieceSize;
    this.pieces = slots.map((slot, i) => {
      const targetX = this.cx + slot[0] * this.R;
      const targetY = this.cy + slot[1] * this.R;
      const start = starts[i % starts.length];
      const poly = [];
      const n = 7;
      for (let k = 0; k < n; k += 1) {
        const a = (k / n) * TAU;
        const rr = pieceSize * (0.68 + rnd() * 0.34);
        poly.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
      return {
        targetX,
        targetY,
        x: start.x + (rnd() - 0.5) * 18,
        y: start.y + (rnd() - 0.5) * 18,
        poly,
        size: pieceSize,
        placed: false,
        dragging: false,
        spin: rnd() * TAU
      };
    });
    this.dragIndex = -1;
    this.dragDX = 0;
    this.dragDY = 0;
  }

  buildTrace(def) {
    const rnd = seeded(this.level.id.length * 131 + this.stepIndex * 17 + 3);
    const startX = this.cx - this.R * 0.66;
    const endX = this.cx + this.R * 0.66;
    const baseY = this.cy + (rnd() - 0.5) * this.R * 0.2;
    const pts = [];
    const seg = 6;
    for (let i = 0; i <= seg; i += 1) {
      const t = i / seg;
      const x = startX + (endX - startX) * t;
      const y = baseY + Math.sin(t * Math.PI * 2.2) * this.R * 0.18 + (rnd() - 0.5) * this.R * 0.05;
      pts.push({ x, y });
    }
    // 插值成等距采样点
    const samples = [];
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i];
      const b = pts[i + 1];
      const steps = 6;
      for (let k = 0; k < steps; k += 1) {
        const t = k / steps;
        samples.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          covered: false
        });
      }
    }
    samples.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y, covered: false });
    this.samples = samples;
    this.traceWidth = Math.max(12, def.width * this.tolScale);
  }

  buildRotate(def) {
    this.targetAngle = (def.turns || 1) * TAU;
    this.dialR = this.R * 0.58;
    this.gearAngle = 0;
  }

  buildGrid(def, mode) {
    const n = def.cells || 7;
    const rx = this.R * 0.76;
    const ry = this.R * 0.66;
    const stepX = (rx * 2) / n;
    const stepY = (ry * 2) / n;
    const list = [];
    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) {
        const x = this.cx - rx + (col + 0.5) * stepX;
        const y = this.cy - ry + (row + 0.5) * stepY;
        const nx = (x - this.cx) / rx;
        const ny = (y - this.cy) / ry;
        if (nx * nx + ny * ny <= 1.02) {
          list.push({ x, y, clean: 0, size: Math.min(stepX, stepY) * 0.94 });
        }
      }
    }
    this.grid = list;
    this.sourceCells = list.length;
    this.gridMode = mode;
    this.brushR = Math.max(15, this.R * 0.15 * this.tolScale);
    this.lastMove = null;
    this.dirX = def.dir === 'left' ? -1 : 0;
    this.dirY = def.dir === 'up' ? -1 : 0;
    this.cleanedCount = 0;
  }

  update(dt) {
    this.time += dt;
    this.elapsed += dt;
    this.back.update(dt);
    this.idleT += dt;
    if (this.hintT > 0) this.hintT = Math.max(0, this.hintT - dt);
    if (this.exitArm > 0) this.exitArm = Math.max(0, this.exitArm - dt);
    if (this.snapT > 0) this.snapT = Math.max(0, this.snapT - dt);

    // 粒子
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    if (this.stepDone) {
      this.stepEndT += dt;
      if (this.stepEndT > 0.7) {
        if (this.stepIndex >= this.totalSteps - 1) {
          this.finish();
        } else {
          this.stepIndex += 1;
          this.initStep();
        }
      }
      return;
    }

    // 长时间没有操作时自动提示
    if (this.idleT > this.hintAfter) {
      this.hintT = Math.max(this.hintT, 2.4);
      this.idleT = 0;
    }

    // 进度回落：低于 0.6 时慢慢退，避免卡死
    if (!this.touch && this.progress > 0 && this.progress < 0.6 && this.def.type !== 'rotate') {
      if (this.def.type === 'trace') return;
      this.progress = Math.max(0, this.progress - dt * 0.012);
      if (this.grid.length) this.recalcGrid();
    } else if (this.def.type === 'rotate' && !this.touch && this.progress < 0.6) {
      this.accum = Math.max(0, this.accum - dt * 0.25);
      this.progress = Math.min(1, this.accum / this.targetAngle);
    }
  }

  recalcGrid() {
    if (!this.grid.length) return;
    let sum = 0;
    for (let i = 0; i < this.grid.length; i += 1) {
      sum += clamp(this.grid[i].clean, 0, 1);
    }
    this.progress = sum / this.grid.length;
  }

  start(x, y, touches) {
    this.idleT = 0;
    this.touch = { x, y, sx: x, sy: y, lx: x, ly: y };
    if (this.back.tap(x, y)) {
      playTap();
      return;
    }
    // 右上角提示按钮
    if (y < SAFE_TOP + 34 && x > W - 76) {
      this.hintT = 3;
      playTap();
      return;
    }
    if (this.stepDone) return;

    const type = this.def.type;
    if (type === 'pick') {
      let best = -1;
      let bestD = 999;
      for (let i = 0; i < this.pieces.length; i += 1) {
        const p = this.pieces[i];
        if (p.placed) continue;
        const d = dist(x, y, p.x, p.y);
        if (d < p.size * 1.7 && d < bestD) {
          best = i;
          bestD = d;
        }
      }
      if (best >= 0) {
        const p = this.pieces[best];
        p.dragging = true;
        this.dragIndex = best;
        this.dragDX = p.x - x;
        this.dragDY = p.y - y;
        play('tap');
      }
    } else if (type === 'trace') {
      this.lastTrace = { x, y };
      this.applyTrace(x, y);
      if (touches && touches.length > 1) this.applyTrace(touches[1].x, touches[1].y);
    } else if (type === 'rotate') {
      if (dist(x, y, this.cx, this.cy) < this.dialR * 1.9) {
        this.rotateActive = true;
        this.rotateLast = Math.atan2(y - this.cy, x - this.cx);
      }
    } else if (type === 'rub') {
      this.lastStamp = { x, y };
      this.applyRub(x, y);
    } else if (type === 'swipe') {
      this.lastMove = { x, y };
      this.lastStamp = { x, y };
    }
  }

  move(x, y, touches) {
    this.idleT = 0;
    if (!this.touch) this.touch = { x, y, sx: x, sy: y, lx: x, ly: y };
    const type = this.def.type;
    if (this.stepDone) {
      this.touch.lx = x;
      this.touch.ly = y;
      return;
    }

    if (type === 'pick') {
      if (this.dragIndex >= 0) {
        const p = this.pieces[this.dragIndex];
        p.x = clamp(x + this.dragDX, this.work.x + 12, this.work.x + this.work.w - 12);
        p.y = clamp(y + this.dragDY, this.work.y + 12, this.work.y + this.work.h - 12);
        const tol = (this.def.tol || 28) * this.tolScale;
        if (dist(p.x, p.y, p.targetX, p.targetY) < tol) {
          p.x = p.targetX;
          p.y = p.targetY;
          p.placed = true;
          p.dragging = false;
          this.dragIndex = -1;
          this.snapT = 0.18;
          this.playStepSound();
          lightVibrate();
          this.spawnGold(p.x, p.y, 6);
          const placed = this.pieces.filter((item) => item.placed).length;
          this.progress = placed / this.pieces.length;
          if (placed === this.pieces.length) this.completeStep();
        }
      }
    } else if (type === 'trace') {
      this.applyTrace(x, y);
      if (touches && touches.length > 1) this.applyTrace(touches[1].x, touches[1].y);
    } else if (type === 'rotate') {
      if (!this.rotateActive) return;
      const angle = Math.atan2(y - this.cy, x - this.cx);
      let delta = angle - this.rotateLast;
      while (delta > Math.PI) delta -= TAU;
      while (delta < -Math.PI) delta += TAU;
      this.rotateLast = angle;
      this.accum += Math.abs(delta);
      this.gearAngle += delta;
      this.progress = Math.min(1, this.accum / this.targetAngle);
      if (Math.random() < 0.12) this.spawnGold(x, y, 1);
      if (this.progress >= this.threshold) this.completeStep();
    } else if (type === 'rub') {
      this.applyRub(x, y);
    } else if (type === 'swipe') {
      this.applySwipe(x, y);
    }

    this.touch.lx = x;
    this.touch.ly = y;
  }

  end() {
    this.touch = null;
    this.rotateActive = false;
    if (this.dragIndex >= 0) {
      const p = this.pieces[this.dragIndex];
      p.dragging = false;
      this.dragIndex = -1;
    }
    this.lastMove = null;
    this.lastTrace = null;
    this.lastStamp = null;
  }

  cancel() {
    this.end();
  }

  applyTrace(x, y) {
    const brush = this.traceWidth * 0.62;
    const from = this.lastTrace || { x, y };
    const steps = Math.max(1, Math.ceil(dist(from.x, from.y, x, y) / Math.max(4, brush * 0.5)));
    let hit = false;
    for (let s = 0; s <= steps; s += 1) {
      const px = from.x + (x - from.x) * (s / steps);
      const py = from.y + (y - from.y) * (s / steps);
      for (let i = 0; i < this.samples.length; i += 1) {
        const sample = this.samples[i];
        if (!sample.covered && dist(px, py, sample.x, sample.y) < brush) {
          sample.covered = true;
          hit = true;
        }
      }
    }
    this.lastTrace = { x, y };
    const covered = this.samples.filter((s) => s.covered).length;
    this.progress = covered / this.samples.length;
    if (hit && this.time - (this.lastStitch || 0) > 0.12) {
      this.lastStitch = this.time;
      play('stitch');
    }
    this.trail.push({ x, y, life: 0.5 });
    if (this.trail.length > 14) this.trail.shift();
    if (this.progress >= this.threshold) this.completeStep();
  }

  applyRub(x, y) {
    const from = this.lastStamp || { x, y };
    const steps = Math.max(1, Math.ceil(dist(from.x, from.y, x, y) / Math.max(6, this.brushR * 0.5)));
    let cleaned = 0;
    for (let s = 0; s <= steps; s += 1) {
      const px = from.x + (x - from.x) * (s / steps);
      const py = from.y + (y - from.y) * (s / steps);
      for (let i = 0; i < this.grid.length; i += 1) {
        const g = this.grid[i];
        if (dist(px, py, g.x, g.y) < this.brushR) {
          if (g.clean < 0.7) cleaned += 1;
          g.clean = Math.min(1, g.clean + 0.26);
        }
      }
    }
    this.lastStamp = { x, y };
    if (cleaned > 0) {
      this.recalcGrid();
      if (this.time - (this.lastRub || 0) > 0.16) {
        this.lastRub = this.time;
        play('rub');
      }
      if (Math.random() < 0.5) this.spawnDust(x, y, 2, '#8C4A32');
    }
    if (this.progress >= this.threshold) this.completeStep();
  }

  applySwipe(x, y) {
    if (!this.lastMove) {
      this.lastMove = { x, y };
      return;
    }
    const dx = x - this.lastMove.x;
    const dy = y - this.lastMove.y;
    this.lastMove = { x, y };
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    // 方向一致才算
    const dot = (dx / len) * this.dirX + (dy / len) * this.dirY;
    if (dot < 0.35) return;
    const from = this.lastStamp || { x, y };
    const steps = Math.max(1, Math.ceil(dist(from.x, from.y, x, y) / Math.max(6, this.brushR * 0.5)));
    let hit = 0;
    for (let s = 0; s <= steps; s += 1) {
      const px = from.x + (x - from.x) * (s / steps);
      const py = from.y + (y - from.y) * (s / steps);
      for (let i = 0; i < this.grid.length; i += 1) {
        const g = this.grid[i];
        if (dist(px, py, g.x, g.y) < this.brushR * 1.1) {
          if (g.clean < 0.7) hit += 1;
          g.clean = Math.min(1, g.clean + 0.4);
        }
      }
    }
    this.lastStamp = { x, y };
    if (hit > 0) {
      this.recalcGrid();
      if (this.time - (this.lastRub || 0) > 0.14) {
        this.lastRub = this.time;
        play('rub');
      }
      if (Math.random() < 0.5) {
        this.spawnDust(x, y, 3, '#A79A86');
      }
    }
    if (this.progress >= this.threshold) this.completeStep();
  }

  playStepSound() {
    playMaterial(this.level.material);
  }

  spawnGold(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * TAU;
      const speed = 20 + Math.random() * 50;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 18,
        gravity: 30,
        life: 0.5 + Math.random() * 0.5,
        max: 1,
        size: 1.4 + Math.random() * 2,
        color: '#E8C37E'
      });
    }
  }

  spawnDust(x, y, count, color) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 28,
        vy: -10 - Math.random() * 24,
        gravity: 70,
        life: 0.4 + Math.random() * 0.4,
        max: 1,
        size: 1 + Math.random() * 2,
        color
      });
    }
  }

  completeStep() {
    if (this.stepDone) return;
    this.stepDone = true;
    this.progress = 1;
    if (this.grid.length) this.grid.forEach((g) => { g.clean = 1; });
    if (this.samples.length) this.samples.forEach((s) => { s.covered = true; });
    this.pieces.forEach((p) => { p.placed = true; p.x = p.targetX; p.y = p.targetY; });
    this.spawnGold(this.cx, this.cy, 18);
    play('chime');
    lightVibrate();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    const par = this.level.par || 90;
    const stars = this.elapsed <= par ? 3 : this.elapsed <= par * 1.6 ? 2 : 1;
    this.app.go('memory', {
      id: this.level.id,
      stars,
      seconds: Math.round(this.elapsed)
    });
  }

  onBack() {
    if (this.exitArm > 0) {
      this.app.go('shop');
      return;
    }
    this.exitArm = 2.2;
    this.app.toast('再点一次返回铺子，本次进度不保留');
  }

  render(ctx) {
    drawWorkbench(ctx, this.time, 0.2);

    this.back.draw(ctx);
    text(ctx, this.level.name, W / 2, SAFE_TOP + 14, {
      size: FS(15), color: COLORS.paper, align: 'center', baseline: 'middle', weight: 500,
      maxWidth: W - 140
    });
    text(ctx, '提示', W - PAD - 6, SAFE_TOP + 14, {
      size: FS(12), color: this.hintT > 0 ? COLORS.amber : COLORS.gray,
      align: 'right', baseline: 'middle'
    });

    stepDots(ctx, W / 2, SAFE_TOP + 44, this.totalSteps, this.stepIndex, false);

    // 物件
    ctx.save();
    ctx.globalAlpha = this.def.type === 'pick' ? 0.62 : 0.9;
    drawArtifact(ctx, this.level.art, this.cx, this.cy, this.R, this.time, {
      material: this.level.material
    });
    ctx.restore();

    if (this.def.type === 'pick') this.renderPick(ctx);
    else if (this.def.type === 'trace') this.renderTrace(ctx);
    else if (this.def.type === 'rotate') this.renderRotate(ctx);
    else this.renderGrid(ctx);

    this.renderParticles(ctx);

    // 步骤条
    const panelW = W - PAD * 2;
    panel(ctx, PAD, this.panelY, panelW, this.panelH, 14, 0.82);
    const noteColor = this.stepDone ? COLORS.amber : COLORS.paper;
    wrapText(ctx, this.def.note, PAD + 14, this.panelY + 22, panelW - 28, FS(19), 2, {
      size: FS(13), color: noteColor, weight: 500
    });
    text(ctx, this.stepDone ? '这一步修好了' : (HINT[this.def.type] || ''), PAD + 14, this.panelY + 48, {
      size: FS(10), color: COLORS.gray, maxWidth: panelW - 90
    });
    text(ctx, `${Math.floor(this.progress * 100)}%`, PAD + panelW - 14, this.panelY + 48, {
      size: FS(11), color: COLORS.amber, align: 'right'
    });
    progressBar(ctx, PAD + 14, this.panelY + this.panelH - 22, panelW - 28, 5, this.progress);
  }

  renderParticles(ctx) {
    ctx.save();
    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderPick(ctx) {
    const pulse = 0.5 + Math.sin(this.time * 3) * 0.3;
    // 目标轮廓
    for (let i = 0; i < this.pieces.length; i += 1) {
      const p = this.pieces[i];
      if (p.placed) continue;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = this.hintT > 0
        ? `rgba(226, 179, 106, ${0.45 + pulse * 0.4})`
        : 'rgba(226, 179, 106, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.targetX, p.targetY, p.size * 0.8, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      if (this.hintT > 0) {
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(p.targetX, p.targetY, p.size * (1 + Math.sin(this.time * 3 + i) * 0.12), 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 碎片
    const mat = MATERIALS[this.level.material] || MATERIALS.wood;
    for (let i = 0; i < this.pieces.length; i += 1) {
      const p = this.pieces[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.dragging) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
      }
      ctx.beginPath();
      for (let k = 0; k < p.poly.length; k += 1) {
        if (k === 0) ctx.moveTo(p.poly[k][0], p.poly[k][1]);
        else ctx.lineTo(p.poly[k][0], p.poly[k][1]);
      }
      ctx.closePath();
      const grad = ctx.createLinearGradient(-p.size, -p.size, p.size, p.size);
      grad.addColorStop(0, mat.light);
      grad.addColorStop(0.55, mat.base);
      grad.addColorStop(1, mat.dark);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = p.placed ? 'rgba(226, 179, 106, 0.75)' : 'rgba(30, 24, 18, 0.55)';
      ctx.lineWidth = p.placed ? 1.6 : 1;
      ctx.stroke();
      // 高光边
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.poly[1][0] * 0.8, p.poly[1][1] * 0.8);
      ctx.lineTo(p.poly[2][0] * 0.8, p.poly[2][1] * 0.8);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderTrace(ctx) {
    const samples = this.samples;
    if (!samples.length) return;
    // 已描的金线
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < samples.length - 1; i += 1) {
      if (!samples[i].covered || !samples[i + 1].covered) continue;
      ctx.strokeStyle = 'rgba(226, 179, 106, 0.95)';
      ctx.lineWidth = Math.max(3, this.traceWidth * 0.5);
      ctx.beginPath();
      ctx.moveTo(samples[i].x, samples[i].y);
      ctx.lineTo(samples[i + 1].x, samples[i + 1].y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 236, 190, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // 未描的裂纹
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(40, 34, 26, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < samples.length - 1; i += 1) {
      if (samples[i].covered && samples[i + 1].covered) continue;
      ctx.moveTo(samples[i].x, samples[i].y);
      ctx.lineTo(samples[i + 1].x, samples[i + 1].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 起点与终点
    const start = samples[0];
    const end = samples[samples.length - 1];
    const pulse = 0.5 + Math.sin(this.time * 3) * 0.35;
    ctx.fillStyle = `rgba(226, 179, 106, ${0.5 + pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6 + pulse * 2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(226, 179, 106, ${0.35 + pulse * 0.3})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(end.x, end.y, 7, 0, TAU);
    ctx.stroke();

    // 指尖轨迹
    if (this.trail.length > 1) {
      ctx.strokeStyle = 'rgba(255, 240, 205, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < this.trail.length; i += 1) {
        if (i === 0) ctx.moveTo(this.trail[i].x, this.trail[i].y);
        else ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.stroke();
    }

    // 提示：沿路径跑的光点
    if (this.hintT > 0) {
      const t = (this.time * 0.6) % 1;
      const idx = Math.floor(t * (samples.length - 1));
      const s = samples[idx];
      ctx.fillStyle = 'rgba(255, 236, 190, 0.9)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderRotate(ctx) {
    const r = this.dialR;
    ctx.save();
    // 轨道
    ctx.strokeStyle = 'rgba(243, 231, 211, 0.16)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, r, 0, TAU);
    ctx.stroke();
    // 进度弧
    ctx.strokeStyle = 'rgba(226, 179, 106, 0.9)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * this.progress);
    ctx.stroke();

    // 齿轮
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.rotate(this.gearAngle);
    const teeth = 10;
    ctx.strokeStyle = 'rgba(230, 196, 130, 0.85)';
    ctx.lineWidth = 3;
    for (let i = 0; i < teeth; i += 1) {
      const a = (i / teeth) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r * 0.72), Math.sin(a) * (r * 0.72));
      ctx.lineTo(Math.cos(a) * (r * 0.86), Math.sin(a) * (r * 0.86));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, TAU);
    ctx.strokeStyle = 'rgba(243, 231, 211, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, TAU);
    ctx.fillStyle = 'rgba(226, 179, 106, 0.85)';
    ctx.fill();
    ctx.restore();

    // 旋转箭头提示
    if (this.hintT > 0) {
      const a0 = this.time * 1.4;
      ctx.strokeStyle = 'rgba(255, 236, 190, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, r * 1.16, a0, a0 + Math.PI * 0.7);
      ctx.stroke();
      const ax = this.cx + Math.cos(a0 + Math.PI * 0.7) * r * 1.16;
      const ay = this.cy + Math.sin(a0 + Math.PI * 0.7) * r * 1.16;
      ctx.beginPath();
      ctx.moveTo(ax - 4, ay - 4);
      ctx.lineTo(ax + 4, ay + 1);
      ctx.lineTo(ax - 2, ay + 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderGrid(ctx) {
    const isRub = this.def.type === 'rub';
    if (this.hintT > 0) {
      // 打磨 / 拂尘的提示
      const cx2 = this.cx;
      const cy2 = this.cy - this.R * 0.1;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 236, 190, 0.55)';
      ctx.lineWidth = 2;
      if (isRub) {
        const a = this.time * 2.2;
        ctx.beginPath();
        ctx.arc(cx2, cy2, this.R * 0.22, a, a + Math.PI * 1.3);
        ctx.stroke();
      } else if (this.dirY < 0) {
        const off = (this.time * 46) % 34;
        for (let i = 0; i < 3; i += 1) {
          const y = this.cy + 34 - i * 26 - off;
          ctx.beginPath();
          ctx.moveTo(this.cx - 7, y + 8);
          ctx.lineTo(this.cx, y);
          ctx.lineTo(this.cx + 7, y + 8);
          ctx.stroke();
        }
      } else {
        const dir = this.dirX < 0 ? -1 : 1;
        const off = (this.time * 46) % 34;
        for (let i = 0; i < 3; i += 1) {
          const x = this.cx + dir * (off - 34 + i * 26);
          ctx.beginPath();
          ctx.moveTo(x - dir * 8, this.cy - 7);
          ctx.lineTo(x, this.cy);
          ctx.lineTo(x - dir * 8, this.cy + 7);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 覆盖层
    ctx.save();
    for (let i = 0; i < this.grid.length; i += 1) {
      const g = this.grid[i];
      const remain = 1 - g.clean;
      if (remain <= 0.02) continue;
      const size = g.size;
      ctx.globalAlpha = remain * (isRub ? 0.6 : 0.42);
      ctx.fillStyle = isRub ? '#6E4228' : '#8F887B';
      ctx.fillRect(g.x - size / 2, g.y - size / 2, size, size);
      ctx.globalAlpha = remain * 0.25;
      ctx.fillStyle = isRub ? '#C07A4C' : '#D8D2C4';
      ctx.fillRect(g.x - size / 2, g.y - size / 2, size, size * 0.4);
    }
    ctx.restore();
  }
}
