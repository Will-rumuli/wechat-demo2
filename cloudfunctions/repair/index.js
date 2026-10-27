// 修复铺云函数：静默登录识别 + 云存档
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const USER_COL = 'repair_users';
const SAVE_COL = 'repair_saves';

function fail(error) {
  return { ok: false, error };
}

function digits(n) {
  let out = '';
  for (let i = 0; i < n; i += 1) out += Math.floor(Math.random() * 10);
  return out;
}

// 首次登录生成昵称，查重后写入；同一个 openid 永远返回同一个昵称
async function registerUser(openid) {
  const col = db.collection(USER_COL);
  try {
    const res = await col.doc(openid).get();
    if (res.data && res.data.nickName) return res.data;
  } catch (e) {
    // 首次登录还没有记录
  }

  for (let i = 0; i < 20; i += 1) {
    const nickName = `修复师${digits(4)}`;
    try {
      const dup = await col.where({ nickName }).count();
      if (dup.total > 0) continue;
      const data = { nickName, createdAt: Date.now() };
      await col.doc(openid).set({ data });
      return data;
    } catch (e) {
      // 并发撞名或唯一索引冲突，换一组再试
    }
  }
  return null;
}

async function loadSave(openid) {
  try {
    const res = await db.collection(SAVE_COL).doc(openid).get();
    return { ok: true, save: (res.data && res.data.save) || null };
  } catch (e) {
    // 没有记录或集合还没建，都当作空存档
    return { ok: true, save: null };
  }
}

async function writeSave(openid, save) {
  if (!save || typeof save !== 'object') return fail('server');
  try {
    await db.collection(SAVE_COL).doc(openid).set({
      data: { save, updatedAt: Date.now() }
    });
    return { ok: true };
  } catch (e) {
    return fail('server');
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const openid = OPENID || (event.profile && event.profile.id) || '';
  if (!openid) return fail('denied');

  try {
    switch (event.action) {
      case 'whoami': {
        const profile = await registerUser(openid);
        if (!profile) return fail('server');
        return { ok: true, openid, nickName: profile.nickName };
      }
      case 'loadSave':
        return await loadSave(openid);
      case 'writeSave':
        return await writeSave(openid, event.save);
      default:
        return fail('server');
    }
  } catch (e) {
    return fail('server');
  }
};
