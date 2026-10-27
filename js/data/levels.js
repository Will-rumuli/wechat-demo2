// 第一章「打铜巷的夏天」8 单委托数据
// steps 只描述手势类型与难度参数，具体布局由修复场景按物件尺寸生成
//
// 悬疑结构：修好之后，物件会开口说一句话；客户当场否认。
// 玩家只能选一边相信，选择写进记忆册，并决定留下的那句残句。

export const CHAPTER = {
  id: 'ch1',
  name: '第一章 · 打铜巷的夏天',
  total: 8
};

export const LEVELS = [
  {
    id: 'L1-1',
    name: '搪瓷缸',
    art: 'cup',
    material: 'enamel',
    client: '穿旧工装的女人',
    prop: 'umbrella',
    intro: '厂子没了，这个还在。',
    desc: '缸口磕掉了一块瓷，缸身裂了一道细纹。',
    difficulty: 1,
    par: 70,
    steps: [
      { type: 'pick', pieces: 5, tol: 30, note: '把碎瓷一片片拼回原位' },
      { type: 'trace', width: 18, note: '沿着裂纹描一道金线' }
    ],
    memory: {
      text: '那天夜里，门是从里面锁上的。',
      scene: 'factory'
    },
    denial: '她把缸子往回一收：别信它。那天我就在厂里，门是风带上的。',
    choice: {
      ask: '你信谁？',
      object: '信缸子',
      client: '信她',
      objectReply: '缸底的字又深了一分：锁门的人，穿着蓝工装。',
      clientReply: '她松了口气，把缸子抱紧：它记错了，你别往心里去。'
    },
    quoteObject: '物件记得的，是人不敢认的。',
    quoteClient: '她抱得很紧，像怕它再开口。'
  },
  {
    id: 'L1-2',
    name: '蒲扇',
    art: 'fan',
    material: 'fabric',
    client: '摇着空手的老人',
    prop: 'cane',
    intro: '我外婆的。她走那年，扇子就破了。',
    desc: '扇面沿竹骨裂开，扇柄也松了。',
    difficulty: 1,
    par: 75,
    steps: [
      { type: 'trace', width: 20, note: '顺着竹骨，把扇面缝回去' },
      { type: 'pick', pieces: 4, tol: 32, note: '把散开的扇骨拼回扇柄' }
    ],
    memory: {
      text: '一九七六年夏天，她把我借给了隔壁的姑娘。',
      scene: 'summer'
    },
    denial: '老人摇头：胡说。这扇子从没离开过我家。',
    choice: {
      ask: '你信谁？',
      object: '信扇子',
      client: '信老人',
      objectReply: '扇骨缝里掉出一张旧车票，日期是七月二十八日，终点：唐山。',
      clientReply: '老人把扇子合上：那年夏天太热，热得人记不清事。'
    },
    quoteObject: '一把扇子，记得一场没人再提的地震。',
    quoteClient: '有些夏天，最好只记得风。'
  },
  {
    id: 'L1-3',
    name: '缝纫机踏板',
    art: 'pedal',
    material: 'wood',
    client: '裁缝铺的学徒',
    prop: 'bag',
    intro: '师父的机子还能转，就是踏板锈死了。',
    desc: '铁架锈成一片，木踏板也磨得发亮。',
    difficulty: 2,
    par: 85,
    steps: [
      { type: 'rub', cells: 7, note: '把铁架上的锈一点点磨掉' },
      { type: 'trace', width: 16, note: '沿着踏板边缘上一道油' }
    ],
    memory: {
      text: '停工那天，她踩到一半，线断了。',
      scene: 'sewing'
    },
    denial: '学徒笑了一下：不可能，师父说那批货早就赶完了。',
    choice: {
      ask: '你信谁？',
      object: '信踏板',
      client: '信学徒',
      objectReply: '踏板缝里卡着半截蓝线，和她袖口那截一模一样。',
      clientReply: '她低头看了看袖口，把手背到身后：线都是一样的。'
    },
    quoteObject: '停下的针，都停在没说完的话上。',
    quoteClient: '她把手背到身后，像藏起一根线。'
  },
  {
    id: 'L1-4',
    name: '收音机',
    art: 'radio',
    material: 'metal',
    client: '戴老花镜的男人',
    prop: 'cap',
    intro: '那年除夕，就靠它听天气预报。',
    desc: '调频旋钮卡住了，扬声器里全是灰。',
    difficulty: 2,
    par: 85,
    steps: [
      { type: 'rotate', turns: 1.4, note: '转动旋钮，让齿轮重新咬合' },
      { type: 'swipe', dir: 'left', cells: 7, note: '从左往右拂去扬声器的灰' }
    ],
    memory: {
      text: '那年除夕，我播过一条没人敢听的天气。',
      scene: 'radio'
    },
    denial: '男人推了推眼镜：别听它瞎说。那年除夕，收音机根本没响过。',
    choice: {
      ask: '你信谁？',
      object: '信收音机',
      client: '信他',
      objectReply: '旋钮转到某个刻度，杂音里浮出一句：今晚不要出门。',
      clientReply: '男人沉默了很久：那是给别人的通知，不是给我的。'
    },
    quoteObject: '有些预报，是替别人说的。',
    quoteClient: '他把音量调小，像怕吵醒谁。'
  },
  {
    id: 'L1-5',
    name: '相框',
    art: 'frame',
    material: 'glass',
    client: '抱着相框的中年女人',
    prop: 'letter',
    intro: '照片上本来还有一个人。',
    desc: '玻璃蒙了灰，照片右下角被剪掉了一块。',
    difficulty: 2,
    par: 80,
    steps: [
      { type: 'swipe', dir: 'up', cells: 7, note: '自下而上，拂去玻璃上的灰' },
      { type: 'pick', pieces: 4, tol: 30, note: '把剪下的照片一角拼回去' }
    ],
    memory: {
      text: '照片上被剪掉的人，是我亲手挡住的。',
      scene: 'photo'
    },
    denial: '她把相框按在桌上：别瞎说。那是他自己走掉的。',
    choice: {
      ask: '你信谁？',
      object: '信相框',
      client: '信她',
      objectReply: '玻璃反光里，剪口后面还留着一只手，无名指戴着和她一样的戒指。',
      clientReply: '她下意识摸了摸自己的无名指：戒指……早就丢了。'
    },
    quoteObject: '被剪掉的人，留下了半只手。',
    quoteClient: '她把相框翻过去，缺口朝下。'
  },
  {
    id: 'L1-6',
    name: '铝饭盒',
    art: 'lunchbox',
    material: 'metal',
    client: '在门口站了很久的男人',
    prop: 'none',
    intro: '两个人的午饭，后来只剩一个人吃。',
    desc: '盒盖凹进去一块，盒身有几道深划痕。',
    difficulty: 2,
    par: 95,
    steps: [
      { type: 'pick', pieces: 5, tol: 28, note: '把凹进去的盒盖拼平' },
      { type: 'rub', cells: 7, note: '打磨盒身的划痕' }
    ],
    memory: {
      text: '十一月六日，两份饭，他只动了一份。',
      scene: 'lunch'
    },
    denial: '男人盯着饭盒：别说了。那天他根本没来。',
    choice: {
      ask: '你信谁？',
      object: '信饭盒',
      client: '信他',
      objectReply: '盒盖内侧有一道新划痕，刻着两个字：别等。',
      clientReply: '男人用拇指把划痕盖住：这是我刻的。那天我就想告诉他。'
    },
    quoteObject: '有人用一顿饭，替另一个人撒了谎。',
    quoteClient: '他把饭盒扣上，替我留了半句话。'
  },
  {
    id: 'L1-7',
    name: '饭盒的另一半',
    art: 'lunchbox2',
    material: 'metal',
    client: '同一个人，换了件干净衬衫',
    prop: 'none',
    intro: '另一半……也找到了。麻烦你，一起修好。',
    desc: '盖子里夹着一张湿透的纸条，字迹已经糊了。',
    difficulty: 3,
    par: 105,
    steps: [
      { type: 'swipe', dir: 'left', cells: 7, note: '轻轻拂开盒里的灰和纸屑' },
      { type: 'trace', width: 18, note: '沿着折痕，把纸条的裂口缝起来' },
      { type: 'rub', cells: 6, note: '把盒底的水锈磨掉' }
    ],
    memory: {
      text: '另一半不是我。那天，他把它给了车站的人。',
      scene: 'station'
    },
    denial: '这次他没有否认，只低声说：别念出来。',
    choice: {
      ask: '你信谁？',
      object: '信饭盒',
      client: '信他',
      objectReply: '纸条背面浮出四个字：三点十七。和一只怀表的指针一样。',
      clientReply: '他猛地抬头：那只表……你也见过了？'
    },
    quoteObject: '三点十七，所有人都在等同一班车。',
    quoteClient: '有些时刻，被人从不同方向记住。'
  },
  {
    id: 'L1-8',
    name: '黄铜怀表',
    art: 'watch',
    material: 'brass',
    client: '没有露面的委托人',
    prop: 'none',
    intro: '他只留下一句话：修好它，你就会知道。',
    desc: '表壳氧化发黑，表冠卡死，指针停在三点十七分。',
    difficulty: 3,
    par: 130,
    steps: [
      { type: 'rotate', turns: 1.2, note: '转动表冠，给发条重新上力' },
      { type: 'rub', cells: 8, note: '磨去表壳上的氧化层' },
      { type: 'pick', pieces: 4, tol: 26, note: '把裂开的表盖拼合' },
      { type: 'trace', width: 14, note: '沿着表盖的裂口走一道金' }
    ],
    memory: {
      text: '锁门、剪照片、刻「别等」——都是同一个人做的。',
      scene: 'watch'
    },
    denial: '门外传来很轻的一声：别信它。它只记得我想让它记的。',
    choice: {
      ask: '你信谁？',
      object: '信怀表',
      client: '信门外的人',
      objectReply: '表盖内侧刻着两个名字。一个是师父的，另一个，是你。',
      clientReply: '门开了。你听见自己的名字，被人从很远的地方叫了一声。'
    },
    quoteObject: '时间修不好，但它记得每一次说谎。',
    quoteClient: '有些表，走与不走，都在等人。'
  }
];

export function levelById(id) {
  return LEVELS.find((item) => item.id === id) || null;
}

export function levelIndex(id) {
  return LEVELS.findIndex((item) => item.id === id);
}
