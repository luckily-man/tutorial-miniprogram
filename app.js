const store = require('./utils/store.js')

// ⚠️ 把下面替换成你自己的「云开发环境 ID」
// 获取方式：微信开发者工具顶部「云开发」→ 环境设置 → 复制环境 ID（形如 cloud1-xxxxxxxx）
const CLOUD_ENV = 'cloud1-d7g0wu9zfcd9e49f5'

App({
  globalData: {
    appName: '教程大全',
    cloudEnv: CLOUD_ENV
  },
  onLaunch() {
    if (!wx.cloud) {
      wx.showModal({
        title: '提示',
        content: '当前基础库不支持云开发，请升级微信开发者工具到最新版。',
        showCancel: false
      })
      return
    }
    if (CLOUD_ENV === 'YOUR_CLOUD_ENV_ID') {
      wx.showModal({
        title: '未配置云环境',
        content: '请在 app.js 顶部把 CLOUD_ENV 替换成你的云开发环境 ID（微信开发者工具 → 云开发 → 环境设置）。',
        showCancel: false
      })
      return
    }
    wx.cloud.init({ env: CLOUD_ENV, traceUser: true })
    // 首次把示例教程写入云数据库（仅当集合为空时）
    store.syncSeedIfEmpty()
  }
})
