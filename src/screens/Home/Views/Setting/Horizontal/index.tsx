import { View } from 'react-native'
import NavList from './NavList'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
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
  const theme = useTheme()

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-card-background'] }}>
      <View style={{ ...styles.nav, backgroundColor: theme['c-content-background'] }}>
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
