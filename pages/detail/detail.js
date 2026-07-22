const store = require('../../utils/store.js')

Page({
  data: {
    tutorial: null,
    videoSrc: '',
    notFound: false,
    canDelete: false
  },

  onLoad(options) {
    const that = this
    const id = options.id
    store.getById(id).then(function (tutorial) {
      if (!tutorial) {
        that.setData({ notFound: true })
        return
      }
      wx.setNavigationBarTitle({ title: tutorial.title })
      const me = store.getCurrentUser()
      const canDelete = me.role === 'admin' ||
        (me.role === 'uploader' && tutorial._openid === me.openid)
      that.setData({
        tutorial: tutorial,
        videoSrc: store.videoSrcOf(tutorial),
        canDelete: !!canDelete
      })
    })
  },

  onDelete() {
    const that = this
    const id = this.data.tutorial.id
    wx.showModal({
      title: '删除教程',
      content: '确定要删除这个教程吗？此操作不可恢复。',
      confirmColor: '#e54d42',
      success(res) {
        if (res.confirm) {
          store.removeTutorial(id).then(function (r) {
            if (r && r.success) {
              wx.showToast({ title: '已删除', icon: 'success' })
              setTimeout(function () { wx.navigateBack() }, 800)
            } else {
              wx.showToast({ title: (r && r.errMsg) || '删除失败', icon: 'none' })
            }
          })
        }
      }
    })
  }
})
