// 激活邀请码（任意用户可调用）
// 校验通过后，将调用者自身角色升级为邀请码对应的角色（只升不降），并标记邀请码已用。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTION = 'invites'
const ROLE_RANK = { user: 1, uploader: 2, admin: 3 }

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const code = (event.code || '').trim().toUpperCase()
  if (!code) return { success: false, errMsg: '请输入邀请码' }

  try { await db.createCollection(COLLECTION) } catch (e) { /* 已存在则忽略 */ }
  const invites = db.collection(COLLECTION)

  const found = await invites.where({ code: code }).get()
  if (!found.data || found.data.length === 0) {
    return { success: false, errMsg: '邀请码无效' }
  }
  const inv = found.data[0]
  if (inv.usedBy) return { success: false, errMsg: '该邀请码已被使用' }
  if (inv.expiresAt && inv.expiresAt < Date.now()) return { success: false, errMsg: '邀请码已过期' }

  const targetRole = inv.role

  // 查找调用者当前角色记录
  const roleDoc = await db.collection('roles').where({ _openid: OPENID }).get()
  let curRole = 'user'
  let docId = ''
  if (roleDoc.data && roleDoc.data.length > 0) {
    curRole = roleDoc.data[0].role
    docId = roleDoc.data[0]._id
  }

  // 只升级、不降级
  const upgraded = ROLE_RANK[targetRole] > ROLE_RANK[curRole]
  if (upgraded) {
    if (docId) {
      await db.collection('roles').doc(docId).update({ data: { role: targetRole } })
    } else {
      await db.collection('roles').add({ data: { _openid: OPENID, role: targetRole } })
    }
  }

  await invites.doc(inv._id).update({ data: { usedBy: OPENID, usedAt: Date.now() } })

  const effectiveRole = upgraded ? targetRole : curRole
  return { success: true, role: effectiveRole, upgraded: upgraded }
}
