// 场景管理与全局输入分发
import { bindInput, startLoop, W, H, FS } from './core/screen.js';
import { initCloud } from './core/cloud.js';
import { silentLogin, currentUser } from './core/user.js';
import { pullCloudSave, getSave } from './core/storage.js';
import { unlock, playTap } from './core/audio.js';
import { COLORS, fillRound, text, strokeRound } from './ui/theme.js';
import Intro from './scenes/intro.js';
import Shop from './scenes/shop.js';
import Order from './scenes/order.js';
import Repair from './scenes/repair.js';
import Memory from './scenes/memory.js';
import Result from './scenes/result.js';
import Album from './scenes/album.js';
import Tools from './scenes/tools.js';

export default class Main {
  constructor() {
    this.scenes = {
      intro: Intro,
      shop: Shop,
      order: Order,
      repair: Repair,
      memory: Memory,
      result: Result,
      album: Album,
      tools: Tools
    };
    this.current = null;
    this.sceneName = '';
    this.fade = 1;
    this.toastText = '';
    this.toastTime = 0;
    this.user = currentUser();

    initCloud();

    try {
      wx.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage', 'shareTimeline'] });
    } catch (e) {
      // 忽略不支持分享的环境
    }

    try {
      wx.onShareAppMessage(() => {
        if (this.current && this.current.shareInfo) {
          const info = this.current.shareInfo();
          if (info) return info;
        }
        return { title: '在打铜巷 17 号，我修好了一件会说话的旧物' };
      });
    } catch (e) {
      // 忽略
    }

    // 静默登录 + 云存档合并，等待期间先用本地存档进入游戏
    silentLogin().then((user) => {
      if (user) this.user = user;
      pullCloudSave().then(() => {
        if (this.sceneName === 'shop' && this.current && this.current.refresh) {
          this.current.refresh();
        }
      });
    });

    const save = getSave();
    this.go(save.seenIntro ? 'shop' : 'intro');

    bindInput({
      start: (x, y, touches) => {
        unlock();
        if (this.current && this.current.start) this.current.start(x, y, touches);
      },
      move: (x, y, touches) => {
        if (this.current && this.current.move) this.current.move(x, y, touches);
      },
      end: (touches) => {
        if (this.current && this.current.end) this.current.end(touches);
      },
      cancel: () => {
        if (this.current && this.current.cancel) this.current.cancel();
      }
    });

    startLoop(
      (dt) => {
        if (this.fade > 0) this.fade = Math.max(0, this.fade - dt * 5);
        if (this.toastTime > 0) this.toastTime = Math.max(0, this.toastTime - dt);
        if (this.current && this.current.update) this.current.update(dt);
      },
      (ctx) => {
        if (this.current && this.current.render) this.current.render(ctx);
        if (this.fade > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, this.fade)})`;
          ctx.fillRect(0, 0, W, H);
        }
        this.renderToast(ctx);
      }
    );
  }

  go(name, params) {
    const Scene = this.scenes[name];
    if (!Scene) return;
    if (this.current && this.current.leave) this.current.leave();
    this.sceneName = name;
    this.current = new Scene(this, params || {});
    this.fade = 1;
    if (this.current.enter) this.current.enter();
  }

  toast(message, seconds = 1.8) {
    this.toastText = String(message || '');
    this.toastTime = seconds;
  }

  renderToast(ctx) {
    if (!this.toastText || this.toastTime <= 0) return;
    const alpha = Math.min(1, this.toastTime * 3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `500 ${FS(13)}px "PingFang SC", sans-serif`;
    const maxW = W - 64;
    let label = this.toastText;
    while (ctx.measureText(label).width > maxW && label.length > 4) {
      label = `${label.slice(0, label.length - 2)}…`;
    }
    const tw = ctx.measureText(label).width;
    const boxW = tw + 32;
    const boxH = 36;
    const x = (W - boxW) / 2;
    const y = H - 92;
    fillRound(ctx, x, y, boxW, boxH, 18, 'rgba(20, 15, 11, 0.9)');
    strokeRound(ctx, x + 0.5, y + 0.5, boxW - 1, boxH - 1, 18, 'rgba(226, 179, 106, 0.35)', 1);
    text(ctx, label, W / 2, y + boxH / 2, {
      size: FS(13), color: COLORS.paper, align: 'center', baseline: 'middle'
    });
    ctx.restore();
  }

  tapSound() {
    playTap();
  }
}
