// 铺子主界面：待修物件、体力、记忆册与工具入口
import { W, H, SAFE_TOP, SAFE_BOTTOM, FS } from '../core/screen.js';
import {
  COLORS, drawWorkbench, panel, text, wrapText, fillRound, strokeRound,
  drawStar, divider
} from '../ui/theme.js';
import { Button, IconButton, progressBar, coinText } from '../ui/widgets.js';
import { drawThumb } from '../ui/art.js';
import { CHAPTER, LEVELS } from '../data/levels.js';
import {
  getSave, staminaLeft, grantAdStamina, completedCount, nextLevel, MAX_STAMINA
} from '../core/storage.js';
import { currentUser } from '../core/user.js';
import { showRewarded, adsReady } from '../core/ads.js';
import { toggleMute, isMuted, playTap } from '../core/audio.js';

const PAD = 20;

function avatar(ctx, x, y, r, time) {
  const grad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  grad.addColorStop(0, '#4A3524');
  grad.addColorStop(1, '#2A1E14');
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(226, 179, 106, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, '修', x, y + 0.5, {
    size: Math.round(r * 0.95), color: COLORS.amber, align: 'center', baseline: 'middle', weight: 600
  });
  // 呼吸光
  ctx.globalAlpha = 0.1 + Math.sin(time * 1.6) * 0.04;
  ctx.beginPath();
  ctx.arc(x, y, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.amber;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawNavIcon(ctx, type, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = COLORS.amber;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (type === 'album') {
    ctx.strokeRect(-8, -9, 16, 18);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(0, 9);
    ctx.moveTo(-8, -3);
    ctx.lineTo(-3, -3);
    ctx.moveTo(3, -3);
    ctx.lineTo(8, -3);
    ctx.stroke();
  } else if (type === 'tools') {
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(2, -2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(4, -4, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, 9);
    ctx.lineTo(-6, 6);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-6, 2, 3, 0, Math.PI * 2);
    ctx.arc(6, -6, 3, 0, Math.PI * 2);
    ctx.arc(6, 8, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(3, -4);
    ctx.moveTo(-3, 4);
    ctx.lineTo(3, 7);
    ctx.stroke();
  }
  ctx.restore();
}

export default class Shop {
  constructor(app) {
    this.app = app;
    this.time = 0;
    this.compact = H < 640;
    this.save = getSave();
    this.user = currentUser();
    this.adsPending = false;
    this.layout();
  }

  refresh() {
    this.save = getSave();
    this.user = currentUser();
    this.mute.icon = isMuted() ? 'mute' : 'sound';
    this.layout();
  }

  layout() {
    this.navH = this.compact ? 58 : 66;
    this.navY = H - SAFE_BOTTOM - this.navH;
    this.staminaY = SAFE_TOP + (this.compact ? 64 : 72);
    this.cardY = this.staminaY + 28;
    this.actionH = 46;
    this.actionY = this.navY - this.actionH - 12;
    this.cardH = Math.max(150, this.actionY - this.cardY - 12);
    this.cardX = PAD;
    this.cardW = W - PAD * 2;

    this.mute = new IconButton({
      x: W - PAD - 13,
      y: SAFE_TOP + 12,
      r: 13,
      icon: isMuted() ? 'mute' : 'sound',
      onTap: () => {
        const muted = toggleMute();
        this.mute.icon = muted ? 'mute' : 'sound';
        this.app.toast(muted ? '已静音' : '雨声回来了');
      }
    });

    this.action = new Button({
      x: PAD, y: this.actionY, w: W - PAD * 2, h: this.actionH,
      label: '', kind: 'primary', size: FS(15),
      onTap: () => this.onAction()
    });

    this.nav = [
      { key: 'album', label: '记忆册', x: PAD, y: this.navY, w: (W - PAD * 2 - 16) / 3, h: this.navH },
      { key: 'tools', label: '工具架', x: PAD + (W - PAD * 2 - 16) / 3 + 8, y: this.navY, w: (W - PAD * 2 - 16) / 3, h: this.navH },
      { key: 'share', label: '分享', x: PAD + ((W - PAD * 2 - 16) / 3 + 8) * 2, y: this.navY, w: (W - PAD * 2 - 16) / 3, h: this.navH }
    ];
  }

  update(dt) {
    this.time += dt;
    this.action.update(dt);
    this.mute.update(dt);
  }

  start(x, y) {
    if (this.mute.tap(x, y)) {
      playTap();
      return;
    }
    if (this.action.tap(x, y)) {
      playTap();
      return;
    }
    // 体力条右侧的广告按钮
    if (this.save.staminaBonus < 3 && x >= W - PAD - 82 && x <= W - PAD && Math.abs(y - this.staminaY) <= 14) {
      playTap();
      this.promptAdStamina();
      return;
    }
    for (let i = 0; i < this.nav.length; i += 1) {
      const item = this.nav[i];
      if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
        playTap();
        if (item.key === 'album') this.app.go('album');
        else if (item.key === 'tools') this.app.go('tools');
        else this.share();
        return;
      }
    }
    if (x >= this.cardX && x <= this.cardX + this.cardW && y >= this.cardY && y <= this.cardY + this.cardH) {
      playTap();
      this.onAction();
    }
  }

  onAction() {
    const level = nextLevel();
    if (!level) {
      this.app.go('album', { focus: LEVELS[0].id });
      return;
    }
    if (staminaLeft() <= 0) {
      this.promptAdStamina();
      return;
    }
    this.app.go('order', { id: level.id });
  }

  promptAdStamina() {
    if (this.adsPending) return;
    if (this.save.staminaBonus >= 3) {
      this.app.toast('今天的广告体力已经领过了');
      return;
    }
    this.adsPending = true;
    this.app.toast(adsReady() ? '广告加载中…' : '开发模式：直接补 3 点体力');
    showRewarded().then((ok) => {
      this.adsPending = false;
      if (!ok) {
        this.app.toast('广告没有看完，体力没有恢复');
        return;
      }
      if (grantAdStamina()) {
        this.refresh();
        this.app.toast('体力 +3');
      } else {
        this.app.toast('今天的广告体力已经领过了');
      }
    });
  }

  share() {
    try {
      wx.shareAppMessage({
        title: '打铜巷 17 号，一间会记住旧物的修复铺'
      });
    } catch (e) {
      this.app.toast('请点右上角「···」分享');
    }
  }

  render(ctx) {
    drawWorkbench(ctx, this.time, 0.08);
    const save = this.save;
    const done = completedCount();
    const level = nextLevel();
    const index = level ? LEVELS.indexOf(level) + 1 : LEVELS.length;

    // 顶栏
    avatar(ctx, PAD + 14, SAFE_TOP + 13, 14, this.time);
    text(ctx, this.user.nickName, PAD + 36, SAFE_TOP + 13, {
      size: FS(12), color: COLORS.paperDim, baseline: 'middle', maxWidth: W - PAD - 150
    });
    coinText(ctx, save.coins, this.mute.x - 28, SAFE_TOP + 13, FS(13), 'right');
    this.mute.draw(ctx);

    // 标题
    text(ctx, '补物斋', PAD, SAFE_TOP + (this.compact ? 50 : 56), {
      size: FS(26), color: COLORS.paper, weight: 600
    });
    text(ctx, `${CHAPTER.name}`, W - PAD, SAFE_TOP + (this.compact ? 48 : 54), {
      size: FS(11), color: COLORS.gray, align: 'right', maxWidth: W * 0.5
    });

    // 体力
    const left = staminaLeft();
    const maxStamina = MAX_STAMINA + save.staminaBonus;
    text(ctx, '今日体力', PAD, this.staminaY, {
      size: FS(11), color: COLORS.gray, baseline: 'middle'
    });
    const barW = Math.min(110, W * 0.3);
    progressBar(ctx, PAD + 60, this.staminaY - 3, barW, 6, left / maxStamina, left > 0 ? COLORS.amber : COLORS.red);
    text(ctx, `${left}/${maxStamina}`, PAD + 60 + barW + 8, this.staminaY, {
      size: FS(11), color: left > 0 ? COLORS.paperDim : COLORS.red, baseline: 'middle'
    });
    if (save.staminaBonus >= 3) {
      text(ctx, '广告体力已领', W - PAD, this.staminaY, {
        size: FS(10), color: COLORS.gray, align: 'right', baseline: 'middle'
      });
    } else {
      fillRound(ctx, W - PAD - 82, this.staminaY - 11, 82, 22, 11, 'rgba(226, 179, 106, 0.12)');
      strokeRound(ctx, W - PAD - 82, this.staminaY - 11, 82, 22, 11, 'rgba(226, 179, 106, 0.35)', 1);
      text(ctx, '看广告 +3', W - PAD - 41, this.staminaY, {
        size: FS(10), color: COLORS.amber, align: 'center', baseline: 'middle'
      });
    }

    // 委托卡
    panel(ctx, this.cardX, this.cardY, this.cardW, this.cardH, 16, 0.7);
    const thumbSize = Math.min(this.cardH - 30, this.cardW * 0.42);
    const thumbX = this.cardX + 14;
    const thumbY = this.cardY + (this.cardH - thumbSize) / 2 - 4;
    const art = level ? level.art : 'watch';
    const material = level ? level.material : 'brass';
    drawThumb(ctx, art, material, thumbX, thumbY, thumbSize, thumbSize, this.time);

    const tx = thumbX + thumbSize + 14;
    const tw = this.cardX + this.cardW - tx - 14;
    text(ctx, level ? `第 ${index} 单 / 共 ${CHAPTER.total} 单` : '第一章 · 已完成', tx, this.cardY + 28, {
      size: FS(10), color: COLORS.amber, maxWidth: tw
    });
    text(ctx, level ? level.name : '黄铜怀表', tx, this.cardY + 52, {
      size: FS(20), color: COLORS.paper, weight: 600, maxWidth: tw
    });
    const quote = level
      ? `客户：${level.intro}`
      : '怀表的零件已经集齐。指针重新走动时，你听见了师父的声音。';
    const lines = wrapText(ctx, quote, tx, this.cardY + 76, tw, FS(18), this.compact ? 2 : 3, {
      size: FS(11), color: COLORS.gray
    });

    if (level) {
      // 难度与步数
      const starY = this.cardY + 76 + lines * FS(18) + 10;
      for (let i = 0; i < 3; i += 1) {
        drawStar(ctx, tx + 6 + i * 15, starY, 5.5, i < level.difficulty, COLORS.amber);
      }
      text(ctx, `${level.steps.length} 个动作`, tx + 56, starY, {
        size: FS(10), color: COLORS.gray, baseline: 'middle', maxWidth: tw - 56
      });
    } else {
      text(ctx, `已收集 ${done} / ${CHAPTER.total} 段记忆`, tx, this.cardY + this.cardH - 30, {
        size: FS(11), color: COLORS.gray, maxWidth: tw
      });
    }

    // 卡片底部装饰线
    divider(ctx, this.cardX + 14, this.cardY + this.cardH - 14, this.cardX + this.cardW - 14);

    // 行动按钮
    if (level) {
      this.action.label = left > 0 ? '接单 · 开始修复' : '体力不足 · 看广告 +3';
      this.action.kind = left > 0 ? 'primary' : 'gold';
      this.action.disabled = false;
    } else {
      this.action.label = '重游旧单 · 翻阅记忆册';
      this.action.kind = 'ghost';
      this.action.disabled = false;
    }
    this.action.draw(ctx, this.time);

    // 底部入口
    const subs = [
      `${done}/${CHAPTER.total} 段`,
      `铜板 ${save.coins}`,
      '给朋友'
    ];
    this.nav.forEach((item, i) => {
      fillRound(ctx, item.x, item.y, item.w, item.h, 12, 'rgba(26, 20, 15, 0.72)');
      strokeRound(ctx, item.x + 0.5, item.y + 0.5, item.w - 1, item.h - 1, 12, 'rgba(226, 179, 106, 0.16)', 1);
      drawNavIcon(ctx, item.key, item.x + item.w / 2, item.y + item.h * 0.38);
      text(ctx, item.label, item.x + item.w / 2, item.y + item.h * 0.66, {
        size: FS(11), color: COLORS.paper, align: 'center', baseline: 'middle', maxWidth: item.w - 12
      });
      text(ctx, subs[i], item.x + item.w / 2, item.y + item.h * 0.84, {
        size: FS(9), color: COLORS.gray, align: 'center', baseline: 'middle', maxWidth: item.w - 12
      });
    });
  }
}
