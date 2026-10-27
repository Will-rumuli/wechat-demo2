// 记忆册：已修复物件与两种选择的记忆
import { W, H, SAFE_TOP, SAFE_BOTTOM, FS } from '../core/screen.js';
import {
  COLORS, drawWorkbench, panel, text, wrapText, fillRound,
  drawStar, divider
} from '../ui/theme.js';
import { IconButton, ScrollView, Button } from '../ui/widgets.js';
import { drawThumb } from '../ui/art.js';
import { LEVELS } from '../data/levels.js';
import { getSave } from '../core/storage.js';
import { playTap } from '../core/audio.js';

const PAD = 20;
const GAP = 10;

export default class Album {
  constructor(app, params) {
    this.app = app;
    this.time = 0;
    this.compact = H < 640;
    this.save = getSave();
    this.detail = null;
    this.focusId = params.focus || '';

    this.back = new IconButton({
      x: PAD + 14, y: SAFE_TOP + 14, r: 15, icon: 'back',
      onTap: () => this.app.go('shop')
    });
    this.listY = SAFE_TOP + 46;
    this.cardH = this.compact ? 96 : 108;
    this.scroll = new ScrollView({
      x: PAD, y: this.listY, w: W - PAD * 2, h: H - SAFE_BOTTOM - this.listY - 8
    });
    this.scroll.setContent(LEVELS.length * (this.cardH + GAP));

    if (this.focusId) {
      const idx = LEVELS.findIndex((item) => item.id === this.focusId);
      if (idx > 0) this.scroll.offset = Math.min(this.scroll.max, idx * (this.cardH + GAP));
    }

    this.replayBtn = new Button({
      x: PAD + 20, y: 0, w: W - PAD * 2 - 40, h: 44,
      label: '再修一次', kind: 'primary', size: FS(14),
      onTap: () => this.replay()
    });
    this.closeBtn = new Button({
      x: PAD + 20, y: 0, w: W - PAD * 2 - 40, h: 40,
      label: '合上记忆册', kind: 'ghost', size: FS(13),
      onTap: () => { this.detail = null; }
    });
  }

  update(dt) {
    this.time += dt;
    this.back.update(dt);
    this.scroll.update(dt);
    this.replayBtn.update(dt);
    this.closeBtn.update(dt);
  }

  start(x, y) {
    if (this.detail) {
      if (this.replayBtn.tap(x, y) || this.closeBtn.tap(x, y)) {
        playTap();
        return;
      }
      // 点空白处关闭
      if (y < this.detailY || y > this.detailY + this.detailH) {
        this.detail = null;
      }
      return;
    }
    if (this.back.tap(x, y)) {
      playTap();
      return;
    }
    this.scroll.start(x, y);
  }

  move(x, y) {
    if (!this.detail) this.scroll.move(y);
  }

  end() {
    if (this.detail) return;
    if (!this.scroll.end()) return;
    // 触摸结束时无法拿到坐标，用最后拖动位置近似
    const y = this.scroll.lastY;
    if (y < this.listY || y > this.listY + this.scroll.h) return;
    const row = Math.floor((y - this.listY + this.scroll.offset) / (this.cardH + GAP));
    if (row < 0 || row >= LEVELS.length) return;
    const level = LEVELS[row];
    const record = this.save.completed[level.id];
    if (!record) {
      this.app.toast('这件还没修好，先去铺子接单');
      return;
    }
    this.openDetail(level, record);
  }

  openDetail(level, record) {
    playTap();
    this.detail = { level, record };
    this.detailH = Math.min(400, H - SAFE_TOP - SAFE_BOTTOM - 30);
    this.detailY = (H - this.detailH) / 2;
    this.closeBtn.y = this.detailY + this.detailH - 54;
    this.replayBtn.y = this.closeBtn.y - 52;
  }

  replay() {
    if (!this.detail) return;
    const id = this.detail.level.id;
    this.detail = null;
    this.app.go('order', { id });
  }

  render(ctx) {
    drawWorkbench(ctx, this.time, 0.2);

    this.back.draw(ctx);
    text(ctx, '记 忆 册', W / 2, SAFE_TOP + 14, {
      size: FS(14), color: COLORS.paper, align: 'center', baseline: 'middle', weight: 500
    });
    const count = Object.keys(this.save.completed).length;
    text(ctx, `${count}/${LEVELS.length} 段`, W - PAD, SAFE_TOP + 14, {
      size: FS(11), color: COLORS.amber, align: 'right', baseline: 'middle'
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD, this.listY, W - PAD * 2, this.scroll.h);
    ctx.clip();
    ctx.translate(0, -this.scroll.offset);

    for (let i = 0; i < LEVELS.length; i += 1) {
      const level = LEVELS[i];
      const y = this.listY + i * (this.cardH + GAP);
      if (y + this.cardH < this.listY + this.scroll.offset - 20) continue;
      if (y > this.listY + this.scroll.h + this.scroll.offset + 20) break;
      const record = this.save.completed[level.id];
      panel(ctx, PAD, y, W - PAD * 2, this.cardH, 12, record ? 0.74 : 0.5);

      const thumb = this.cardH - 16;
      drawThumb(ctx, level.art, level.material, PAD + 8, y + 8, thumb, thumb, this.time);
      if (!record) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        fillRound(ctx, PAD + 8, y + 8, thumb, thumb, 10, 'rgba(10, 8, 6, 0.7)');
        text(ctx, '未修', PAD + 8 + thumb / 2, y + 8 + thumb / 2, {
          size: FS(11), color: COLORS.gray, align: 'center', baseline: 'middle'
        });
        ctx.restore();
      }

      const tx = PAD + thumb + 22;
      const tw = W - PAD - 14 - tx;
      text(ctx, `第 ${i + 1} 单`, tx, y + 24, {
        size: FS(9), color: record ? COLORS.amber : COLORS.gray, maxWidth: tw
      });
      text(ctx, level.name, tx, y + 44, {
        size: FS(15), color: record ? COLORS.paper : 'rgba(243, 231, 211, 0.45)',
        weight: 600, maxWidth: tw
      });

      if (record) {
        const quote = record.quote || level.quoteObject;
        wrapText(ctx, `“${quote}”`, tx, y + 62, tw, FS(16), 2, {
          size: FS(10.5), color: record.choice === 'object' ? COLORS.paperDim : COLORS.blue
        });
        for (let s = 0; s < 3; s += 1) {
          drawStar(ctx, W - PAD - 48 + s * 14, y + this.cardH - 14, 5, s < record.stars, COLORS.amber);
        }
      } else {
        text(ctx, '尚未修复 · 记忆未显', tx, y + 66, {
          size: FS(10), color: COLORS.gray, maxWidth: tw
        });
      }
    }
    ctx.restore();
    this.scroll.drawBar(ctx);

    if (this.scroll.max <= 0.5) {
      text(ctx, '轻触卡片，重读一段记忆', W / 2, H - SAFE_BOTTOM - 4, {
        size: FS(10), color: 'rgba(243, 231, 211, 0.3)', align: 'center'
      });
    }

    if (this.detail) this.renderDetail(ctx);
  }

  renderDetail(ctx) {
    const { level, record } = this.detail;
    ctx.save();
    ctx.fillStyle = 'rgba(6, 5, 4, 0.72)';
    ctx.fillRect(0, 0, W, H);
    panel(ctx, PAD, this.detailY, W - PAD * 2, this.detailH, 16, 0.96);

    text(ctx, level.name, PAD + 20, this.detailY + 30, {
      size: FS(18), color: COLORS.paper, weight: 600, maxWidth: W - PAD * 2 - 100
    });
    for (let s = 0; s < 3; s += 1) {
      drawStar(ctx, W - PAD - 58 + s * 16, this.detailY + 24, 5.5, s < record.stars, COLORS.amber);
    }
    divider(ctx, PAD + 20, this.detailY + 44, W - PAD - 20);

    const tx = PAD + 20;
    const tw = W - PAD * 2 - 40;

    text(ctx, '物件说', tx, this.detailY + 64, {
      size: FS(10), color: COLORS.gray
    });
    wrapText(ctx, level.memory.text, tx, this.detailY + 86, tw, FS(19), 2, {
      size: FS(13), color: COLORS.paper, weight: 500
    });

    text(ctx, '你留下的那句话', tx, this.detailY + 140, {
      size: FS(10), color: COLORS.gray
    });
    wrapText(ctx, record.quote || level.quoteObject, tx, this.detailY + 162, tw, FS(19), 2, {
      size: FS(13), color: record.choice === 'object' ? COLORS.amber : COLORS.blue
    });

    const reply = record.choice === 'object' ? level.choice.objectReply : level.choice.clientReply;
    wrapText(ctx, reply, tx, this.detailY + 214, tw, FS(17), 2, {
      size: FS(11), color: COLORS.gray
    });

    text(ctx, record.choice === 'object' ? '当时相信：物件' : '当时相信：客户', tx, this.detailY + 266, {
      size: FS(10), color: record.choice === 'object' ? COLORS.amber : COLORS.blue
    });

    this.replayBtn.draw(ctx, this.time);
    this.closeBtn.draw(ctx, this.time);
    ctx.restore();
  }
}
