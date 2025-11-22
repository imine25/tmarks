/**
 * 清理孤立的快照记录
 * 删除 D1 中存在但 R2 文件已被删除的快照记录
 */

import { createClient } from '@libsql/client'

const DB_URL = process.env.DATABASE_URL
const DB_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN

if (!DB_URL || !DB_AUTH_TOKEN) {
  console.error('❌ 缺少环境变量: DATABASE_URL 或 DATABASE_AUTH_TOKEN')
  console.log('请在 .env 文件中设置这些变量')
  process.exit(1)
}

const db = createClient({
  url: DB_URL,
  authToken: DB_AUTH_TOKEN,
})

async function cleanupOrphanedSnapshots() {
  console.log('🔍 开始检查孤立的快照记录...\n')

  try {
    // 获取所有快照记录
    const { rows: snapshots } = await db.execute(
      'SELECT id, bookmark_id, r2_key, user_id FROM bookmark_snapshots'
    )

    console.log(`📊 找到 ${snapshots.length} 条快照记录\n`)

    if (snapshots.length === 0) {
      console.log('✅ 没有快照记录需要检查')
      return
    }

    // 注意：这个脚本只能删除 D1 记录
    // 无法直接访问 R2 来验证文件是否存在
    // 你需要手动确认哪些记录需要删除

    console.log('⚠️  警告：此脚本无法直接访问 R2 验证文件')
    console.log('请手动检查以下快照记录，确认哪些需要删除：\n')

    // 按书签分组统计
    const bookmarkGroups = new Map()
    for (const snapshot of snapshots) {
      const bookmarkId = snapshot.bookmark_id
      if (!bookmarkGroups.has(bookmarkId)) {
        bookmarkGroups.set(bookmarkId, [])
      }
      bookmarkGroups.get(bookmarkId).push(snapshot)
    }

    console.log('📋 按书签分组的快照统计：\n')
    for (const [bookmarkId, snaps] of bookmarkGroups) {
      console.log(`书签 ${bookmarkId}: ${snaps.length} 个快照`)
      snaps.forEach((snap, index) => {
        console.log(`  ${index + 1}. ID: ${snap.id}`)
        console.log(`     R2 Key: ${snap.r2_key}`)
      })
      console.log()
    }

    console.log('\n💡 如果要删除特定快照记录，请使用以下 SQL：')
    console.log("   DELETE FROM bookmark_snapshots WHERE id = 'snapshot_id';")
    console.log('\n💡 如果要删除某个书签的所有快照：')
    console.log("   DELETE FROM bookmark_snapshots WHERE bookmark_id = 'bookmark_id';")
    console.log('\n💡 删除后记得更新书签表：')
    console.log('   UPDATE bookmarks SET snapshot_count = 0, has_snapshot = 0, latest_snapshot_at = NULL WHERE id = ?;')

  } catch (error) {
    console.error('❌ 错误:', error)
    process.exit(1)
  }
}

// 如果提供了快照 ID 参数，直接删除
const snapshotIdToDelete = process.argv[2]

if (snapshotIdToDelete) {
  console.log(`🗑️  删除快照记录: ${snapshotIdToDelete}\n`)
  
  db.execute({
    sql: 'DELETE FROM bookmark_snapshots WHERE id = ?',
    args: [snapshotIdToDelete]
  })
    .then(() => {
      console.log('✅ 快照记录已删除')
      console.log('⚠️  请手动更新对应书签的 snapshot_count')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 删除失败:', error)
      process.exit(1)
    })
} else {
  cleanupOrphanedSnapshots()
    .then(() => {
      console.log('\n✅ 检查完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 失败:', error)
      process.exit(1)
    })
}
