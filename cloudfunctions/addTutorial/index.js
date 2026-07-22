// 新增教程（带角色校验）
// 仅「上传者」与「管理员」可调用；普通用户无权限。
// 服务端写入，自动记录 _openid 便于「上传者只能删自己」。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const roleDoc = await db.collection('roles').where({ _openid: OPENID }).get()
  const role = (roleDoc.data && roleDoc.data.length > 0) ? roleDoc.data[0].role : 'user'

  if (role !== 'uploader' && role !== 'admin') {
    return { success: false, errMsg: '无权限上传，仅上传者/管理员可发布教程' }
  }

  const tutorial = event.tutorial || {}
  if (!tutorial.title) {
    return { success: false, errMsg: '标题不能为空' }
  }
  if (tutorial.id) tutorial._id = tutorial.id   // 保持详情页可按 id 查询（_id == id）
  tutorial._openid = OPENID
  tutorial.createdAt = Date.now()

  const res = await db.collection('tutorials').add({ data: tutorial })
  return { success: true, _id: res._id }
}
