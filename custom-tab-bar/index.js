// 自定义 tabBar：按当前用户角色显示不同 tab
//   首页：所有人可见
//   上传 / 我的：上传者、管理员可见
//   管理：仅管理员可见
const ALL_TABS = [
  { page: '/pages/index/index', emoji: '🏠', text: '首页' },
  { page: '/pages/upload/upload', emoji: '⬆️', text: '上传' },
  { page: '/pages/mine/mine', emoji: '👤', text: '我的' },
  { page: '/pages/admin/admin', emoji: '⚙️', text: '管理' }
]

Component({
  data: {
    selected: 0,
    visibleTabs: []
  },

  lifetimes: {
    attached() { this.refresh() }
  },

  pageLifetimes: {
    show() { this.refresh() }
  },

  methods: {
    refresh() {
      const app = getApp()
      const role = (app && app.globalData && app.globalData.role) || 'user'
      const visible = ALL_TABS.filter(function (t) {
        if (t.page === '/pages/admin/admin') return role === 'admin'
        if (t.page === '/pages/upload/upload' || t.page === '/pages/mine/mine') return role !== 'user'
        return true
      })
      this.setData({ visibleTabs: visible })
    },

    switchTab(e) {
      const page = e.currentTarget.dataset.page
      wx.switchTab({ url: page })
    }
  }
})
