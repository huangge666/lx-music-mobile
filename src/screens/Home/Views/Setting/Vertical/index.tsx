import { useCallback } from 'react'
import { View } from 'react-native'

import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { type SettingScreenIds } from '../Main'
import NavList from './NavList'

/**
 * 竖屏设置目录。所有子页都通过原生导航栈打开，统一复用音源管理的
 * 独立页面壳、返回行为和系统返回手势。
 */
export default () => {
  const openScreen = useCallback((id: SettingScreenIds) => {
    const componentId = commonState.componentIds.home
    if (!componentId) return
    if (id == 'source') navigations.pushSourceManagerScreen(componentId)
    else navigations.pushSettingScreen(componentId, id)
  }, [])

  return (
    <View style={styles.container}>
      <NavList onChangeId={openScreen} />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
})
