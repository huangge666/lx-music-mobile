import { View } from 'react-native'
import NavList from './NavList'
import { createStyle } from '@/utils/tools'
import commonState from '@/store/common/state'
import { navigations } from '@/navigation'

const styles = createStyle({
  container: {
    flex: 1,
  },
  nav: {
    height: '100%',
    width: '100%',
  },
})

export default () => {
  return (
    <View style={{ ...styles.container, backgroundColor: 'transparent' }}>
      <View style={{ ...styles.nav, backgroundColor: 'transparent' }}>
        <NavList onChangeId={(id) => {
          const componentId = commonState.componentIds.home
          if (!componentId) return
          if (id == 'source') navigations.pushSourceManagerScreen(componentId)
          else navigations.pushSettingScreen(componentId, id)
        }} />
      </View>
    </View>
  )
}
