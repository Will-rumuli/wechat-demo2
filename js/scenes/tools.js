// 工具架：放大镜、镊子、台灯三件工具升级
import { W, H, SAFE_TOP, SAFE_BOTTOM, FS } from '../core/screen.js';
import {
  COLORS, drawWorkbench, panel, text, wrapText, fillRound, strokeRound
} from '../ui/theme.js';
import { IconButton, ScrollView, coinText } from '../ui/widgets.js';
import { TOOLS } from '../data/tools.js';
import { getSave, upgradeTool } from '../core/storage.js';
import { playTap, play } from '../core/audio.js';

const PAD = 20;
const GAP = 10;

export default class Tools {
  constructor(app) {
    this.app = app;
    this.time = 0;
    this.compact = H < 640;
    this.save = getSave();

    this.back = new IconButton({
      x: PAD + 14, y: SAFE_TOP + 14, r: 15, icon: 'back',
      onTap: () => this.app.go('shop')
    });
    this.listY = SAFE_TOP + 58;
    this.cardH = this.compact ? 136 : 148;
    this.scroll = new ScrollView({
      x: PAD, y: this.listY, w: W - PAD * 2, h: H - SAFE_BOTTOM - this.listY - 8
    });
    this.scroll.setContent(TOOLS.length * (this.cardH + GAP));
  }

  update(dt) {
    this.time += dt;
    this.back.update(dt);
    this.scroll.update(dt);
  }

  start(x, y) {
    if (this.back.tap(x, y)) {
      playTap();
      return;
    }
    // 升级按钮：先算出行号与卡片内位置
    const row = Math.floor((y - this.listY + this.scroll.offset) / (this.cardH + GAP));
    if (row >= 0 && row < TOOLS.length) {
      const localY = y - this.listY - row * (this.cardH + GAP) + this.scroll.offset;
      const bx = PAD + (W - PAD * 2) - 104;
      const by = this.cardH - 46;
      if (x >= bx && x <= bx + 92 && localY >= by && localY <= by + 34) {
        this.upgrade(TOOLS[row]);
        playTap();
        return;
      }
    }
    this.scroll.start(x, y);
  }

  move(x, y) {
    this.scroll.move(y);
  }

  end() {
    this.scroll.end();
  }

  upgrade(tool) {
    const result = upgradeTool(tool.key);
    if (!result.ok) {
      this.app.toast(result.reason === 'coins' ? '铜板不够，先修几件旧物' : '这件工具已经升到顶了');
      return;
    }
    this.save = getSave();
    this.app.toast(`${tool.name}升到 ${result.level} 级`);
    play('chime');
  }

  render(ctx) {
    drawWorkbench(ctx, this.time, 0.2);

    this.back.draw(ctx);
    text(ctx, '工 具 架', W / 2, SAFE_TOP + 14, {
      size: FS(14), color: COLORS.paper, align: 'center', baseline: 'middle', weight: 500
    });
    coinText(ctx, this.save.coins, W - PAD, SAFE_TOP + 14, FS(13), 'right');
    text(ctx, '工具会一直保留，升到 3 级会有明显手感变化', PAD, SAFE_TOP + 42, {
      size: FS(10), color: COLORS.gray, maxWidth: W - PAD * 2
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD, this.listY, W - PAD * 2, this.scroll.h);
    ctx.clip();
    ctx.translate(0, -this.scroll.offset);

    for (let i = 0; i < TOOLS.length; i += 1) {
      const tool = TOOLS[i];
      const level = this.save.tools[tool.key] || 0;
      const y = this.listY + i * (this.cardH + GAP);
      panel(ctx, PAD, y, W - PAD * 2, this.cardH, 14, 0.74);

      // 工具徽章
      fillRound(ctx, PAD + 14, y + 14, 54, 54, 12, 'rgba(226, 179, 106, 0.1)');
      strokeRound(ctx, PAD + 14, y + 14, 54, 54, 12, 'rgba(226, 179, 106, 0.35)', 1);
      text(ctx, tool.short, PAD + 41, y + 41, {
        size: FS(22), color: COLORS.amber, align: 'center', baseline: 'middle', weight: 600
      });

      const tx = PAD + 82;
      const tw = W - PAD * 2 - 100;
      text(ctx, tool.name, tx, y + 30, {
        size: FS(16), color: COLORS.paper, weight: 600, maxWidth: tw
      });
      wrapText(ctx, tool.desc, tx, y + 50, tw, FS(15), 2, {
        size: FS(10), color: COLORS.gray
      });

      // 等级格
      for (let k = 0; k < 3; k += 1) {
        const bx = tx + k * 24;
        const by = y + 86;
        fillRound(ctx, bx, by, 20, 5, 2.5, k < level ? COLORS.amber : 'rgba(243, 231, 211, 0.16)');
      }
      text(ctx, 'Lv.' + level, tx + 80, y + 89, {
        size: FS(9), color: COLORS.gray, baseline: 'middle'
      });

      const effect = level > 0 ? tool.effects[level - 1] : '尚未升级';
      text(ctx, effect, tx, y + 110, {
        size: FS(10), color: level > 0 ? COLORS.amber : COLORS.gray2,
        maxWidth: W - PAD - 120 - tx
      });

      // 升级按钮
      const maxed = level >= 3;
      const cost = maxed ? 0 : tool.costs[level];
      const bx = PAD + (W - PAD * 2) - 104;
      const by = y + this.cardH - 46;
      const affordable = !maxed && this.save.coins >= cost;
      fillRound(ctx, bx, by, 92, 34, 10, maxed ? 'rgba(60, 52, 42, 0.6)' : (affordable ? 'rgba(226, 179, 106, 0.18)' : 'rgba(80, 64, 48, 0.4)'));
      strokeRound(ctx, bx, by, 92, 34, 10, maxed ? 'rgba(243, 231, 211, 0.12)' : 'rgba(226, 179, 106, 0.45)', 1);
      text(ctx, maxed ? '已满级' : `升级 · ${cost}`, bx + 46, by + 17, {
        size: FS(11), color: maxed ? COLORS.gray2 : (affordable ? COLORS.amber : COLORS.gray),
        align: 'center', baseline: 'middle', maxWidth: 84
      });
    }
    ctx.restore();
    this.scroll.drawBar(ctx);
  }
}
