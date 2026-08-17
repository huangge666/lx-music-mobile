import { useRef } from 'react'
import { ScrollView, View } from 'react-native'
import NavList from './NavList'
import Main, { type MainType } from '../Main'
import { createStyle } from '@/utils/tools'
import { BorderWidths } from '@/theme'
import { useTheme } from '@/store/theme/hook'
import { useBgPic } from '@/store/common/hook'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  nav: {
    height: '100%',
    width: '22%',
    borderRightWidth: BorderWidths.hairline,
  },
  main: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 16,
    paddingBottom: 48,
    flex: 0,
  },
})

export default () => {
  const theme = useTheme()
  const hasDynamicBg = useBgPic() != null
  const mainBackgroundColor = hasDynamicBg ? 'transparent' : theme['c-card-background']
  const navBackgroundColor = hasDynamicBg ? theme['c-glass-background'] : theme['c-content-background']
  const mainRef = useRef<MainType>(null)

  return (
    <View style={{ ...styles.container, backgroundColor: mainBackgroundColor }}>
      <View style={{ ...styles.nav, borderRightColor: theme['c-border-background'], backgroundColor: navBackgroundColor }}>
        <NavList onChangeId={(id) => mainRef.current?.setActiveId(id)} />
      </View>
      <ScrollView keyboardShouldPersistTaps={'always'} style={{ backgroundColor: mainBackgroundColor }}>
        <View style={styles.main}>
          <Main ref={mainRef} />
        </View>
      </ScrollView>
    </View>
  )
}
