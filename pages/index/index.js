const store = require('../../utils/store.js')

const CATEGORIES = ['全部', '地铁', '飞机', '做菜', '其他']

Page({
  data: {
    categories: CATEGORIES,
    activeCategory: '全部',
    keyword: '',
    list: []
  },

  onShow() {
    // 每次显示都刷新（上传/删除后数据会变）
    this.refresh()
  },

  onPullDownRefresh() {
    this.refresh()
    wx.stopPullDownRefresh()
  },

  refresh() {
    const that = this
    store.getAll().then(function (all) {
      that.applyFilter(all)
    })
  },

  applyFilter(all) {
    const cat = this.data.activeCategory
    const kw = this.data.keyword.trim().toLowerCase()
    let list = all
    if (cat !== '全部') {
      list = list.filter(function (t) { return t.category === cat })
    }
    if (kw) {
      list = list.filter(function (t) {
        return (t.title + t.summary).toLowerCase().indexOf(kw) > -1
      })
    }
    this.setData({ list: list })
  },

  onCategoryTap(e) {
    const cat = e.currentTarget.dataset.cat
    this.setData({ activeCategory: cat })
    this.applyFilter(this.data.list)
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.applyFilter(this.data.list)
  },

  onClear() {
    this.setData({ keyword: '' })
    this.applyFilter(this.data.list)
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  }
})
