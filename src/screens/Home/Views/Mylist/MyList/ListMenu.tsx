import { useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import {
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  StyleSheet,
} from 'react-native'
import { useI18n } from '@/lang'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import musicSdk from '@/utils/musicSdk'
import listState from '@/store/list/state'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { BorderRadius, BorderWidths } from '@/theme'

export interface SelectInfo {
  listInfo: LX.List.MyListInfo
  index: number
}

export interface Position {
  w: number
  h: number
  x: number
  y: number
  menuWidth?: number
  menuHeight?: number
}

export interface ListMenuProps {
  onNew: (position: number) => void
  onRename: (listInfo: LX.List.UserListInfo) => void
  onSort: (listInfo: LX.List.MyListInfo) => void
  onDuplicateMusic: (listInfo: LX.List.MyListInfo) => void
  onImport: (listInfo: LX.List.MyListInfo, index: number) => void
  onExport: (listInfo: LX.List.MyListInfo, index: number) => void
  onSync: (listInfo: LX.List.UserListInfo) => void
  onSelectLocalFile: (listInfo: LX.List.MyListInfo, index: number) => void
  onRemove: (listInfo: LX.List.UserListInfo) => void
}

export interface ListMenuType {
  show: (selectInfo: SelectInfo, position?: Position) => void
  hide?: () => void
}

interface MenuItemData {
  action: string
  label: string
  icon: string
  disabled?: boolean
  danger?: boolean
}

const getPlaylistIcon = (id?: string) => {
  switch (id) {
    case LIST_IDS.LOVE:
      return 'love'
    case LIST_IDS.DEFAULT:
      return 'play-outline'
    default:
      return 'album'
  }
}

const SCREEN_HEIGHT = Dimensions.get('window').height
const ANIMATION_DURATION = 260
const DANGER_COLOR = '#FF453A'

export default forwardRef<ListMenuType, ListMenuProps>(({
  onNew,
  onRename,
  onSort,
  onDuplicateMusic,
  onImport,
  onExport,
  onSync,
  onSelectLocalFile,
  onRemove,
}, ref) => {
  const t = useI18n()
  const theme = useTheme()

  const [visible, setVisible] = useState(false)
  const [currentSelectInfo, setCurrentSelectInfo] = useState<SelectInfo | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([])

  const animValue = useRef(new Animated.Value(0)).current
  const selectInfoRef = useRef<SelectInfo | null>(null)

  const buildMenuItems = useCallback((listInfo: LX.List.MyListInfo) => {
    let rename = false
    let sync = false
    let remove = false
    const localFile = !listState.fetchingListStatus[listInfo.id]
    let userList: LX.List.UserListInfo

    switch (listInfo.id) {
      case LIST_IDS.DEFAULT:
      case LIST_IDS.LOVE:
        break
      default:
        userList = listInfo as LX.List.UserListInfo
        rename = true
        remove = true
        sync = !!(userList.source && musicSdk[userList.source]?.songList)
        break
    }

    const items: MenuItemData[] = [
      { action: 'new', label: t('list_create'), icon: 'add_folder' },
      { action: 'rename', disabled: !rename, label: t('list_rename'), icon: 'slider' },
      { action: 'sort', label: t('list_sort'), icon: 'list-order' },
      { action: 'duplicateMusic', label: t('lists__duplicate'), icon: 'music_time' },
      { action: 'local_file', disabled: !localFile, label: t('list_select_local_file'), icon: 'sd-card' },
      { action: 'sync', disabled: !sync || !localFile, label: t('list_sync'), icon: 'available_updates' },
      { action: 'import', label: t('list_import'), icon: 'download-2' },
      { action: 'export', label: t('list_export'), icon: 'share' },
      { action: 'remove', disabled: !remove, label: t('list_remove'), icon: 'remove', danger: true },
    ]

    return items
  }, [t])

  const openDrawer = useCallback(() => {
    setVisible(true)
    animValue.setValue(0)
    Animated.spring(animValue, {
      toValue: 1,
      useNativeDriver: true,
      damping: 24,
      mass: 0.8,
      stiffness: 260,
    }).start()
  }, [animValue])

  const closeDrawer = useCallback((onFinished?: () => void) => {
    Animated.timing(animValue, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.36, 0.66, 0.04, 1),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false)
      if (onFinished) onFinished()
    })
  }, [animValue])

  useImperativeHandle(ref, () => ({
    show(selectInfo: SelectInfo) {
      selectInfoRef.current = selectInfo
      setCurrentSelectInfo(selectInfo)
      setMenuItems(buildMenuItems(selectInfo.listInfo))
      openDrawer()
    },
    hide() {
      closeDrawer()
    },
  }), [buildMenuItems, closeDrawer, openDrawer])

  const handleAction = useCallback((action: string) => {
    const info = selectInfoRef.current
    if (!info) return

    closeDrawer(() => {
      switch (action) {
        case 'new':
          onNew(Math.max(info.index - 1, 0))
          break
        case 'rename':
          onRename(info.listInfo as LX.List.UserListInfo)
          break
        case 'sort':
          onSort(info.listInfo)
          break
        case 'duplicateMusic':
          onDuplicateMusic(info.listInfo)
          break
        case 'import':
          onImport(info.listInfo, info.index)
          break
        case 'export':
          onExport(info.listInfo, info.index)
          break
        case 'sync':
          onSync(info.listInfo as LX.List.UserListInfo)
          break
        case 'local_file':
          onSelectLocalFile(info.listInfo, info.index)
          break
        case 'remove':
          onRemove(info.listInfo as LX.List.UserListInfo)
          break
        default:
          break
      }
    })
  }, [closeDrawer, onDuplicateMusic, onExport, onImport, onNew, onRemove, onRename, onSelectLocalFile, onSort, onSync])

  if (!visible) return null

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  })

  const sheetTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.7, 0],
  })

  const isLove = currentSelectInfo?.listInfo.id === LIST_IDS.LOVE
  const headerCoverBg = isLove ? theme['c-primary-background'] : theme['c-card-background']
  const headerCoverColor = isLove ? theme['c-primary'] : theme['c-font-label']

  return (
    <Modal
      transparent
      hardwareAccelerated
      statusBarTranslucent
      visible={visible}
      animationType="none"
      onRequestClose={() => {
        closeDrawer()
      }}
    >
      <View style={styles.modalRoot}>
        {/* 半透明遮罩，点击即收起抽屉 */}
        <TouchableWithoutFeedback onPress={() => { closeDrawer() }}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        {/* 底部沉浸式抽屉容器（覆盖全屏下半部，盖住 tabbar 和小播放器） */}
        <Animated.View
          style={[
            styles.drawerSheet,
            {
              backgroundColor: theme['c-content-background'],
              borderColor: theme['c-border-background'],
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* 抽屉顶部拉条指示器 */}
          <View style={styles.grabberContainer}>
            <View style={[styles.grabber, { backgroundColor: theme['c-font-label'], opacity: 0.3 }]} />
          </View>

          {/* 歌单信息头部 */}
          <View style={[styles.header, { borderBottomColor: theme['c-border-background'] }]}>
            <View style={[styles.headerCover, { backgroundColor: headerCoverBg }]}>
              <Icon
                name={getPlaylistIcon(currentSelectInfo?.listInfo.id)}
                size={20}
                color={headerCoverColor}
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} size={16} color={theme['c-font']} numberOfLines={1}>
                {currentSelectInfo?.listInfo.name ?? ''}
              </Text>
              <Text size={12} color={theme['c-font-label']} numberOfLines={1}>
                {isLove ? t('list_name_love') : currentSelectInfo?.listInfo.id === LIST_IDS.DEFAULT ? t('list_name_default') : t('list_more_menu_subtitle', { defaultValue: '歌单更多操作' })}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme['c-card-background'] }]}
              activeOpacity={0.7}
              onPress={() => {
                closeDrawer()
              }}
            >
              <Icon name="close" size={13} color={theme['c-font-label']} />
            </TouchableOpacity>
          </View>

          {/* 更多操作选项列表 */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={[styles.menuGroup, { backgroundColor: theme['c-card-background'] }]}>
              {menuItems.map((item, index) => {
                const isLast = index === menuItems.length - 1
                const itemColor = item.danger
                  ? DANGER_COLOR
                  : item.disabled
                    ? theme['c-font-label']
                    : theme['c-font']
                const iconColor = item.danger
                  ? DANGER_COLOR
                  : item.disabled
                    ? theme['c-font-label']
                    : theme['c-primary']

                return (
                  <TouchableOpacity
                    key={item.action}
                    style={[
                      styles.menuItem,
                      !isLast && { borderBottomWidth: BorderWidths.hairline, borderBottomColor: theme['c-border-background'] },
                      item.disabled && styles.menuItemDisabled,
                    ]}
                    activeOpacity={item.disabled ? 1 : 0.6}
                    onPress={() => {
                      if (!item.disabled) handleAction(item.action)
                    }}
                  >
                    <View
                      style={[
                        styles.menuIconBox,
                        {
                          backgroundColor: item.danger
                            ? 'rgba(255, 69, 58, 0.12)'
                            : item.disabled
                              ? 'transparent'
                              : theme['c-primary-background'],
                        },
                      ]}
                    >
                      <Icon name={item.icon} size={16} color={iconColor} />
                    </View>
                    <Text
                      style={[
                        styles.menuText,
                        item.danger && styles.menuTextDanger,
                      ]}
                      size={15}
                      color={itemColor}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    <Icon
                      name="chevron-right"
                      size={12}
                      color={theme['c-font-label']}
                      style={[styles.chevron, item.disabled && { opacity: 0.3 }]}
                    />
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
})

const styles = createStyle({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  drawerSheet: {
    width: '100%',
    maxHeight: '82%',
    borderTopLeftRadius: BorderRadius.xlarge,
    borderTopRightRadius: BorderRadius.xlarge,
    borderTopWidth: BorderWidths.hairline,
    paddingBottom: 28,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  grabberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: BorderWidths.hairline,
  },
  headerCover: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    marginBottom: 3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  menuScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  menuScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  menuGroup: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 14,
  },
  menuItemDisabled: {
    opacity: 0.4,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontWeight: '500',
  },
  menuTextDanger: {
    fontWeight: '600',
  },
  chevron: {
    opacity: 0.6,
  },
})
