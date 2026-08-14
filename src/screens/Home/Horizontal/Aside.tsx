import { memo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { confirmDialog, createStyle, exitApp as backHome } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import { BorderWidths } from '@/theme'
import { useSettingValue } from '@/store/setting/hook'

/**
 * Apple Music iPad 风格侧边栏导航
 *
 * 视觉特征：
 * — 毛玻璃半透明背景
 * — 图标居中的窄侧边栏（68pt）
 * — 选中态使用主色高亮 + 圆角背景
 * — Logo 居顶
 * — 极细分隔线右侧
 */
const NAV_WIDTH = 68

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
  headerText: {
    textAlign: 'center',
    marginLeft: 16,
  },
  menus: {
    flex: 1,
  },
  list: {
    paddingBottom: 15,
  },
  // Apple Music 风格菜单项 — 圆角选中态容器
  menuItem: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 12,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  iconContent: {
    alignItems: 'center',
  },
  text: {
    paddingLeft: 15,
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
  const isActive = activeId == id

  return isActive
    ? <View style={{ ...styles.menuItem, backgroundColor: theme['c-primary-background'] }}>
        <View style={styles.iconContent}>
          <Icon name={icon} size={20} color={theme['c-primary-font-active']} />
        </View>
      </View>
    : <TouchableOpacity style={styles.menuItem} onPress={() => { onPress(id) }} activeOpacity={0.6}>
        <View style={styles.iconContent}>
          <Icon name={icon} size={20} color={theme['c-font-label']} />
        </View>
      </TouchableOpacity>
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
    setNavActiveId(id)
  }

  return (
    <View style={{ ...styles.container, borderRightColor: theme['c-border-background'], backgroundColor: theme['c-glass-background'] }}>
      <Header />
      <ScrollView style={styles.menus}>
        <View style={styles.list}>
          {NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </View>
      </ScrollView>
      {
        showBackBtn ? <MenuItem id="back_home" icon="home" onPress={handlePress} /> : null
      }
      {
        showExitBtn ? <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} /> : null
      }
    </View>
  )
})
