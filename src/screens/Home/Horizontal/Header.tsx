import { View } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { useSettingValue } from '@/store/setting/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'
import { BorderWidths } from '@/theme'

const headerComponents: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_search: <SearchTypeSelector />,
}

const HEADER_HEIGHT = _HEADER_HEIGHT * 0.8

/**
 * Apple Music iPad 风格 Header
 *
 * — 毛玻璃半透明背景
 * — 18pt 粗体大标题
 * — 极细底部分隔线
 */
const LeftHeader = () => {
  const theme = useTheme()
  const id = useNavActiveId()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: theme['c-glass-background'],
      borderBottomColor: theme['c-border-background'],
      borderBottomWidth: BorderWidths.hairline,
    }}>
      <View style={styles.left}>
        {/* Apple Music 风格大标题 — 18pt 粗体 */}
        <Text style={styles.leftTitle} size={18} color={theme['c-font']}>{t(id)}</Text>
      </View>
      {headerComponents[id] ?? null}
    </View>
  )
}


const RightHeader = () => {
  const theme = useTheme()
  const t = useI18n()
  const id = useNavActiveId()
  const statusBarHeight = useStatusbarHeight()

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: theme['c-glass-background'],
      borderBottomColor: theme['c-border-background'],
      borderBottomWidth: BorderWidths.hairline,
    }}>
      <View style={styles.left}>
        <Text style={styles.rightTitle} size={18} color={theme['c-font']}>{t(id)}</Text>
      </View>
      {headerComponents[id] ?? null}
    </View>
  )
}

const Header = () => {
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

  return (
    <>
      <StatusBar />
      {
        drawerLayoutPosition == 'left'
          ? <LeftHeader />
          : <RightHeader />
      }
    </>
  )
}


const styles = createStyle({
  container: {
    paddingRight: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 5,
    alignItems: 'center',
    height: '100%',
  },
  btn: {
    width: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  titleBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  // Apple Music 风格大标题 — 粗体
  leftTitle: {
    paddingLeft: 10,
    paddingRight: 16,
    fontWeight: '700',
  },
  rightTitle: {
    paddingLeft: 16,
    paddingRight: 16,
    fontWeight: '700',
  },
})

export default Header
