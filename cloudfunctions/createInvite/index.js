// 生成角色邀请码（仅管理员可调用）
// 返回 6 位邀请码，对方在「我的」页粘贴激活即可获得对应角色，无需提供 openid。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTION = 'invites'
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去掉易混淆的 0/O/1/I

function genCode(len) {
  let s = ''
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)]
  return s
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // 仅管理员可生成邀请码
  const callerDoc = await db.collection('roles').where({ _openid: OPENID }).get()
  const callerRole = (callerDoc.data && callerDoc.data.length > 0) ? callerDoc.data[0].role : 'user'
  if (callerRole !== 'admin') {
    return { success: false, errMsg: '仅管理员可生成邀请码' }
  }

  const role = event.role
  if (role !== 'uploader' && role !== 'admin') {
    return { success: false, errMsg: '邀请角色仅支持上传者/管理员' }
  }

  try { await db.createCollection(COLLECTION) } catch (e) { /* 已存在则忽略 */ }
  const invites = db.collection(COLLECTION)

  // 生成不重复且未被使用的邀请码
  let code = ''
  for (let i = 0; i < 6; i++) {
    code = genCode(6)
    const dup = await invites.where({ code: code, usedBy: '' }).get()
    if (!dup.data || dup.data.length === 0) break
  }

  const expiresAt = Date.now() + 7 * 24 * 3600 * 1000 // 7 天有效
  await invites.add({
    data: {
      code: code,
      role: role,
      createdBy: OPENID,
      createdAt: Date.now(),
      expiresAt: expiresAt,
      usedBy: ''
    }
  })
  return { success: true, code: code, role: role }
}
