const store = require('../../utils/store.js')

const CATEGORIES = ['衣', '食', '住', '行', '生活', '学习', '其它']

Page({
  data: {
    categories: CATEGORIES,
    catIndex: 0,
    title: '',
    summary: '',
    author: '我',
    steps: [''],       // 文字步骤（每行一段）
    videoPath: '',     // 本地选择的视频临时路径
    submitting: false,
    denied: false
  },

  onShow() {
    const me = store.getCurrentUser()
    this.setData({ denied: me.role === 'user' })
    this.syncTabBar('/pages/upload/upload')
  },

  syncTabBar(page) {
    const tabBar = this.getTabBar && this.getTabBar()
    if (!tabBar) return
    tabBar.refresh()
    const idx = tabBar.data.visibleTabs.findIndex(function (t) { return t.page === page })
    tabBar.setData({ selected: idx < 0 ? 0 : idx })
  },

  onCategoryChange(e) {
    this.setData({ catIndex: Number(e.detail.value) })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  onStepInput(e) {
    const idx = e.currentTarget.dataset.idx
    const steps = this.data.steps.slice()
    steps[idx] = e.detail.value
    this.setData({ steps: steps })
  },

  addStep() {
    const steps = this.data.steps.concat('')
    this.setData({ steps: steps })
  },

  removeStep(e) {
    const idx = e.currentTarget.dataset.idx
    if (this.data.steps.length <= 1) return
    const steps = this.data.steps.slice()
    steps.splice(idx, 1)
    this.setData({ steps: steps })
  },

  chooseVideo() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      success(res) {
        const file = res.tempFiles[0]
        that.setData({ videoPath: file.tempFilePath })
      }
    })
  },

  removeVideo() {
    this.setData({ videoPath: '' })
  },

  onSubmit() {
    const that = this
    if (this.data.denied) {
      wx.showToast({ title: '无权限，仅上传者/管理员可发布', icon: 'none' })
      return
    }
    const title = this.data.title.trim()
    const summary = this.data.summary.trim()
    const category = this.data.categories[this.data.catIndex]

    if (!title) {
      wx.showToast({ title: '请填写标题', icon: 'none' })
      return
    }

    const cleanedSteps = this.data.steps
      .map(function (s) { return s.trim() })
      .filter(function (s) { return s.length > 0 })

    if (cleanedSteps.length === 0 && !this.data.videoPath) {
      wx.showToast({ title: '至少写一步说明或加视频', icon: 'none' })
      return
    }

    const steps = cleanedSteps.map(function (text, i) {
      return { title: '步骤 ' + (i + 1), text: text }
    })

    this.setData({ submitting: true })

    const buildAndSave = function (videoPath) {
      const tutorial = {
        id: 'u-' + Date.now(),
        title: title,
        category: category,
        emoji: '📤',
        summary: summary || '由用户上传的教程',
        author: that.data.author,
        videoPath: videoPath,   // 云存储 fileID 或空
        steps: steps
      }
      store.addTutorial(tutorial).then(function (res) {
        that.setData({ submitting: false })
        if (res && res.success) {
          wx.showToast({ title: '上传成功', icon: 'success' })
          setTimeout(function () {
            wx.switchTab({ url: '/pages/index/index' })
          }, 800)
        }
      })
    }

    // 无视频：直接保存
    if (!this.data.videoPath) {
      buildAndSave('')
      return
    }

    // 有视频：先上传到云存储，再保存
    wx.showLoading({ title: '上传视频中' })
    const ext = (this.data.videoPath.split('.').pop() || 'mp4').split('?')[0]
    const cloudPath = 'tutorials/' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.' + ext
    wx.cloud.uploadFile({ cloudPath: cloudPath, filePath: this.data.videoPath })
      .then(function (res) {
        wx.hideLoading()
        buildAndSave(res.fileID)
      })
      .catch(function (err) {
        wx.hideLoading()
        console.error('[upload] uploadFile failed', err)
        wx.showToast({ title: '视频上传失败', icon: 'none' })
        that.setData({ submitting: false })
      })
  }
})
