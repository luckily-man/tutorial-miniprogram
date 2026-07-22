const store = require('./utils/store.js')

// ⚠️ 把下面替换成你自己的「云开发环境 ID」
// 获取方式：微信开发者工具顶部「云开发」→ 环境设置 → 复制环境 ID（形如 cloud1-xxxxxxxx）
const CLOUD_ENV = 'cloud1-d7g0wu9zfcd9e49f5'

App({
  globalData: {
    appName: '教程大全',
    cloudEnv: CLOUD_ENV,
    role: 'user',
    openid: '',
    isPreview: false,
    previewRole: ''
  },
  onLaunch() {
    // 隐私授权：上传视频需用户同意「收集选中的照片或视频」
    if (wx.onNeedPrivacyAuthorize) {
      wx.onNeedPrivacyAuthorize((resolve) => {
        wx.showModal({
          title: '隐私授权',
          content: '本小程序在上传教程时会从你的相册选择或拍摄视频，用于作为教程演示内容展示给其他用户观看学习。是否同意？',
          confirmText: '同意',
          cancelText: '暂不',
          success: (res) => {
            if (res.confirm) {
              resolve({ event: 'agree', resolve: true })
            } else {
              resolve({ event: 'disagree' })
            }
          }
        })
      })
    }
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
    // 启动鉴权：获取当前用户角色（首位使用者自动成为管理员）
    store.getRole().then(function (info) {
      const app = getApp()
      if (app && app.globalData) {
        app.globalData.role = info.role
        app.globalData.openid = info.openid
      }
      // 角色确定后，刷新当前已显示的自定义 tabBar（避免首次启动需手动切换才显示管理 tab）
      setTimeout(function () {
        const pages = getCurrentPages()
        pages.forEach(function (p) {
          const tb = p.getTabBar && p.getTabBar()
          if (tb && tb.refresh) tb.refresh()
        })
      }, 300)
    })
    // 首次把示例教程写入云数据库（仅当集合为空时）
    store.syncSeedIfEmpty()
  }
})
