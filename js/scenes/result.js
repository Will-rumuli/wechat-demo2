// 结算：星级、铜板、客户回音，可看广告翻倍
import { W, H, SAFE_TOP, SAFE_BOTTOM, FS } from '../core/screen.js';
import {
  COLORS, drawWorkbench, panel, text, wrapText,
  drawStar, drawCoin
} from '../ui/theme.js';
import { Button } from '../ui/widgets.js';
import { drawArtifact } from '../ui/art.js';
import { levelById, LEVELS, CHAPTER } from '../data/levels.js';
import { addCoins, completeLevel, getSave, completedCount } from '../core/storage.js';
import { showRewarded, adsReady } from '../core/ads.js';
import { playTap, play } from '../core/audio.js';

const PAD = 24;

export default class Result {
  constructor(app, params) {
    this.app = app;
    this.level = levelById(params.id) || LEVELS[0];
    this.stars = params.stars || 1;
    this.seconds = params.seconds || 0;
    this.choice = params.choice === 'client' ? 'client' : 'object';
    this.time = 0;
    this.adsPending = false;
    this.doubled = false;
    this.entered = false;
    this.compact = H < 640;
    this.earned = 10 + this.stars * 6 + this.level.difficulty * 2;
    this.chapterDone = false;
    this.quote = this.choice === 'object' ? this.level.quoteObject : this.level.quoteClient;
    this.reply = this.choice === 'object' ? this.level.choice.objectReply : this.level.choice.clientReply;

    this.backY = H - SAFE_BOTTOM - 56;
    this.doubleY = this.backY - (this.compact ? 48 : 54);
    this.backBtn = new Button({
      x: PAD, y: this.backY, w: W - PAD * 2, h: 48,
      label: '回到铺子', kind: 'primary', size: FS(16),
      onTap: () => this.app.go('shop')
    });
    this.doubleBtn = new Button({
      x: PAD, y: this.doubleY, w: W - PAD * 2, h: 42,
      label: '看广告 · 铜板 ×2', kind: 'ghost', size: FS(13),
      onTap: () => this.doubleReward()
    });
  }

  enter() {
    if (this.entered) return;
    this.entered = true;
    addCoins(this.earned);
    completeLevel(this.level.id, this.stars, this.choice, this.quote);
    this.chapterDone = completedCount() >= CHAPTER.total;
    this.save = getSave();
    play('chime');
  }

  update(dt) {
    this.time += dt;
    this.backBtn.update(dt);
    this.doubleBtn.update(dt);
  }

  start(x, y) {
    if (y < SAFE_TOP + 30 && x > W - 76) {
      this.share();
      return;
    }
    if (this.backBtn.tap(x, y)) {
      playTap();
      return;
    }
    if (!this.doubled && this.doubleBtn.tap(x, y)) playTap();
  }

  doubleReward() {
    if (this.doubled || this.adsPending) return;
    this.adsPending = true;
    this.app.toast(adsReady() ? '广告加载中…' : '开发模式：直接翻倍');
    showRewarded().then((ok) => {
      this.adsPending = false;
      if (!ok) {
        this.app.toast('广告没有看完，没有翻倍');
        return;
      }
      this.doubled = true;
      addCoins(this.earned);
      this.save = getSave();
      this.app.toast(`铜板 +${this.earned}`);
    });
  }

  share() {
    try {
      wx.shareAppMessage({
        title: `修好${this.level.name}后，它说：${this.level.memory.text}`
      });
    } catch (e) {
      this.app.toast('请点右上角「···」分享');
    }
  }

  shareInfo() {
    return {
      title: `修好${this.level.name}后，它说：${this.level.memory.text}`
    };
  }

  render(ctx) {
    drawWorkbench(ctx, this.time, 0.12);
    const save = this.save || getSave();

    text(ctx, this.chapterDone ? '第一章 · 完成' : '修 好 了', W / 2, SAFE_TOP + 16, {
      size: FS(14), color: this.chapterDone ? COLORS.amber : COLORS.paperDim,
      align: 'center', weight: 500
    });
    text(ctx, '分享', W - PAD, SAFE_TOP + 16, {
      size: FS(12), color: COLORS.gray, align: 'right'
    });

    // 物件与光晕
    const cy = SAFE_TOP + (this.compact ? 92 : 110);
    const r = Math.min(W * 0.17, this.compact ? 52 : 64);
    ctx.save();
    const glow = ctx.createRadialGradient(W / 2, cy, 4, W / 2, cy, r * 2.2);
    glow.addColorStop(0, 'rgba(226, 179, 106, 0.2)');
    glow.addColorStop(1, 'rgba(226, 179, 106, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    drawArtifact(ctx, this.level.art, W / 2, cy, r, this.time, { material: this.level.material });
    text(ctx, this.level.name, W / 2, cy + r + 24, {
      size: FS(16), color: COLORS.paper, align: 'center', weight: 600
    });

    // 星级
    const starY = cy + r + 46;
    const starR = this.compact ? 8 : 9.5;
    for (let i = 0; i < 3; i += 1) {
      const filled = i < this.stars;
      drawStar(ctx, W / 2 + (i - 1) * (this.compact ? 26 : 30), starY, starR, filled, COLORS.amber);
    }

    // 记忆残句
    const quoteY = starY + (this.compact ? 26 : 32);
    panel(ctx, PAD, quoteY, W - PAD * 2, 60, 12, 0.66);
    wrapText(ctx, `“${this.quote}”`, PAD + 14, quoteY + 23, W - PAD * 2 - 28, FS(18), 2, {
      size: FS(13), color: this.choice === 'object' ? COLORS.amber : COLORS.blue
    });

    // 客户回音
    const replyY = quoteY + 78;
    wrapText(ctx, this.reply, PAD, replyY, W - PAD * 2, FS(18), 2, {
      size: FS(12), color: COLORS.gray
    });

    // 铜板
    const coinY = this.doubleY - 26;
    drawCoin(ctx, W / 2 - 18, coinY, 9);
    text(ctx, `+${this.doubled ? this.earned * 2 : this.earned}`, W / 2 - 4, coinY, {
      size: FS(17), color: COLORS.amber, baseline: 'middle', weight: 600
    });
    text(ctx, `铜板 · 共 ${save.coins}`, W / 2, coinY + 20, {
      size: FS(10), color: COLORS.gray, align: 'center', baseline: 'middle'
    });

    if (this.chapterDone) {
      text(ctx, '怀表零件已经集齐，第一章到此结束。', W / 2, coinY - 20, {
        size: FS(11), color: COLORS.paperDim, align: 'center', maxWidth: W - 48
      });
    }

    this.doubleBtn.disabled = this.doubled;
    this.doubleBtn.label = this.doubled ? '铜板已翻倍' : '看广告 · 铜板 ×2';
    this.doubleBtn.draw(ctx, this.time);
    this.backBtn.draw(ctx, this.time);
  }
}
