import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { useI18n } from '@/lang'
import { LIST_IDS } from '@/config/constant'
import musicSdk from '@/utils/musicSdk'
import listState from '@/store/list/state'
import { useTheme } from '@/store/theme/hook'
import ActionSheet, { type ActionSheetItem, type ActionSheetType } from '@/components/common/ActionSheet'

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
  const actionSheetRef = useRef<ActionSheetType>(null)
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

    const items: ActionSheetItem[] = [
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

  useImperativeHandle(ref, () => ({
    show(selectInfo: SelectInfo) {
      selectInfoRef.current = selectInfo
      const isLove = selectInfo.listInfo.id === LIST_IDS.LOVE
      const isDefault = selectInfo.listInfo.id === LIST_IDS.DEFAULT
      actionSheetRef.current?.show({
        header: {
          title: selectInfo.listInfo.name,
          subtitle: isLove ? t('list_name_love') : isDefault ? t('list_name_default') : selectInfo.listInfo.name,
          icon: getPlaylistIcon(selectInfo.listInfo.id),
          iconBg: isLove ? theme['c-primary-background'] : theme['c-card-background'],
          iconColor: isLove ? theme['c-primary'] : theme['c-font-label'],
        },
        items: buildMenuItems(selectInfo.listInfo),
      })
    },
    hide() {
      actionSheetRef.current?.hide()
    },
  }), [buildMenuItems, t, theme])

  const handleAction = useCallback((action: string) => {
    const info = selectInfoRef.current
    if (!info) return

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
  }, [onDuplicateMusic, onExport, onImport, onNew, onRemove, onRename, onSelectLocalFile, onSort, onSync])

  return <ActionSheet ref={actionSheetRef} onPress={handleAction} />
})
