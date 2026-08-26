import { useCallback, useState } from 'react'
import { View } from 'react-native'

import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import { createStyle } from '@/utils/tools'
import { type SettingScreenIds } from '../Main'
import Header from './Header'
import Main from './Main'
import NavList from './NavList'

/**
 * 竖屏设置：先分组列表，再进入对应子页。
 * 音源管理已有独立页面，入口直接跳转，避免多一层空壳。
 */
export default () => {
  const [activeId, setActiveId] = useState<SettingScreenIds | null>(null)

  const openScreen = useCallback((id: SettingScreenIds) => {
    if (id == 'source') {
      const componentId = commonState.componentIds.home
      if (componentId) navigations.pushSourceManagerScreen(componentId)
      return
    }
    global.lx.settingActiveId = id
    setActiveId(id)
  }, [])

  const closeScreen = useCallback(() => {
    setActiveId(null)
  }, [])

  useBackHandler(useCallback(() => {
    if (!activeId) return false
    setActiveId(null)
    return true
  }, [activeId]))

  // 分组列表始终挂载（仅通过 display:none 隐藏），
  // 避免进入子页时卸载导致返回后滚动位置重置到顶部
  return (
    <View style={styles.container}>
      <View style={[styles.page, activeId ? styles.hidden : null]}>
        <NavList onChangeId={openScreen} />
      </View>
      {activeId
        ? (
            <View style={styles.page}>
              <Header id={activeId} onBack={closeScreen} />
              <Main id={activeId} />
            </View>
          )
        : null}
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  hidden: {
    // 隐藏但保持挂载，ScrollView 的滚动偏移得以保留
    display: 'none',
  },
})
