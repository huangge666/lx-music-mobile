import { useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import {
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  useWindowDimensions,
  StyleSheet,
} from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { BorderRadius, BorderWidths } from '@/theme'
import GlassSurface from '@/components/common/GlassSurface'
import GlassIconButton from './GlassIconButton'
import { useReduceMotion } from '@/utils/hooks/useReduceMotion'
import { useSheetDrag } from '@/utils/hooks/useSheetDrag'

export interface ActionSheetItem {
  action: string
  label: string
  icon: string
  disabled?: boolean
  danger?: boolean
  selected?: boolean
}

export interface ActionSheetHeader {
  title: string
  subtitle?: string
  icon?: string
  iconColor?: string
  iconBg?: string
}

export interface ActionSheetType {
  show: (options: { header: ActionSheetHeader, items: ActionSheetItem[] }) => void
  hide: () => void
}

export interface ActionSheetProps {
  onPress: (action: string) => void
  onHide?: () => void
}

const ANIMATION_DURATION = 260

export default forwardRef<ActionSheetType, ActionSheetProps>(({ onPress, onHide }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const { height: screenHeight } = useWindowDimensions()
  const reduceMotion = useReduceMotion()
  const [visible, setVisible] = useState(false)
  const [header, setHeader] = useState<ActionSheetHeader>({ title: '' })
  const [items, setItems] = useState<ActionSheetItem[]>([])
  const animValue = useRef(new Animated.Value(0)).current
  const drag = useRef(new Animated.Value(0)).current
  const visibleRef = useRef(false)
  const closingRef = useRef(false)

  const openDrawer = useCallback(() => {
    closingRef.current = false
    setVisible(true)
    visibleRef.current = true
    drag.setValue(0)
    if (reduceMotion) {
      animValue.setValue(1)
      return
    }
    animValue.setValue(0)
    Animated.spring(animValue, {
      toValue: 1,
      useNativeDriver: true,
      damping: 24,
      mass: 0.8,
      stiffness: 260,
    }).start()
  }, [animValue, drag, reduceMotion])

  const closeDrawer = useCallback((onFinished?: () => void) => {
    if (closingRef.current || !visibleRef.current) return
    closingRef.current = true
    const finish = () => {
      visibleRef.current = false
      closingRef.current = false
      setVisible(false)
      onHide?.()
      onFinished?.()
    }
    if (reduceMotion) {
      animValue.setValue(0)
      finish()
      return
    }
    Animated.timing(animValue, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.36, 0.66, 0.04, 1),
      useNativeDriver: true,
    }).start(({ finished }) => { if (finished) finish() })
  }, [animValue, onHide, reduceMotion])

  // 仅标题与拉条接收下拉，菜单滚动和行点击不会被关闭手势截走。
  const resetDrag = () => {
    if (reduceMotion) drag.setValue(0)
    else Animated.spring(drag, { toValue: 0, damping: 24, stiffness: 260, mass: 0.8, useNativeDriver: true }).start()
  }
  const dragHandlers = useSheetDrag(distance => {
    if (closingRef.current) return
    drag.stopAnimation()
    drag.setValue(distance)
  }, dismiss => {
    if (closingRef.current) return
    if (dismiss) closeDrawer()
    else resetDrag()
  })

  useImperativeHandle(ref, () => ({
    show(options) {
      setHeader(options.header)
      setItems(options.items)
      if (!visibleRef.current) openDrawer()
    },
    hide() {
      if (visibleRef.current) closeDrawer()
    },
  }), [closeDrawer, openDrawer])

  const handlePress = useCallback((action: string, disabled?: boolean) => {
    if (disabled) return
    closeDrawer(() => {
      onPress(action)
    })
  }, [closeDrawer, onPress])

  if (!visible) return null

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  })
  const sheetTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  })
  const headerCoverBg = header.iconBg ?? theme['c-primary-input-background']
  const headerCoverColor = header.iconColor ?? theme['c-font-label']

  return (
    <Modal
      transparent
      hardwareAccelerated
      statusBarTranslucent
      visible={visible}
      animationType="none"
      onRequestClose={() => { closeDrawer() }}
    >
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={() => { closeDrawer() }}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.drawerSheet,
            { transform: [{ translateY: Animated.add(sheetTranslateY, drag) }] },
          ]}
        >
          <GlassSurface highlight="none" scrim={theme.isDark ? 0.7 : 0.4} style={styles.drawerFill}>
          <View collapsable={false} {...dragHandlers}>
          <View style={styles.grabberContainer}>
            <View style={[styles.grabber, { backgroundColor: theme['c-font-label'], opacity: 0.3 }]} />
          </View>

          <View style={[styles.header, { borderBottomColor: theme['c-border-background'] }]}>
            <View style={[styles.headerCover, { backgroundColor: headerCoverBg }]}>
              <Icon
                name={header.icon ?? 'album'}
                size={20}
                color={headerCoverColor}
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} size={16} color={theme['c-font']} numberOfLines={1}>
                {header.title}
              </Text>
              {
                header.subtitle
                  ? (
                      <Text size={12} color={theme['c-font-label']} numberOfLines={1}>
                        {header.subtitle}
                      </Text>
                    )
                  : null
              }
            </View>
            <GlassIconButton
              name="close"
              label={t('close')}
              onPress={() => { closeDrawer() }}
            />
          </View>
          </View>

          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={[styles.menuGroup, { backgroundColor: theme['c-glass-surface'], borderColor: theme['c-border-background'] }]}>
              {items.map((item, index) => {
                const isLast = index === items.length - 1
                // 危险项用统一的危险色；禁用项只降透明度并置灰
                const itemColor = item.danger
                  ? theme['c-danger']
                  : item.disabled
                    ? theme['c-font-label']
                    : item.selected
                      ? theme['c-accent']
                      : theme['c-font']
                const iconColor = item.danger
                  ? theme['c-danger']
                  : item.disabled
                    ? theme['c-font-label']
                    : theme['c-accent']

                return (
                  <TouchableOpacity
                    key={item.action}
                    style={[
                      styles.menuItem,
                      !isLast && { borderBottomWidth: BorderWidths.hairline, borderBottomColor: theme['c-border-background'] },
                      item.disabled && styles.menuItemDisabled,
                    ]}
                    activeOpacity={item.disabled ? 1 : 0.6}
                    disabled={item.disabled}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ disabled: !!item.disabled, selected: !!item.selected }}
                    onPress={() => { handlePress(item.action, item.disabled) }}
                  >
                    <View
                      style={[
                        styles.menuIconBox,
                        {
                          backgroundColor: item.danger
                            ? theme['c-danger-soft']
                            : item.disabled
                              ? 'transparent'
                              : theme['c-accent-soft'],
                        },
                      ]}
                    >
                      <Icon name={item.icon} size={16} color={iconColor} />
                    </View>
                    <Text
                      style={[styles.menuText, item.danger && styles.menuTextDanger]}
                      size={15}
                      color={itemColor}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    <Icon
                      name={item.selected ? 'checkbox-marked' : 'chevron-right'}
                      size={item.selected ? 16 : 12}
                      color={item.selected ? theme['c-accent'] : theme['c-font-label']}
                      style={[styles.chevron, item.disabled && { opacity: 0.3 }]}
                    />
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
          </GlassSurface>
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
    width: '96%',
    maxWidth: 560,
    alignSelf: 'center',
    marginBottom: 10,
    maxHeight: '82%',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  drawerFill: {
    flexShrink: 1,
    minHeight: 0,
    borderRadius: BorderRadius.xlarge,
    borderWidth: 0.5,
    paddingBottom: 28,
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
    borderWidth: BorderWidths.hairline,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 12,
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
