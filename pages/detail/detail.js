const store = require('../../utils/store.js')

Page({
  data: {
    tutorial: null,
    videoSrc: '',
    notFound: false
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
      that.setData({
        tutorial: tutorial,
        videoSrc: store.videoSrcOf(tutorial)
      })
    })
  }
})
