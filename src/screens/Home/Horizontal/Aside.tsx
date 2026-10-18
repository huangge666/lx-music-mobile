import { memo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { confirmDialog, createStyle, exitApp as backHome } from '@/utils/tools'
import { isMainNavId, MAIN_NAV_MENUS, NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
import { exitApp, openLeaderboard, setNavActiveId } from '@/core/common'
import { BorderWidths } from '@/theme'
import GlassSurface from '@/components/common/GlassSurface'
import { useSettingValue } from '@/store/setting/hook'

/**
 * 横屏侧栏（Phase 6B）
 *
 * 横屏不再显示底部标签栏，主导航与辅助入口统一收进这一列：
 * 主标签在上，覆盖页入口（排行榜/下载/设置）在下，返回/退出固定在底部。
 * 玻璃材质只用于这块导航控制区；选中态用辅色柔光胶囊 + 辅色图标。
 */
const NAV_WIDTH = 68

/** 主标签之外仍需要入口的覆盖页；排行榜从浏览进入，这里同样先固定父级 */
const AUX_MENUS = NAV_MENUS.filter(menu => !isMainNavId(menu.id))

const styles = createStyle({
  container: {
    flexGrow: 0,
    borderRightWidth: BorderWidths.hairline,
    paddingBottom: 10,
    width: NAV_WIDTH,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 15,
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
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 12,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: BorderWidths.hairline,
    borderColor: 'transparent',
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
        <Icon name="logo" color={theme['c-primary']} size={22} />
      </View>
    </View>
  )
}

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

const MenuItem = ({ id, icon, onPress }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  const activeId = useNavActiveId()
  const theme = useTheme()
  const t = useI18n()
  const isActive = activeId == id
  // 三个主标签在侧栏里仍是「标签」，覆盖页与退出是普通按钮
  const isTab = isMainNavId(id)
  const label = id == 'nav_exit'
    ? t('nav_exit')
    : id == 'back_home'
      ? t('back_home')
      : t(id)

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
        <Icon name={icon} size={20} color={isActive ? theme['c-accent'] : theme['c-font-label']} />
      </View>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const theme = useTheme()
  const showBackBtn = useSettingValue('common.showBackBtn')
  const showExitBtn = useSettingValue('common.showExitBtn')

  const handlePress = (id: IdType) => {
    switch (id) {
      case 'nav_exit':
        void confirmDialog({
          message: global.i18n.t('exit_app_tip'),
          confirmButtonText: global.i18n.t('list_remove_tip_button'),
        }).then(isExit => {
          if (!isExit) return
          exitApp('Exit Btn')
        })
        return
      case 'back_home':
        backHome()
        return
    }

    global.app_event.changeMenuVisible(false)
    // 排行榜是浏览的覆盖页，从侧栏进入同样先固定父级
    if (id == 'nav_top') {
      openLeaderboard()
    } else {
      setNavActiveId(id)
    }
  }

  return (
    <GlassSurface highlight="none" style={{ ...styles.container, borderRightColor: theme['c-border-background'] }}>
      <Header />
      <ScrollView style={styles.menus}>
        <View style={styles.list}>
          {MAIN_NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </View>
        <View style={[styles.divider, { backgroundColor: theme['c-border-background'] }]} />
        <View style={styles.list}>
          {AUX_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </View>
      </ScrollView>
      {
        showBackBtn || showExitBtn
          ? <View style={[styles.divider, { backgroundColor: theme['c-border-background'] }]} />
          : null
      }
      {
        showBackBtn ? <MenuItem id="back_home" icon="home" onPress={handlePress} /> : null
      }
      {
        showExitBtn ? <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} /> : null
      }
    </GlassSurface>
  )
})
