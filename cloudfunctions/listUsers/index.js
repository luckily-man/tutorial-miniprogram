// 列出所有用户及其角色（仅管理员可调用），用于管理页授权
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const callerDoc = await db.collection('roles').where({ _openid: OPENID }).get()
  const callerRole = (callerDoc.data && callerDoc.data.length > 0) ? callerDoc.data[0].role : 'user'
  if (callerRole !== 'admin') {
    return { success: false, errMsg: '无权限' }
  }

  const res = await db.collection('roles').limit(100).get()
  return { success: true, users: res.data || [] }
}
