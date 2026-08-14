import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { NAV_MENUS } from '@/config/constant'
import { setNavActiveId } from '@/core/common'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'

interface BarItemProps {
  id: typeof NAV_MENUS[number]['id']
  icon: typeof NAV_MENUS[number]['icon']
}

/**
 * Apple Music 风格底部 Tab 项
 * 选中态：主色图标 + 主色文字
 * 默认态：灰色图标 + 灰色文字
 */
const BarItem = ({ id, icon }: BarItemProps) => {
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
      style={styles.item}
      onPress={handlePress}
      activeOpacity={0.6}
    >
      <Icon
        name={icon}
        size={22}
        color={isActive ? theme['c-primary'] : theme['c-font-label']}
      />
      <Text
        style={styles.label}
        size={10}
        color={isActive ? theme['c-primary'] : theme['c-font-label']}
        numberOfLines={1}
      >
        {t(id)}
      </Text>
    </TouchableOpacity>
  )
}

/**
 * Apple Music 风格底部导航栏
 * — 毛玻璃半透明背景
 * — 无顶部边框（使用极细 separator）
 * — 图标 + 文字垂直排列
 */
export default memo(() => {
  const theme = useTheme()
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme['c-glass-background'],
        borderTopColor: theme['c-border-background'],
      },
    ]}>
      {NAV_MENUS.map(item => <BarItem key={item.id} id={item.id} icon={item.icon} />)}
    </View>
  )
})

const styles = createStyle({
  container: {
    borderTopWidth: 0.5,
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingTop: 6,
    // iOS safe area 底部间距由系统自动处理
    paddingBottom: 2,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    minHeight: 48,
    marginHorizontal: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 3,
    fontWeight: '500',
  },
})
