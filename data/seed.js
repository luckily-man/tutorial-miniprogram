// 示例教程数据（首次启动写入本地存储）
// 说明：videoUrl 为示例视频地址，需在开发者工具中关闭“校验合法域名”才能播放（本工程已设置 urlCheck:false）
// 若示例视频地址失效，详情页会显示“暂无视频”，不影响文字教程查看。

const SAMPLE_VIDEO = 'https://media.w3.org/2010/05/sintel/trailer.mp4'

const SEED = [
  {
    id: 'seed-subway',
    title: '怎么坐地铁（新手必看）',
    category: '行',
    emoji: '🚇',
    summary: '第一次坐地铁不知道怎么买票、怎么换乘？这篇手把手教你从进站到出站。',
    author: '官方示例',
    createdAt: 1700000000000,
    videoUrl: SAMPLE_VIDEO,
    steps: [
      { title: '进站购票', text: '在自助购票机选择目的地线路和站点，投入纸币或扫码支付，取票和找零。也可用手机扫码/ NFC 直接过闸。' },
      { title: '安检进站', text: '将背包放入安检机，通过闸机刷票或扫码进站，保管好车票/乘车码。' },
      { title: '候车', text: '看清站内指示牌，确认乘坐方向与站台编号，在黄色安全线后有序等候。' },
      { title: '乘车', text: '列车到站后先下后上，上车后站稳扶好，留意报站避免坐过站。' },
      { title: '换乘 / 出站', text: '到达后随指示出站；如需换乘，按站内导向标识前往对应线路站台即可。' }
    ]
  },
  {
    id: 'seed-plane',
    title: '怎么坐飞机（全流程）',
    category: '行',
    emoji: '✈️',
    summary: '从买票、值机、安检到登机落地，坐飞机的全流程避坑指南。',
    author: '官方示例',
    createdAt: 1700100000000,
    videoUrl: SAMPLE_VIDEO,
    steps: [
      { title: '购票与值机', text: '提前在航旅纵横或航司官网购票；起飞前 24–48 小时可网上值机选座，或到机场柜台办理。' },
      { title: '到达机场', text: '国内航班建议提前 2 小时、国际航班提前 3 小时到达，留足安检与步行时间。' },
      { title: '安检', text: '出示证件与登机牌；液体单瓶不超过 100ml，电子产品需单独取出过检。' },
      { title: '登机', text: '留意广播与登机口显示屏，按时登机，对号入座并系好安全带。' },
      { title: '落地取行李', text: '下机后按航班号到对应行李转盘领取托运行李，核对无误后离场。' }
    ]
  },
  {
    id: 'seed-tomato',
    title: '怎么做番茄炒蛋',
    category: '食',
    emoji: '🍅',
    summary: '国民下饭菜，十分钟搞定。关键在于蛋要嫩、番茄要出汁。',
    author: '官方示例',
    createdAt: 1700200000000,
    videoUrl: SAMPLE_VIDEO,
    steps: [
      { title: '备料', text: '鸡蛋 2–3 个打散加少许盐；番茄 2 个去蒂切块。' },
      { title: '炒蛋', text: '热锅下油，倒入蛋液快速炒至刚刚凝固即盛出，保持嫩滑。' },
      { title: '炒番茄', text: '锅内补少许油，下番茄中火翻炒出汁，可加少许糖提鲜中和酸味。' },
      { title: '合炒出锅', text: '倒回鸡蛋翻炒均匀，加盐调味，撒葱花出锅。' }
    ]
  },
  {
    id: 'seed-coffee',
    title: '怎么煮一杯手冲咖啡',
    category: '生活',
    emoji: '☕',
    summary: '不用咖啡机，在家也能做出干净明亮的手冲咖啡。',
    author: '官方示例',
    createdAt: 1700300000000,
    videoUrl: '',
    steps: [
      { title: '磨豆', text: '取 15g 咖啡豆，研磨至中细砂糖粗细。' },
      { title: '温杯', text: '用热水温润滤纸与分享壶，去除纸味并保温。' },
      { title: '闷蒸', text: '注入约 30g 热水，让咖啡粉充分膨胀闷蒸 30 秒。' },
      { title: '分段注水', text: '分 2–3 次由内向外画圈注水至总量 250g，总时长约 2 分 30 秒。' }
    ]
  }
]

module.exports = SEED
