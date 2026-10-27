// 开场：凌晨的门铃、地上的旧物与一张纸条
import { W, H, SAFE_TOP, FS } from '../core/screen.js';
import { COLORS, drawWorkbench, text, wrapText, fillRound, strokeRound, seeded } from '../ui/theme.js';
import { drawArtifact } from '../ui/art.js';
import { markIntroSeen } from '../core/storage.js';
import { isMuted } from '../core/audio.js';

const LINES = [
  '凌晨一点，补物斋的门铃响了一声。',
  '门外没有人。台阶上放着一只搪瓷缸，压着一张纸条。',
  '缸底刻着师父的名字。三年前他不见的那晚，也是这个时辰。',
  '纸条上只有一句：修好它，它会告诉你。'
];

export default class Intro {
  constructor(app) {
    this.app = app;
    this.time = 0;
    this.index = 0;
    this.lineT = 0;
    this.done = false;
    this.tapLock = 0;
  }

  update(dt) {
    this.time += dt;
    this.lineT += dt;
    if (this.tapLock > 0) this.tapLock = Math.max(0, this.tapLock - dt);
  }

  start(x, y) {
    if (this.tapLock > 0) return;
    // 右上角跳过
    if (y < SAFE_TOP + 24 && x > W - 84) {
      this.finish();
      return;
    }
    if (this.index < LINES.length - 1 && this.lineT > 0.7) {
      this.index += 1;
      this.lineT = 0;
      this.app.tapSound();
      return;
    }
    if (this.index >= LINES.length - 1 && this.lineT > 1.2) {
      this.finish();
    }
  }

  finish() {
    if (this.done) return;
    this.done = true;
    markIntroSeen();
    this.app.go('shop');
  }

  render(ctx) {
    drawWorkbench(ctx, this.time, 0.18);

    // 门与门牌
    const cx = W / 2;
    const doorW = Math.min(W * 0.5, 220);
    const doorH = H * 0.34;
    const doorY = H * 0.24;
    ctx.save();
    ctx.fillStyle = 'rgba(12, 9, 7, 0.9)';
    fillRound(ctx, cx - doorW / 2, doorY, doorW, doorH, 6, 'rgba(12, 9, 7, 0.92)');
    strokeRound(ctx, cx - doorW / 2, doorY, doorW, doorH, 6, 'rgba(226, 179, 106, 0.25)', 1);
    // 门缝透出的光
    const glow = ctx.createLinearGradient(cx, doorY, cx, doorY + doorH);
    glow.addColorStop(0, 'rgba(226, 179, 106, 0.32)');
    glow.addColorStop(1, 'rgba(226, 179, 106, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 1.5, doorY + 4, 3, doorH - 8);
    ctx.restore();

    // 门牌
    const plateW = Math.min(W * 0.32, 132);
    const plateH = 44;
    const px = cx - plateW / 2;
    const py = doorY + 18;
    fillRound(ctx, px, py, plateW, plateH, 4, 'rgba(38, 28, 20, 0.95)');
    strokeRound(ctx, px, py, plateW, plateH, 4, 'rgba(226, 179, 106, 0.5)', 1);
    text(ctx, '补 物 斋', cx, py + plateH / 2, {
      size: FS(17), color: COLORS.amber, align: 'center', baseline: 'middle', weight: 600
    });

    // 雨
    const rnd = seeded(188);
    ctx.strokeStyle = 'rgba(180, 205, 230, 0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i += 1) {
      const rx = (rnd() * W + this.time * 30) % W;
      const ry = (rnd() * H + this.time * 360) % H;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 10);
      ctx.stroke();
    }

    // 台阶上的搪瓷缸与纸条：开场就要给玩家一个具体的怪事
    const objY = H * 0.8;
    const objR = Math.min(W * 0.1, 34);
    ctx.save();
    const halo = ctx.createRadialGradient(cx, objY, 2, cx, objY, objR * 2.6);
    halo.addColorStop(0, 'rgba(226, 179, 106, 0.16)');
    halo.addColorStop(1, 'rgba(226, 179, 106, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, objY - objR * 2.6, W, objR * 5.2);
    ctx.restore();
    drawArtifact(ctx, 'cup', cx, objY, objR, this.time, { material: 'enamel' });

    // 压在缸边的纸条
    ctx.save();
    ctx.translate(cx + objR * 1.2, objY + objR * 0.55);
    ctx.rotate(-0.09);
    fillRound(ctx, -20, -13, 40, 26, 2, 'rgba(240, 228, 206, 0.86)');
    ctx.strokeStyle = 'rgba(96, 70, 46, 0.45)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-13, -5 + i * 7);
      ctx.lineTo(12 - i * 4, -5 + i * 7);
      ctx.stroke();
    }
    ctx.restore();

    // 旁白
    const textY = H * 0.62;
    const maxW = W - 64;
    const line = LINES[this.index];
    const chars = Math.floor(this.lineT * 16);
    const shown = line.slice(0, Math.max(1, chars));
    wrapText(ctx, shown, 32, textY, maxW, FS(24), 3, {
      size: FS(16), color: COLORS.paper, weight: 400
    });

    // 提示
    if (this.index >= LINES.length - 1 && this.lineT > 1.2) {
      const alpha = 0.55 + Math.sin(this.time * 2.4) * 0.2;
      text(ctx, '轻触推门', W / 2, H - 56, {
        size: FS(13), color: COLORS.amber, align: 'center', alpha
      });
    } else {
      const alpha = 0.35 + Math.sin(this.time * 2) * 0.1;
      text(ctx, '轻触继续', W / 2, H - 56, {
        size: FS(12), color: COLORS.paperDim, align: 'center', alpha
      });
    }

    // 跳过
    text(ctx, '跳过', W - 24, SAFE_TOP + 10, {
      size: FS(12), color: 'rgba(243, 231, 211, 0.55)', align: 'right'
    });

    // 当前音频状态角标
    text(ctx, isMuted() ? '静音' : '雨声', 24, SAFE_TOP + 10, {
      size: FS(11), color: 'rgba(243, 231, 211, 0.35)'
    });
  }
}
