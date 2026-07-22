const store = require('../../utils/store.js')

const ROLE_LABEL = { user: '普通用户', uploader: '上传者', admin: '管理员' }

Page({
  data: {
    list: [],
    role: 'user',
    roleLabel: '普通用户',
    activateCode: ''
  },

  onShow() {
    const me = store.getCurrentUser()
    this.setData({
      role: me.role,
      roleLabel: ROLE_LABEL[me.role] || me.role
    })
    this.refresh()
    this.syncTabBar('/pages/mine/mine')
  },

  syncTabBar(page) {
    const tabBar = this.getTabBar && this.getTabBar()
    if (!tabBar) return
    tabBar.refresh()
    const idx = tabBar.data.visibleTabs.findIndex(function (t) { return t.page === page })
    tabBar.setData({ selected: idx < 0 ? 0 : idx })
  },

  refresh() {
    const that = this
    const me = store.getCurrentUser()
    store.getAll().then(function (all) {
      const enriched = all.map(function (t) {
        const mine = (t._openid === me.openid) || store.isMine(t.id)
        const canDelete = me.role === 'admin' || mine
        return Object.assign({}, t, { mine: mine, canDelete: canDelete })
      })
      // 上传者仅看自己上传的；管理员看全部；普通用户无上传
      let list = enriched
      if (me.role === 'uploader') list = enriched.filter(function (t) { return t._openid === me.openid })
      else if (me.role === 'user') list = []
      that.setData({ list: list })
    })
  },

  onCodeInput(e) {
    this.setData({ activateCode: e.detail.value })
  },

  // 激活邀请码：升级身份，无需 openid
  activate() {
    const code = (this.data.activateCode || '').trim().toUpperCase()
    if (!code) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    const that = this
    wx.showLoading({ title: '激活中' })
    store.acceptInvite(code).then(function (r) {
      wx.hideLoading()
      if (r && r.success) {
        const role = r.role
        const label = ROLE_LABEL[role] || role
        that.setData({ role: role, roleLabel: label, activateCode: '' })
        that.syncTabBar('/pages/mine/mine')
        that.refresh()
        wx.showToast({ title: r.upgraded ? '已升级为' + label : '已是最新身份', icon: 'success' })
      } else {
        wx.showToast({ title: (r && r.errMsg) || '激活失败', icon: 'none' })
      }
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    const that = this
    wx.showModal({
      title: '删除教程',
      content: '确定要删除这个教程吗？此操作不可恢复。',
      confirmColor: '#e54d42',
      success(res) {
        if (res.confirm) {
          store.removeTutorial(id).then(function (r) {
            if (r && r.success) {
              that.refresh()
              wx.showToast({ title: '已删除', icon: 'success' })
            } else {
              wx.showToast({ title: (r && r.errMsg) || '删除失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  goUpload() {
    wx.switchTab({ url: '/pages/upload/upload' })
  }
})
