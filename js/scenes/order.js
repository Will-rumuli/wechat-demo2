// 接单：客户剪影、委托台词与物件信息
import { W, H, SAFE_TOP, SAFE_BOTTOM, FS } from '../core/screen.js';
import {
  COLORS, drawWorkbench, panel, text, wrapText, fillRound, strokeRound,
  drawStar
} from '../ui/theme.js';
import { Button, IconButton } from '../ui/widgets.js';
import { drawClient, drawThumb } from '../ui/art.js';
import { LEVELS, levelById } from '../data/levels.js';
import { getSave, useStamina, staminaLeft } from '../core/storage.js';
import { playTap } from '../core/audio.js';

const PAD = 20;
const STEP_NAME = { pick: '拼', trace: '缝', rotate: '转', rub: '磨', swipe: '拂' };
const MATERIAL_NAME = {
  enamel: '搪瓷', fabric: '织物', wood: '木', metal: '铝 / 铁', glass: '玻璃', brass: '黄铜'
};

export default class Order {
  constructor(app, params) {
    this.app = app;
    this.level = levelById(params.id) || LEVELS[0];
    this.time = 0;
    this.compact = H < 640;
    this.save = getSave();
    this.record = this.save.completed[this.level.id];

    this.back = new IconButton({
      x: PAD + 14, y: SAFE_TOP + 14, r: 15, icon: 'back',
      onTap: () => this.app.go('shop')
    });

    // 台词区
    this.speechY = H * (this.compact ? 0.42 : 0.44);
    this.speechW = W - PAD * 2;
    // 中文按字宽约等于字号估算行数，最多两行
    const perLine = Math.max(8, Math.floor((this.speechW - 40) / FS(15)));
    const lineCount = Math.min(2, Math.max(1, Math.ceil(this.level.intro.length / perLine)));
    this.speechH = 30 + lineCount * FS(23);

    const cardH = this.compact ? 104 : 116;
    this.cardY = this.speechY + this.speechH + 16;
    this.cardH = cardH;

    this.startBtn = new Button({
      x: PAD, y: 0, w: W - PAD * 2, h: 50,
      label: this.record ? '再修一次' : '开始修复',
      sub: '消耗 1 点体力',
      kind: 'primary', size: FS(16),
      onTap: () => this.onStart()
    });
    this.startBtn.y = H - SAFE_BOTTOM - this.startBtn.h - 8;
  }

  update(dt) {
    this.time += dt;
    this.back.update(dt);
    this.startBtn.update(dt);
  }

  start(x, y) {
    if (this.back.tap(x, y)) {
      playTap();
      return;
    }
    if (this.startBtn.tap(x, y)) playTap();
  }

  onStart() {
    if (staminaLeft() <= 0) {
      this.app.toast('体力不够了，回铺子看广告补 3 点');
      return;
    }
    if (!useStamina()) {
      this.app.toast('体力不够了');
      return;
    }
    this.app.go('repair', { id: this.level.id });
  }

  shareInfo() {
    return {
      title: `我在补物斋修一件${this.level.name} · 指尖修复师`
    };
  }

  render(ctx) {
    drawWorkbench(ctx, this.time, 0.16);

    this.back.draw(ctx);
    text(ctx, '接 单', W / 2, SAFE_TOP + 14, {
      size: FS(14), color: COLORS.paper, align: 'center', baseline: 'middle', weight: 500
    });

    // 客户
    const clientScale = Math.min(1.15, (W / 375) * 1.0);
    drawClient(ctx, this.level.prop, W / 2, H * 0.34, clientScale, this.time);
    text(ctx, this.level.client, W / 2, H * 0.34 + 96 * clientScale, {
      size: FS(11), color: COLORS.gray, align: 'center', maxWidth: W - 80
    });

    // 台词
    panel(ctx, PAD, this.speechY, this.speechW, this.speechH, 14, 0.78);
    ctx.save();
    ctx.fillStyle = 'rgba(226, 179, 106, 0.9)';
    ctx.fillRect(PAD + 14, this.speechY + 13, 2, this.speechH - 26);
    ctx.restore();
    wrapText(ctx, `“${this.level.intro}”`, PAD + 26, this.speechY + 24, this.speechW - 40, FS(23), 2, {
      size: FS(15), color: COLORS.paper
    });

    // 物件卡
    panel(ctx, PAD, this.cardY, W - PAD * 2, this.cardH, 14, 0.76);
    const thumb = this.cardH - 20;
    const thumbX = PAD + 10;
    const thumbY = this.cardY + 10;
    drawThumb(ctx, this.level.art, this.level.material, thumbX, thumbY, thumb, thumb, this.time);

    const tx = thumbX + thumb + 14;
    const tw = W - PAD - 12 - tx;
    text(ctx, '待修物件', tx, this.cardY + 24, {
      size: FS(10), color: COLORS.amber, maxWidth: tw
    });
    text(ctx, this.level.name, tx, this.cardY + 46, {
      size: FS(19), color: COLORS.paper, weight: 600, maxWidth: tw
    });
    text(ctx, `${MATERIAL_NAME[this.level.material] || '旧物'} · ${this.level.steps.length} 个动作`, tx, this.cardY + 66, {
      size: FS(10), color: COLORS.gray, maxWidth: tw
    });

    // 手势序列
    let chipX = tx;
    const chipY = this.cardY + this.cardH - 22;
    this.level.steps.forEach((step, i) => {
      const label = STEP_NAME[step.type] || '修';
      fillRound(ctx, chipX, chipY - 9, 24, 18, 9, 'rgba(226, 179, 106, 0.12)');
      strokeRound(ctx, chipX, chipY - 9, 24, 18, 9, 'rgba(226, 179, 106, 0.35)', 1);
      text(ctx, label, chipX + 12, chipY + 0.5, {
        size: FS(10), color: COLORS.amber, align: 'center', baseline: 'middle'
      });
      chipX += 28;
      if (i < this.level.steps.length - 1) {
        text(ctx, '·', chipX - 2, chipY, {
          size: FS(10), color: COLORS.gray, align: 'center', baseline: 'middle'
        });
      }
    });

    // 难度
    for (let i = 0; i < 3; i += 1) {
      drawStar(ctx, W - PAD - 60 + i * 16, this.cardY + 24, 5.5, i < this.level.difficulty, COLORS.amber);
    }
    if (this.record) {
      text(ctx, `最好 ${this.record.stars} 星`, W - PAD - 12, this.cardY + 44, {
        size: FS(10), color: COLORS.amber, align: 'right', maxWidth: 70
      });
    }

    // 说明
    text(ctx, this.level.desc, PAD, this.cardY + this.cardH + 18, {
      size: FS(11), color: COLORS.gray, maxWidth: W - PAD * 2
    });

    // 开始按钮
    this.startBtn.label = this.record ? '再修一次' : '开始修复';
    this.startBtn.sub = staminaLeft() > 0 ? '消耗 1 点体力' : '体力不足';
    this.startBtn.draw(ctx, this.time);
  }
}
