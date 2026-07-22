const store = require('../../utils/store.js')

const ROLE_LABEL = { user: '普通用户', uploader: '上传者', admin: '管理员' }

Page({
  data: {
    denied: false,
    me: null,
    users: [],
    inviteCode: '',
    inviteRole: '',
    inviteRoleLabel: '',
    isPreview: false,
    previewRole: '',
    previewRoleLabel: ''
  },

  onShow() {
    const me = store.getRealUser()
    const app = getApp()
    const isPreview = !!(app && app.globalData && app.globalData.isPreview)
    this.setData({
      denied: me.role !== 'admin',
      me: me,
      isPreview: isPreview,
      previewRole: isPreview ? app.globalData.previewRole : '',
      previewRoleLabel: isPreview ? (ROLE_LABEL[app.globalData.previewRole] || '') : ''
    })
    this.syncTabBar('/pages/admin/admin')
    if (me.role === 'admin') this.loadUsers()
  },

  // 模拟切换到某角色（仅本地预览，不改真实权限）
  previewAs(e) {
    const role = e.currentTarget.dataset.role
    store.setPreviewRole(role)
    this.setData({ isPreview: true, previewRole: role, previewRoleLabel: ROLE_LABEL[role] || role })
    wx.showToast({ title: '已模拟「' + (ROLE_LABEL[role] || role) + '」，去其他页面查看', icon: 'none' })
  },

  exitPreview() {
    store.clearPreview()
    this.setData({ isPreview: false, previewRole: '', previewRoleLabel: '' })
  },

  syncTabBar(page) {
    const tb = this.getTabBar && this.getTabBar()
    if (!tb) return
    tb.refresh()
    const idx = tb.data.visibleTabs.findIndex(function (t) { return t.page === page })
    tb.setData({ selected: idx < 0 ? 0 : idx })
  },

  loadUsers() {
    const that = this
    store.listUsers().then(function (res) {
      const users = (res && res.users) || []
      const list = users.map(function (u) {
        return { openid: u._openid, role: u.role, roleLabel: ROLE_LABEL[u.role] || u.role }
      })
      that.setData({ users: list })
    })
  },

  // 生成邀请码（替代原先的「粘贴 openid」预分配）
  genInvite(e) {
    const role = e.currentTarget.dataset.role
    const that = this
    wx.showLoading({ title: '生成中' })
    store.createInvite(role).then(function (r) {
      wx.hideLoading()
      if (r && r.success) {
        that.setData({
          inviteCode: r.code,
          inviteRole: role,
          inviteRoleLabel: ROLE_LABEL[role] || role
        })
        wx.showToast({ title: '已生成', icon: 'success' })
      } else {
        wx.showToast({ title: (r && r.errMsg) || '生成失败', icon: 'none' })
      }
    })
  },

  copyInvite() {
    wx.setClipboardData({ data: this.data.inviteCode })
  },

  changeRole(e) {
    const ds = e.currentTarget.dataset
    this.doSet(ds.openid, ds.role)
  },

  doSet(openid, role) {
    const that = this
    wx.showModal({
      title: '修改角色',
      content: '将用户 ' + openid.slice(0, 6) + '… 设为「' + ROLE_LABEL[role] + '」？',
      success(res) {
        if (res.confirm) {
          store.setRole(openid, role).then(function (r) {
            if (r && r.success) {
              wx.showToast({ title: '已更新', icon: 'success' })
              that.loadUsers()
            } else {
              wx.showToast({ title: (r && r.errMsg) || '操作失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  copyOpenid(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.openid })
  }
})
