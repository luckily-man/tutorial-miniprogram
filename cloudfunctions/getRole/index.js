// 获取当前用户角色
// 校验/启动逻辑：
//   - 若 roles 集合已有当前 openid 的记录，直接返回其角色
//   - 若集合为空（第一个使用者），自动成为管理员
//   - 否则默认角色为「普通用户」（仅可查看）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const ROLE_COLLECTION = 'roles'

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { openid: '', role: 'user' }

  // 确保 roles 集合存在：未手动建表时也能正常分配首位管理员
  try {
    await db.createCollection(ROLE_COLLECTION)
  } catch (e) {
    // 集合已存在会抛错，忽略即可
  }

  const roles = db.collection(ROLE_COLLECTION)

  const existing = await roles.where({ _openid: OPENID }).get()
  if (existing.data && existing.data.length > 0) {
    return { openid: OPENID, role: existing.data[0].role }
  }

  // 新用户：集合为空则首位使用者为管理员，否则默认普通用户
  let role = 'user'
  try {
    const countRes = await roles.count()
    if (countRes.total === 0) role = 'admin'
  } catch (e) {
    role = 'user'
  }

  try {
    await roles.add({ data: { _openid: OPENID, role: role } }) // 云函数写入需显式指定 _openid
  } catch (e) {
    // 写入失败不影响返回，下次启动会重试
  }
  return { openid: OPENID, role: role }
}
