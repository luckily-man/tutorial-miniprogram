// 修改某用户角色（仅管理员可调用）
// 可在目标用户尚未打开小程序前，预先为其分配角色（服务端可指定 _openid）。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const VALID = ['user', 'uploader', 'admin']

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const callerDoc = await db.collection('roles').where({ _openid: OPENID }).get()
  const callerRole = (callerDoc.data && callerDoc.data.length > 0) ? callerDoc.data[0].role : 'user'
  if (callerRole !== 'admin') {
    return { success: false, errMsg: '仅管理员可管理角色' }
  }

  const targetOpenid = event.openid
  const role = event.role
  if (!targetOpenid) return { success: false, errMsg: '缺少目标 openid' }
  if (VALID.indexOf(role) === -1) return { success: false, errMsg: '非法角色' }

  const existing = await db.collection('roles').where({ _openid: targetOpenid }).get()
  if (existing.data && existing.data.length > 0) {
    await db.collection('roles').doc(existing.data[0]._id).update({ data: { role: role } })
  } else {
    // 服务端写入可指定 _openid，为目标用户预置角色
    await db.collection('roles').add({ data: { _openid: targetOpenid, role: role } })
  }
  return { success: true }
}
