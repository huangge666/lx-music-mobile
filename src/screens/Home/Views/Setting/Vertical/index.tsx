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

  if (!activeId) return <NavList onChangeId={openScreen} />

  return (
    <View style={styles.container}>
      <Header id={activeId} onBack={closeScreen} />
      <Main id={activeId} />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
})
