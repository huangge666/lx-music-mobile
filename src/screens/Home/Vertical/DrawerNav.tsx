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
import { BorderRadius, BorderWidths } from '@/theme'
import versionState from '@/store/version/state'

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  // 品牌 Logo 瓷贴：主色底 + 白色 Logo，作为侧栏的视觉锚点
  logoTile: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 14,
    justifyContent: 'center',
  },
  headerName: {
    fontWeight: '700',
  },
  headerVersion: {
    marginTop: 2,
  },
  // 头部与菜单之间的发丝级分隔线，保持内容呼吸感
  divider: {
    height: BorderWidths.hairline,
    marginLeft: 16,
    marginRight: 16,
  },
  menus: {
    flex: 1,
  },
  list: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  /**
   * 菜单项 — 胶囊行 + 图标瓷贴
   * — 圆角矩形 (radius medium)
   * — 选中态：主色浅底 + 发丝级玻璃描边 + 主色图标瓷贴 + 尾部箭头
   * — 默认态：透明底 + 次要色图标
   */
  menuItem: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    marginVertical: 3,
    borderWidth: BorderWidths.hairline,
    borderColor: 'transparent',
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    paddingLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
  },
})

/**
 * 侧边栏品牌头部
 * 主色 Logo 瓷贴 + 应用名 + 版本号副标签
 */
const Header = () => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight }}>
      <View style={styles.header}>
        <View style={{ ...styles.logoTile, backgroundColor: theme['c-primary'] }}>
          <Icon name="logo" color="rgb(255, 255, 255)" size={22} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} size={20} color={theme['c-font']}>LX Music</Text>
          <Text style={styles.headerVersion} size={11} color={theme['c-font-label']}>
            v{versionState.versionInfo.version}
          </Text>
        </View>
      </View>
      <View style={{ ...styles.divider, backgroundColor: theme['c-border-background'] }} />
    </View>
  )
}

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

/**
 * 菜单项 — 胶囊行选中态
 * 图标瓷贴在选中时切换为主色底白图标，形成纵向导航的焦点指示
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

  const content = isActive
    ? (
      <>
        <View style={{ ...styles.iconTile, backgroundColor: theme['c-primary'] }}>
          <Icon name={icon} size={17} color="rgb(255, 255, 255)" />
        </View>
        <Text style={{ ...styles.text, fontWeight: '600' }} color={theme['c-primary']}>{t(id)}</Text>
        <Icon name="chevron-right" size={13} color={theme['c-primary-alpha-500']} />
      </>
      )
    : (
      <>
        <View style={styles.iconTile}>
          <Icon name={icon} size={17} color={theme['c-font-label']} />
        </View>
        <Text style={styles.text} color={theme['c-font']}>{t(id)}</Text>
      </>
      )

  if (isActive) {
    return (
      <View
        style={{
          ...styles.menuItem,
          backgroundColor: theme['c-primary-alpha-800'],
          borderColor: theme['c-glass-border'],
        }}
      >
        {content}
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => { onPress(id) }}
      activeOpacity={0.6}
    >
      {content}
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


  const drawerBg = theme.isDark ? 'rgba(16, 18, 27, 0.98)' : 'rgba(255, 255, 255, 0.98)'

  return (
    <View style={{ ...styles.container, backgroundColor: drawerBg }}>
      <Header />
      <ScrollView style={styles.menus}>
        <View style={styles.list}>
          {NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </View>
      </ScrollView>

      <View style={{ ...styles.footer, borderTopWidth: BorderWidths.hairline, borderTopColor: theme['c-border-background'] }}>
        {showBackBtn ? <MenuItem id="back_home" icon="home" onPress={handlePress} /> : null}
        {showExitBtn ? <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} /> : null}
      </View>
    </View>
  )
})
