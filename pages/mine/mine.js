const store = require('../../utils/store.js')

Page({
  data: {
    list: []
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const that = this
    store.getAll().then(function (all) {
      // 标记本机上传的内容，仅这些显示删除按钮
      const list = all.map(function (t) {
        return Object.assign({}, t, { mine: store.isMine(t.id) })
      })
      that.setData({ list: list })
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
      content: '确定要删除这个教程吗？此操作不可恢复（仅可删除本机上传的内容）。',
      confirmColor: '#e54d42',
      success(res) {
        if (res.confirm) {
          store.remove(id).then(function (ok) {
            if (ok) {
              that.refresh()
              wx.showToast({ title: '已删除', icon: 'success' })
            } else {
              wx.showToast({ title: '只能删除自己上传的', icon: 'none' })
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
