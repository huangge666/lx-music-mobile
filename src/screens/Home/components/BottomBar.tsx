import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { NAV_MENUS } from '@/config/constant'
import { setNavActiveId } from '@/core/common'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { createStyle, isAndroid } from '@/utils/tools'
import GlassSurface from '@/components/common/GlassSurface'

/** 底栏内容底边距。iOS 另有系统 Home Indicator；Android 需在栏内留出贴底安全距离。 */
const TAB_BAR_PADDING_BOTTOM = isAndroid ? 12 : 6
const TAB_BAR_MENUS = NAV_MENUS.filter(item => item.id != 'nav_download' && item.id != 'nav_setting')

interface BarItemProps {
  id: typeof NAV_MENUS[number]['id']
  icon: typeof NAV_MENUS[number]['icon']
  floating?: boolean
}

/**
 * 底栏页签：选中态用辅色胶囊，未选中只保留图标和文字。
 */
const BarItem = ({ id, icon, floating }: BarItemProps) => {
  const theme = useTheme()
  const t = useI18n()
  const activeId = useNavActiveId()
  const isActive = activeId == id

  /**
   * 切换底部导航页签。
   */
  const handlePress = () => {
    if (isActive) return
    setNavActiveId(id)
  }

  return (
    <TouchableOpacity
      style={[
        floating ? styles.floatItem : styles.item,
        isActive
          ? {
              backgroundColor: theme['c-accent-soft'],
            }
          : null,
      ]}
      onPress={handlePress}
      activeOpacity={0.6}
    >
      <Icon
        name={icon}
        size={floating ? 20 : 22}
        color={isActive ? theme['c-accent'] : theme['c-font-label']}
      />
      <Text
        style={styles.label}
        size={10}
        color={isActive ? theme['c-accent'] : theme['c-font-label']}
        numberOfLines={1}
      >
        {t(id)}
      </Text>
    </TouchableOpacity>
  )
}

/**
 * 底部导航。竖屏悬浮成胶囊，横屏仍贴底，避免和窄侧栏抢宽度。
 */
export default memo(({ floating = false }: { floating?: boolean }) => {
  const items = TAB_BAR_MENUS.map(item => <BarItem key={item.id} id={item.id} icon={item.icon} floating={floating} />)

  if (!floating) {
    return (
      <GlassSurface style={styles.container}>
        {items}
      </GlassSurface>
    )
  }

  return (
    <View style={styles.floatWrap}>
      <GlassSurface style={styles.floating}>
        {items}
      </GlassSurface>
    </View>
  )
})

const styles = createStyle({
  floatWrap: {
    paddingHorizontal: 18,
    paddingBottom: TAB_BAR_PADDING_BOTTOM,
  },
  floating: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 28,
    borderWidth: 0.5,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: TAB_BAR_PADDING_BOTTOM,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    minHeight: 48,
    marginHorizontal: 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatItem: {
    flex: 1,
    minHeight: 52,
    marginHorizontal: 2,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
    fontWeight: '600',
  },
})
