import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { useI18n } from '@/lang'
import ActionSheet, { type ActionSheetType } from '@/components/common/ActionSheet'

export interface SelectInfo {
  listId: string
  name: string
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
  onPlay: (selectInfo: SelectInfo) => void
  onCollect: (selectInfo: SelectInfo) => void
  onHideMenu: () => void
}

export interface ListMenuType {
  show: (selectInfo: SelectInfo, position?: Position) => void
}

const initSelectInfo = {}

export default forwardRef<ListMenuType, ListMenuProps>((props, ref) => {
  const t = useI18n()
  const actionSheetRef = useRef<ActionSheetType>(null)
  const selectInfoRef = useRef<SelectInfo>(initSelectInfo as SelectInfo)

  useImperativeHandle(ref, () => ({
    show(selectInfo) {
      selectInfoRef.current = selectInfo
      actionSheetRef.current?.show({
        header: {
          title: selectInfo.name,
          subtitle: t('nav_top'),
          icon: 'leaderboard',
        },
        items: [
          { action: 'play', label: t('play'), icon: 'play' },
          { action: 'collect', label: t('collect'), icon: 'love' },
        ],
      })
    },
  }), [t])

  const handleMenuPress = useCallback((action: string) => {
    const selectInfo = selectInfoRef.current
    switch (action) {
      case 'play':
        props.onPlay(selectInfo)
        break
      case 'collect':
        props.onCollect(selectInfo)
        break
      default:
        break
    }
  }, [props])

  return <ActionSheet ref={actionSheetRef} onPress={handleMenuPress} onHide={props.onHideMenu} />
})
