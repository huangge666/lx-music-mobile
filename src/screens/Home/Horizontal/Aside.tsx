import { memo } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { isMainNavId, MAIN_NAV_MENUS, NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
import { setNavActiveId } from '@/core/common'
import { BorderWidths } from '@/theme'
import GlassSurface from '@/components/common/GlassSurface'
import Text from '@/components/common/Text'

/**
 * 横屏侧栏承载四个核心页面与设置，避免重复的底部导航。
 */
const NAV_WIDTH = 80

/** 唯一辅助入口是设置。 */
const AUX_MENUS = NAV_MENUS.filter(menu => !isMainNavId(menu.id))

// 侧栏触控几何使用 dp；字号只放大文字，不再把整列操作区一起放大。
const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    borderRightWidth: BorderWidths.hairline,
    paddingBottom: 10,
    minWidth: NAV_WIDTH,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menus: {
    flex: 1,
  },
  list: {
    paddingBottom: 8,
  },
  divider: {
    height: BorderWidths.hairline,
    marginHorizontal: 14,
    marginBottom: 8,
  },
  menuItem: {
    paddingTop: 6,
    paddingBottom: 6,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: BorderWidths.hairline,
    borderColor: 'transparent',
    minHeight: 64,
    flexDirection: 'column',
    gap: 4,
  },
  iconContent: {
    alignItems: 'center',
  },
})

const Header = () => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight }}>
      <View style={styles.header}>
        <Icon name="logo" color={theme['c-primary']} rawSize={22} />
      </View>
    </View>
  )
}

type IdType = InitState['navActiveId']

const MenuItem = ({ id, icon, onPress }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  const activeId = useNavActiveId()
  const theme = useTheme()
  const t = useI18n()
  const isActive = activeId == id
  // 四个核心页面是标签，设置是普通按钮。
  const isTab = isMainNavId(id)
  const label = t(id)

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        isActive
          ? { backgroundColor: theme['c-accent-soft'], borderColor: theme['c-border-background'] }
          : null,
      ]}
      onPress={() => { onPress(id) }}
      activeOpacity={0.6}
      accessibilityRole={isTab ? 'tab' : 'button'}
      accessibilityLabel={label}
      accessibilityState={isTab ? { selected: isActive } : undefined}
    >
      <View style={styles.iconContent}>
        <Icon name={icon} rawSize={22} color={isActive ? theme['c-accent'] : theme['c-font-label']} />
      </View>
      <Text size={10} numberOfLines={1} color={isActive ? theme['c-accent'] : theme['c-font-label']}>{label}</Text>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const theme = useTheme()
  const handlePress = (id: IdType) => {
    setNavActiveId(id)
  }

  return (
    <GlassSurface highlight="none" style={{ ...styles.container, borderRightColor: theme['c-border-background'] }}>
      <Header />
      <ScrollView style={styles.menus}>
        <View style={styles.list}>
          {MAIN_NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </View>
      </ScrollView>
      {/* 大字号横屏允许标签滚动，但设置固定在侧栏底部，不能被滚动区裁掉。 */}
      <View style={[styles.divider, { backgroundColor: theme['c-border-background'] }]} />
      <View style={styles.list}>
        {AUX_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
      </View>
    </GlassSurface>
  )
})
