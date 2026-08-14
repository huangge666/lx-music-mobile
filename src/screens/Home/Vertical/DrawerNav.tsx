import { memo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useI18n } from '@/lang'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { confirmDialog, createStyle, exitApp as backHome } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import { BorderRadius } from '@/theme'

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingLeft: 24,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    fontWeight: '700',
  },
  menus: {
    flex: 1,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  /**
   * Apple Music 风格菜单项
   * — 圆角矩形 (radius 12)
   * — 选中态：主色浅底 + 主色文字
   * — 默认态：透明底 + 默认文字色
   */
  menuItem: {
    flexDirection: 'row',
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    marginVertical: 1,
  },
  iconContent: {
    width: 28,
    alignItems: 'center',
  },
  text: {
    paddingLeft: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  // 底部操作区
  footer: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    borderTopWidth: 0,
  },
})

/**
 * Apple Music 风格侧边栏头部
 * Logo + 应用名，左对齐
 */
const Header = () => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight, backgroundColor: 'transparent' }}>
      <View style={styles.header}>
        <Icon name="logo" color={theme['c-primary']} size={30} />
        <Text style={styles.headerText} size={26} color={theme['c-font']}>LX Music</Text>
      </View>
    </View>
  )
}

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

/**
 * 菜单项 — Apple Music 风格圆角选中态
 */
const MenuItem = ({ id, icon, onPress }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  const t = useI18n()
  const activeId = useNavActiveId()
  const theme = useTheme()
  const isActive = activeId == id

  if (isActive) {
    return (
      <View style={{ ...styles.menuItem, backgroundColor: theme['c-primary-background-hover'] }}>
        <View style={styles.iconContent}>
          <Icon name={icon} size={20} color={theme['c-primary']} />
        </View>
        <Text style={styles.text} color={theme['c-primary']}>{t(id)}</Text>
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => { onPress(id) }}
      activeOpacity={0.6}
    >
      <View style={styles.iconContent}>
        <Icon name={icon} size={20} color={theme['c-font-label']} />
      </View>
      <Text style={styles.text} color={theme['c-font']}>{t(id)}</Text>
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
    setNavActiveId(id)
  }


  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-glass-background'] }}>
      <Header />
      <ScrollView style={styles.menus}>
        <View style={styles.list}>
          {NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {showBackBtn ? <MenuItem id="back_home" icon="home" onPress={handlePress} /> : null}
        {showExitBtn ? <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} /> : null}
      </View>
    </View>
  )
})
