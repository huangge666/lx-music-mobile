import { useState, useRef, useCallback, useMemo, useContext, useLayoutEffect, createContext, forwardRef, useImperativeHandle, type ReactNode } from 'react'
import { Animated, View, TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { BorderRadius, BorderWidths } from '@/theme'
import { scaleSizeH } from '@/utils/pixelRatio'

export type SelectMode = 'single' | 'range'

export const MULTI_SELECT_BAR_HEIGHT = scaleSizeH(72)

const DANGER_COLOR = '#FF453A'

interface MultipleModeBarProps {
  onSwitchMode: (mode: SelectMode) => void
  onSelectAll: (isAll: boolean) => void
  onExitSelectMode: () => void
  onPlayLater?: () => void
  onAdd?: () => void
  onMove?: () => void
  onRemove?: () => void
}

export interface MultipleModeBarType {
  show: () => void
  setIsSelectAll: (isAll: boolean) => void
  setSelectedCount: (count: number) => void
  setSwitchMode: (mode: SelectMode) => void
  exitSelectMode: () => void
}

interface OverlayContextValue {
  setNode: (owner: symbol, node: ReactNode) => void
  clear: (owner: symbol) => void
}

const OverlayContext = createContext<OverlayContextValue | null>(null)

/**
 * 把多选操作栏挂到页面根节点，才能盖住小播放栏和 TabBar。
 * 列表仍可点击：宿主使用 box-none，只有操作栏本身接收手势。
 */
export const MultipleModeBarHost = ({ children }: { children: ReactNode }) => {
  const [node, setNodeState] = useState<ReactNode>(null)
  const ownerRef = useRef<symbol | null>(null)

  const value = useMemo<OverlayContextValue>(() => ({
    setNode(owner, nextNode) {
      ownerRef.current = owner
      setNodeState(nextNode)
    },
    clear(owner) {
      if (ownerRef.current !== owner) return
      ownerRef.current = null
      setNodeState(null)
    },
  }), [])

  return (
    <OverlayContext.Provider value={value}>
      <View style={styles.hostRoot}>
        {children}
        <View pointerEvents="box-none" style={styles.hostOverlay}>
          {node}
        </View>
      </View>
    </OverlayContext.Provider>
  )
}

export default forwardRef<MultipleModeBarType, MultipleModeBarProps>(({
  onSelectAll,
  onSwitchMode,
  onExitSelectMode,
  onPlayLater,
  onAdd,
  onMove,
  onRemove,
}, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const overlay = useContext(OverlayContext)
  const ownerRef = useRef(Symbol('multiple-mode-bar'))
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const animFade = useRef(new Animated.Value(0)).current
  const animTranslateY = useRef(new Animated.Value(0)).current
  const [selectMode, setSelectMode] = useState<SelectMode>('single')
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [selectedCount, setSelectedCount] = useState(0)

  const handleShow = useCallback(() => {
    setVisible(true)
    setAnimatPlayed(false)
    requestAnimationFrame(() => {
      animTranslateY.setValue(48)
      Animated.parallel([
        Animated.timing(animFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(animTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          mass: 0.8,
          stiffness: 260,
        }),
      ]).start(() => {
        setAnimatPlayed(true)
      })
    })
  }, [animFade, animTranslateY])

  const handleHide = useCallback(() => {
    setAnimatPlayed(false)
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animTranslateY, {
        toValue: 48,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(finished => {
      if (!finished) return
      setVisible(false)
      setAnimatPlayed(true)
      setSelectedCount(0)
      setIsSelectAll(false)
    })
  }, [animFade, animTranslateY])

  useImperativeHandle(ref, () => ({
    show() {
      handleShow()
    },
    setIsSelectAll(isAll) {
      setIsSelectAll(isAll)
    },
    setSelectedCount(count) {
      setSelectedCount(count)
    },
    setSwitchMode(mode: SelectMode) {
      setSelectMode(mode)
    },
    exitSelectMode() {
      handleHide()
    },
  }), [handleHide, handleShow])

  const handleSelectAll = useCallback(() => {
    const selectAll = !isSelectAll
    setIsSelectAll(selectAll)
    onSelectAll(selectAll)
  }, [isSelectAll, onSelectAll])

  const actionsDisabled = selectedCount === 0
  const drawerBg = theme.isDark ? 'rgba(16, 18, 27, 0.98)' : 'rgba(255, 255, 255, 0.98)'

  const bar = useMemo(() => (
    <Animated.View
      pointerEvents="auto"
      style={[
        styles.container,
        {
          backgroundColor: drawerBg,
          borderTopColor: theme['c-border-background'],
          opacity: animFade,
          transform: [{ translateY: animTranslateY }],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.countText} size={16} color={theme['c-font']} numberOfLines={1}>
          {t('list_select_count', { num: selectedCount })}
        </Text>
        <TouchableOpacity onPress={handleSelectAll} style={styles.headerBtn} activeOpacity={0.6}>
          <Text size={13} color={theme['c-primary']}>
            {t(isSelectAll ? 'list_select_unall' : 'list_select_all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onExitSelectMode} style={styles.headerBtn} activeOpacity={0.6}>
          <Text size={13} color={theme['c-primary']}>{t('list_select_cancel')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.modeSwitch, { backgroundColor: theme['c-card-background'] }]}>
        <TouchableOpacity
          onPress={() => { onSwitchMode('single') }}
          style={[
            styles.modeBtn,
            selectMode == 'single' && { backgroundColor: theme['c-button-background'] },
          ]}
          activeOpacity={0.7}
        >
          <Text size={12} color={selectMode == 'single' ? theme['c-primary'] : theme['c-font-label']}>
            {t('list_select_single')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { onSwitchMode('range') }}
          style={[
            styles.modeBtn,
            selectMode == 'range' && { backgroundColor: theme['c-button-background'] },
          ]}
          activeOpacity={0.7}
        >
          <Text size={12} color={selectMode == 'range' ? theme['c-primary'] : theme['c-font-label']}>
            {t('list_select_range')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        {
          onPlayLater
            ? (
                <ActionButton
                  icon="nextMusic"
                  label={t('play_later')}
                  color={theme['c-font']}
                  iconColor={theme['c-primary']}
                  iconBg={theme['c-primary-background']}
                  disabled={actionsDisabled}
                  onPress={onPlayLater}
                />
              )
            : null
        }
        {
          onAdd
            ? (
                <ActionButton
                  icon="add-music"
                  label={t('add_to')}
                  color={theme['c-font']}
                  iconColor={theme['c-primary']}
                  iconBg={theme['c-primary-background']}
                  disabled={actionsDisabled}
                  onPress={onAdd}
                />
              )
            : null
        }
        {
          onMove
            ? (
                <ActionButton
                  icon="add_folder"
                  label={t('move_to')}
                  color={theme['c-font']}
                  iconColor={theme['c-primary']}
                  iconBg={theme['c-primary-background']}
                  disabled={actionsDisabled}
                  onPress={onMove}
                />
              )
            : null
        }
        {
          onRemove
            ? (
                <ActionButton
                  icon="remove"
                  label={t('delete')}
                  color={DANGER_COLOR}
                  iconColor={DANGER_COLOR}
                  iconBg="rgba(255, 69, 58, 0.12)"
                  disabled={actionsDisabled}
                  onPress={onRemove}
                />
              )
            : null
        }
      </View>
    </Animated.View>
  ), [
    actionsDisabled,
    animFade,
    animTranslateY,
    drawerBg,
    handleSelectAll,
    isSelectAll,
    onAdd,
    onExitSelectMode,
    onMove,
    onPlayLater,
    onRemove,
    onSwitchMode,
    selectMode,
    selectedCount,
    t,
    theme,
  ])

  const shouldRender = visible || !animatePlayed

  useLayoutEffect(() => {
    if (!overlay) return
    if (!shouldRender) overlay.clear(ownerRef.current)
    else overlay.setNode(ownerRef.current, bar)
  }, [bar, overlay, shouldRender])

  useLayoutEffect(() => {
    const owner = ownerRef.current
    return () => overlay?.clear(owner)
  }, [overlay])

  if (overlay) return null
  return shouldRender ? bar : null
})

const ActionButton = ({
  icon,
  label,
  color,
  iconColor,
  iconBg,
  disabled,
  onPress,
}: {
  icon: string
  label: string
  color: string
  iconColor: string
  iconBg: string
  disabled: boolean
  onPress: () => void
}) => {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      activeOpacity={disabled ? 1 : 0.6}
      disabled={disabled}
      onPress={onPress}
    >
      <View style={[styles.actionIconBox, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.actionLabel} size={10} color={color} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = createStyle({
  hostRoot: {
    flex: 1,
  },
  hostOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 2000,
  },
  container: {
    width: '100%',
    borderTopLeftRadius: BorderRadius.xlarge,
    borderTopRightRadius: BorderRadius.xlarge,
    borderTopWidth: BorderWidths.hairline,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    flex: 1,
    fontWeight: '700',
  },
  headerBtn: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  modeSwitch: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: 12,
    padding: 3,
    borderRadius: BorderRadius.pill,
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.35,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontWeight: '500',
  },
})
