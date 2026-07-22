// 删除教程（带角色校验）
//   - 管理员：可删除任意教程
//   - 上传者：仅可删除自己上传的（_openid 匹配）
//   - 普通用户：无权限
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const id = event.id

  if (!id) return { success: false, errMsg: '缺少教程 id' }

  const roleDoc = await db.collection('roles').where({ _openid: OPENID }).get()
  const role = (roleDoc.data && roleDoc.data.length > 0) ? roleDoc.data[0].role : 'user'

  const doc = await db.collection('tutorials').doc(id).get()
  if (!doc.data) return { success: false, errMsg: '教程不存在' }

  if (role === 'admin') {
    await db.collection('tutorials').doc(id).remove()
    return { success: true }
  }

  if (role === 'uploader' && doc.data._openid === OPENID) {
    await db.collection('tutorials').doc(id).remove()
    return { success: true }
  }

  return { success: false, errMsg: '无权限删除' }
}
