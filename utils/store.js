// 微信云开发数据层：教程存云端，所有人可见
// 数据库集合：tutorials（权限需设为「所有用户可读，仅创建者可写」）
// 云存储：视频上传后返回 fileID，可直接在 <video> 播放，免域名校验

const SEED = require('../data/seed.js')
const COLLECTION = 'tutorials'
const MY_IDS_KEY = 'my_upload_ids'   // 本机上传过的教程 id 列表（用于「我的」页判断）

function db() {
  return wx.cloud.database()
}

// 拉取全部教程（倒序），最多 100 条
function getAll() {
  return db().collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get()
    .then(function (res) { return res.data || [] })
    .catch(function (err) {
      console.error('[store] getAll failed', err)
      wx.showToast({ title: '加载失败，请检查云环境', icon: 'none' })
      return []
    })
}

// 按业务 id（即文档 _id）获取
function getById(id) {
  return db().collection(COLLECTION).doc(id).get()
    .then(function (res) { return res.data || null })
    .catch(function () { return null })
}

// 新增教程：用业务 id 作为文档 _id，便于详情页直接查询
function add(tutorial) {
  const data = Object.assign({}, tutorial)
  data._id = tutorial.id
  return db().collection(COLLECTION).add({ data: data })
    .then(function () {
      markMine(tutorial.id)
      return tutorial
    })
    .catch(function (err) {
      console.error('[store] add failed', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
      return null
    })
}

// 删除（云权限「仅创建者可写」下，只能删自己上传的）
function remove(id) {
  return db().collection(COLLECTION).doc(id).remove()
    .then(function () { return true })
    .catch(function () { return false })
}

// 首次启动：若云端集合为空，写入示例教程
function syncSeedIfEmpty() {
  db().collection(COLLECTION).count().then(function (res) {
    if (res.total === 0) {
      SEED.forEach(function (t) {
        const data = Object.assign({}, t)
        data._id = t.id
        db().collection(COLLECTION).add({ data: data }).catch(function () {})
      })
    }
  }).catch(function () {})
}

// —— 本机「我的」标记（区分「我上传的」，仅本机有效）——
function markMine(id) {
  const list = wx.getStorageSync(MY_IDS_KEY) || []
  if (list.indexOf(id) === -1) {
    list.push(id)
    wx.setStorageSync(MY_IDS_KEY, list)
  }
}
function isMine(id) {
  const list = wx.getStorageSync(MY_IDS_KEY) || []
  return list.indexOf(id) > -1
}

// 视频地址：优先云存储 fileID，其次种子外链
function videoSrcOf(tutorial) {
  if (!tutorial) return ''
  return tutorial.videoPath || tutorial.videoUrl || ''
}

module.exports = {
  COLLECTION: COLLECTION,
  getAll: getAll,
  getById: getById,
  add: add,
  remove: remove,
  syncSeedIfEmpty: syncSeedIfEmpty,
  markMine: markMine,
  isMine: isMine,
  videoSrcOf: videoSrcOf
}
