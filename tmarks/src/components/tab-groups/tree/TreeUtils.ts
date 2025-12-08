import type { TabGroup } from '@/lib/types'

/**
 * 构建树形结构
 */
export function buildTree(groups: TabGroup[]): TabGroup[] {
  const groupMap = new Map<string, TabGroup>()
  const rootGroups: TabGroup[] = []

  // 第一遍：创建映射并初始化 children
  groups.forEach(group => {
    groupMap.set(group.id, { ...group, children: [] })
  })

  // 第二遍：构建父子关系
  groups.forEach(group => {
    const node = groupMap.get(group.id)!
    if (group.parent_id) {
      const parent = groupMap.get(group.parent_id)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      } else {
        // 父节点不存在，作为根节点
        rootGroups.push(node)
      }
    } else {
      rootGroups.push(node)
    }
  })

  // 按 position 排序所有层级
  const sortByPosition = (nodes: TabGroup[]) => {
    nodes.sort((a, b) => (a.position || 0) - (b.position || 0))
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortByPosition(node.children)
      }
    })
  }

  sortByPosition(rootGroups)
  return rootGroups
}
