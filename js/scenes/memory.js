// 记忆回放：物件开口说一句话，客户当场否认，玩家只能信一边
import { W, H, SAFE_TOP, SAFE_BOTTOM, FS } from '../core/screen.js';
import {
  COLORS, text, wrapText, panel, fillRound
} from '../ui/theme.js';
import { Button } from '../ui/widgets.js';
import { drawMemoryScene } from '../ui/art.js';
import { levelById, LEVELS } from '../data/levels.js';
import { playTap } from '../core/audio.js';

const PAD = 24;
const READ_DELAY = 1.2;

export default class Memory {
  constructor(app, params) {
    this.app = app;
    this.level = levelById(params.id) || LEVELS[0];
    this.stars = params.stars || 1;
    this.seconds = params.seconds || 0;
    this.time = 0;
    this.charT = 0;
    this.reveal = false;
    this.choice = null;
    this.choiceT = 0;
    this.compact = H < 700;

    const btnW = W - PAD * 2;
    this.btnH = this.compact ? 44 : 48;
    this.clientY = H - SAFE_BOTTOM - this.btnH - 14;
    this.objectY = this.clientY - this.btnH - 10;
    this.questionY = this.objectY - (this.compact ? 44 : 50);
    this.quoteY = H * (this.compact ? 0.5 : 0.56);
    this.denialY = this.quoteY + FS(28) * 1.75 + (this.compact ? 2 : 6);

    this.objectBtn = new Button({
      x: PAD, y: this.objectY, w: btnW, h: this.btnH,
      label: this.level.choice.object, kind: 'primary', size: FS(15),
      onTap: () => this.choose('object')
    });
    this.clientBtn = new Button({
      x: PAD, y: this.clientY, w: btnW, h: this.btnH,
      label: this.level.choice.client, kind: 'ghost', size: FS(15),
      onTap: () => this.choose('client')
    });
    this.doneBtn = new Button({
      x: PAD, y: H - SAFE_BOTTOM - 60, w: btnW, h: 48,
      label: '收好物件', kind: 'primary', size: FS(16),
      onTap: () => this.app.go('result', {
        id: this.level.id, stars: this.stars, seconds: this.seconds, choice: this.choice
      })
    });

    this.totalChars = this.level.memory.text.length;
  }

  update(dt) {
    this.time += dt;
    if (!this.reveal) {
      this.charT += dt;
      if (this.charT * 13 >= this.totalChars) {
        this.charT = this.totalChars / 13;
        this.reveal = true;
      }
    }
    if (this.reveal) this.choiceT += dt;
    this.objectBtn.update(dt);
    this.clientBtn.update(dt);
    this.doneBtn.update(dt);
  }

  start(x, y) {
    if (!this.reveal) {
      this.reveal = true;
      this.charT = this.totalChars / 13;
      this.choiceT = 0;
      return;
    }
    if (!this.choice) {
      if (this.choiceT < READ_DELAY) return;
      if (this.objectBtn.tap(x, y)) {
        playTap();
        return;
      }
      if (this.clientBtn.tap(x, y)) {
        playTap();
        return;
      }
      return;
    }
    if (this.choiceT > 0.4) this.doneBtn.tap(x, y);
  }

  choose(value) {
    if (this.choice) return;
    this.choice = value;
    this.choiceT = 0;
    this.app.toast(value === 'object' ? '你信了物件' : '你信了客户');
  }

  replyOf(value) {
    return value === 'object' ? this.level.choice.objectReply : this.level.choice.clientReply;
  }

  shareInfo() {
    return {
      title: `我修好了${this.level.name}，它说：${this.level.memory.text}`
    };
  }

  render(ctx) {
    drawMemoryScene(ctx, this.level.memory.scene, this.time);

    // 选择后的冷暖色调：信物件偏金，信客户偏蓝
    if (this.choice) {
      ctx.fillStyle = this.choice === 'object'
        ? 'rgba(226, 179, 106, 0.08)'
        : 'rgba(127, 163, 184, 0.10)';
      ctx.fillRect(0, 0, W, H);
    }

    // 顶部
    text(ctx, `物件开口 · ${this.level.name}`, PAD, SAFE_TOP + 10, {
      size: FS(12), color: COLORS.paperDim, maxWidth: W - 140
    });
    text(ctx, '跳过', W - PAD, SAFE_TOP + 10, {
      size: FS(12), color: COLORS.gray, align: 'right'
    });

    // 物件名与横线
    text(ctx, this.level.name, W / 2, H * 0.17, {
      size: FS(13), color: COLORS.amber, align: 'center'
    });
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 179, 106, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 24, H * 0.17 + 10);
    ctx.lineTo(W / 2 + 24, H * 0.17 + 10);
    ctx.stroke();
    ctx.restore();

    // 物件的话，打字机逐字出现
    const shownLen = this.reveal ? this.totalChars : Math.floor(this.charT * 13);
    const shown = this.level.memory.text.slice(0, shownLen);
    wrapText(ctx, shown, PAD, this.quoteY, W - PAD * 2, FS(28), 2, {
      size: FS(19), color: COLORS.paper, weight: 500
    });
    if (!this.reveal) {
      const cursorAlpha = 0.4 + Math.sin(this.time * 6) * 0.35;
      text(ctx, '▍', PAD, this.quoteY + FS(28) * 1.6, {
        size: FS(13), color: COLORS.amber, alpha: cursorAlpha
      });
    }

    // 客户的否认
    if (this.reveal) {
      const denialAlpha = this.choice ? 1 : Math.min(1, this.choiceT * 1.6);
      ctx.save();
      ctx.globalAlpha = denialAlpha;
      fillRound(ctx, PAD, this.denialY - FS(13), 2, FS(13) * 2 + 6, 1, COLORS.blue);
      wrapText(ctx, this.level.denial, PAD + 10, this.denialY, W - PAD * 2 - 10, FS(20), 2, {
        size: FS(13), color: COLORS.blue
      });
      ctx.restore();
    }

    // 选择区
    if (this.reveal && !this.choice) {
      if (this.choiceT > READ_DELAY) {
        const alpha = Math.min(1, (this.choiceT - READ_DELAY) * 2);
        ctx.save();
        ctx.globalAlpha = alpha;
        text(ctx, this.level.choice.ask, PAD, this.questionY, {
          size: FS(13), color: COLORS.paperDim
        });
        this.objectBtn.draw(ctx, this.time);
        this.clientBtn.draw(ctx, this.time);
        ctx.restore();
      }
    } else if (this.choice) {
      const boxY = H - SAFE_BOTTOM - 48 - 90;
      panel(ctx, PAD, boxY, W - PAD * 2, 76, 12, 0.62);
      wrapText(ctx, this.replyOf(this.choice), PAD + 14, boxY + 26, W - PAD * 2 - 28, FS(19), 2, {
        size: FS(13), color: this.choice === 'object' ? COLORS.amber : COLORS.blue
      });
      this.doneBtn.draw(ctx, this.time);
    }
  }
}
