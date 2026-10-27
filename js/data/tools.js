// 工具升级配置：三项工具各 3 级
export const TOOLS = [
  {
    key: 'lens',
    name: '放大镜',
    short: '镜',
    desc: '看清裂纹与缺口，手势判定更宽容',
    costs: [36, 72, 120],
    effects: ['判定容差 +12%', '判定容差 +24%', '判定容差 +36%']
  },
  {
    key: 'tweezers',
    name: '镊子',
    short: '镊',
    desc: '手指更稳，完成所需的进度更低',
    costs: [30, 60, 96],
    effects: ['完成线 0.82', '完成线 0.79', '完成线 0.76']
  },
  {
    key: 'lamp',
    name: '台灯',
    short: '灯',
    desc: '照亮该动的地方，并更早给出提示',
    costs: [24, 48, 84],
    effects: ['目标轻微高亮', '停滞 6 秒后提示', '停滞 3 秒后提示']
  }
];

export function emptyTools() {
  return { lens: 0, tweezers: 0, lamp: 0 };
}

export function toolByKey(key) {
  return TOOLS.find((item) => item.key === key) || TOOLS[0];
}

export function toleranceScale(tools) {
  return 1 + (tools.lens || 0) * 0.12;
}

export function finishThreshold(tools) {
  return 0.85 - (tools.tweezers || 0) * 0.03;
}

export function hintDelay(tools) {
  const level = tools.lamp || 0;
  if (level >= 3) return 3;
  if (level === 2) return 6;
  return 10;
}
