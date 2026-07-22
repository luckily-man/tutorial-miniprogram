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

// ===== 角色 / 权限（云端函数校验）=====
const ROLE_KEY = 'role'
const OPENID_KEY = 'openid'

// 启动鉴权：调用 getRole 云函数，返回 { openid, role } 并缓存
function getRole() {
  return wx.cloud.callFunction({ name: 'getRole' })
    .then(function (res) {
      const data = (res.result) || {}
      const role = data.role || 'user'
      const openid = data.openid || ''
      wx.setStorageSync(ROLE_KEY, role)
      if (openid) wx.setStorageSync(OPENID_KEY, openid)
      return { role: role, openid: openid }
    })
    .catch(function (err) {
      console.error('[store] getRole failed', err)
      const role = wx.getStorageSync(ROLE_KEY) || 'user'
      const openid = wx.getStorageSync(OPENID_KEY) || ''
      return { role: role, openid: openid }
    })
}

// 同步读取当前用户（先取缓存，避免等待云函数）
function getRealUser() {
  const app = getApp()
  if (app && app.globalData && app.globalData.role) {
    return { role: app.globalData.role, openid: app.globalData.openid }
  }
  return {
    role: wx.getStorageSync(ROLE_KEY) || 'user',
    openid: wx.getStorageSync(OPENID_KEY) || ''
  }
}

// 读取「当前生效身份」：开启预览时返回模拟角色，否则返回真实角色
function getCurrentUser() {
  const app = getApp()
  if (app && app.globalData && app.globalData.isPreview) {
    return { role: app.globalData.previewRole || 'user', openid: app.globalData.openid }
  }
  return getRealUser()
}

// —— 本地预览（仅管理员用于查看其他角色的页面样式，不改变真实权限）——
function setPreviewRole(role) {
  const app = getApp()
  if (!app || !app.globalData) return
  app.globalData.previewRole = role
  app.globalData.isPreview = true
  refreshTabBars()
}

function clearPreview() {
  const app = getApp()
  if (!app || !app.globalData) return
  app.globalData.isPreview = false
  app.globalData.previewRole = ''
  refreshTabBars()
}

// 刷新当前已显示的自定义 tabBar（预览不改变 tab 可见性，仅重算无副作用）
function refreshTabBars() {
  const pages = getCurrentPages()
  pages.forEach(function (p) {
    const tb = p.getTabBar && p.getTabBar()
    if (tb && tb.refresh) tb.refresh()
  })
}

// 新增教程：走 addTutorial 云函数（服务端校验上传权限）
function addTutorial(tutorial) {
  return wx.cloud.callFunction({ name: 'addTutorial', data: { tutorial: tutorial } })
    .then(function (res) {
      const result = (res.result) || {}
      if (result.success) {
        markMine(tutorial.id)
        return result
      }
      wx.showToast({ title: result.errMsg || '保存失败', icon: 'none' })
      return result
    })
    .catch(function (err) {
      console.error('[store] addTutorial failed', err)
      wx.showToast({ title: '保存失败，请检查云函数是否已部署', icon: 'none' })
      return { success: false }
    })
}

// 删除教程：走 removeTutorial 云函数（服务端校验删除权限）
function removeTutorial(id) {
  return wx.cloud.callFunction({ name: 'removeTutorial', data: { id: id } })
    .then(function (res) {
      const result = (res.result) || {}
      if (!result.success) wx.showToast({ title: result.errMsg || '删除失败', icon: 'none' })
      return result
    })
    .catch(function (err) {
      console.error('[store] removeTutorial failed', err)
      wx.showToast({ title: '删除失败，请检查云函数是否已部署', icon: 'none' })
      return { success: false }
    })
}

// 管理员修改角色
function setRole(openid, role) {
  return wx.cloud.callFunction({ name: 'setRole', data: { openid: openid, role: role } })
    .then(function (res) { return (res.result) || {} })
    .catch(function (err) {
      console.error('[store] setRole failed', err)
      return { success: false, errMsg: '操作失败' }
    })
}

// 管理员列出用户
function listUsers() {
  return wx.cloud.callFunction({ name: 'listUsers' })
    .then(function (res) { return (res.result) || {} })
    .catch(function (err) {
      console.error('[store] listUsers failed', err)
      return { success: false, users: [] }
    })
}

// 管理员生成角色邀请码（role: 'uploader' | 'admin'）
function createInvite(role) {
  return wx.cloud.callFunction({ name: 'createInvite', data: { role: role } })
    .then(function (res) { return (res.result) || {} })
    .catch(function (err) {
      console.error('[store] createInvite failed', err)
      return { success: false, errMsg: '生成失败，请检查云函数是否已部署' }
    })
}

// 用户激活邀请码：成功后更新本机缓存与全局角色
function acceptInvite(code) {
  return wx.cloud.callFunction({ name: 'acceptInvite', data: { code: code } })
    .then(function (res) {
      const result = (res.result) || {}
      if (result.success) {
        const role = result.role || 'user'
        wx.setStorageSync(ROLE_KEY, role)
        const app = getApp()
        if (app && app.globalData) app.globalData.role = role
      }
      return result
    })
    .catch(function (err) {
      console.error('[store] acceptInvite failed', err)
      return { success: false, errMsg: '激活失败，请检查云函数是否已部署' }
    })
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
  videoSrcOf: videoSrcOf,
  getRole: getRole,
  getRealUser: getRealUser,
  getCurrentUser: getCurrentUser,
  setPreviewRole: setPreviewRole,
  clearPreview: clearPreview,
  addTutorial: addTutorial,
  removeTutorial: removeTutorial,
  setRole: setRole,
  listUsers: listUsers,
  createInvite: createInvite,
  acceptInvite: acceptInvite
}
