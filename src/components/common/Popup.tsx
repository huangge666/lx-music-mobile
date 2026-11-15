import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import {
  View,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native'

import { useKeyboard, useWindowSize } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { useStatusbarHeight } from '@/store/common/hook'
import { BorderRadius, BorderWidths } from '@/theme'
import GlassSurface from '@/components/common/GlassSurface'
import GlassIconButton from './GlassIconButton'
import { useI18n } from '@/lang'
import { useReduceMotion } from '@/utils/hooks/useReduceMotion'
import { useSheetDrag } from '@/utils/hooks/useSheetDrag'

const ANIMATION_DURATION = 260

export interface PopupProps {
  onHide?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  position?: 'top' | 'left' | 'right' | 'bottom'
  title?: string
  subtitle?: string
  children: React.ReactNode
}

export interface PopupType {
  setVisible: (visible: boolean) => void
}

const getHiddenOffset = (position: PopupProps['position'], width: number, height: number) => {
  switch (position) {
    case 'top':
      return -height
    case 'left':
      return -width
    case 'right':
      return width
    case 'bottom':
    default:
      return height
  }
}

export default forwardRef<PopupType, PopupProps>(({
  onHide,
  keyHide = true,
  bgHide = true,
  closeBtn = true,
  position = 'bottom',
  title = '',
  subtitle = '',
  children,
}: PopupProps, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const reduceMotion = useReduceMotion()
  const { keyboardShown, keyboardHeight } = useKeyboard()
  const statusBarHeight = useStatusbarHeight()
  const windowSize = useWindowSize()
  const [visible, setVisible] = useState(false)
  const translate = useRef(new Animated.Value(0)).current
  const backdrop = useRef(new Animated.Value(0)).current
  const visibleRef = useRef(false)
  const closingRef = useRef(false)
  const hiddenOffsetRef = useRef(0)
  const isBottom = position === 'bottom'

  hiddenOffsetRef.current = getHiddenOffset(position, windowSize.width, windowSize.height)

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
      translate.setValue(hiddenOffsetRef.current)
      backdrop.setValue(0)
      finish()
      return
    }
    Animated.parallel([
      Animated.timing(translate, {
        toValue: hiddenOffsetRef.current,
        duration: ANIMATION_DURATION,
        easing: Easing.bezier(0.36, 0.66, 0.04, 1),
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => { if (finished) finish() })
  }, [backdrop, onHide, translate, reduceMotion])

  const openDrawer = useCallback(() => {
    closingRef.current = false
    visibleRef.current = true
    translate.setValue(hiddenOffsetRef.current)
    backdrop.setValue(0)
    setVisible(true)
    if (reduceMotion) {
      translate.setValue(0)
      backdrop.setValue(1)
      return
    }
    requestAnimationFrame(() => {
      if (closingRef.current || !visibleRef.current) return
      Animated.parallel([
        Animated.spring(translate, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          mass: 0.8,
          stiffness: 260,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    })
  }, [backdrop, translate, reduceMotion])

  const resetDrag = () => {
    if (reduceMotion) {
      translate.setValue(0)
      backdrop.setValue(1)
      return
    }
    Animated.parallel([
      Animated.spring(translate, { toValue: 0, useNativeDriver: true, damping: 24, mass: 0.8, stiffness: 260 }),
      Animated.timing(backdrop, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start()
  }

  // 仅底部抽屉在拉条/标题栏上下拉关闭，避免和内容区 ScrollView 抢手势
  const dragHandlers = useSheetDrag(distance => {
    if (closingRef.current) return
    translate.stopAnimation()
    backdrop.stopAnimation()
    translate.setValue(distance)
    backdrop.setValue(Math.max(0, 1 - distance / 320))
  }, dismiss => {
    if (closingRef.current) return
    if (dismiss) closeDrawer()
    else resetDrag()
  })

  useImperativeHandle(ref, () => ({
    setVisible(nextVisible: boolean) {
      if (nextVisible) {
        if (!visibleRef.current) openDrawer()
        return
      }
      closeDrawer()
    },
  }), [closeDrawer, openDrawer])

  const handleRequestClose = () => {
    if (keyHide) closeDrawer()
  }

  const handleBgClose = () => {
    if (bgHide) closeDrawer()
  }

  const closeBtnComponent = useMemo(() => closeBtn
    ? (
        <GlassIconButton
          name="close"
          label={t('close')}
          onPress={() => { closeDrawer() }}
        />
      )
    : null, [closeBtn, closeDrawer, t])

  const [rootStyle, sheetStyle] = useMemo(() => {
    switch (position) {
      case 'top':
        return [
          styles.rootTop,
          {
            width: '100%' as const,
            maxHeight: '78%' as const,
            borderBottomLeftRadius: BorderRadius.xlarge,
            borderBottomRightRadius: BorderRadius.xlarge,
          },
        ]
      case 'left':
        return [
          styles.rootLeft,
          {
            minWidth: '45%' as const,
            maxWidth: '78%' as const,
            height: '100%' as const,
            paddingTop: statusBarHeight,
            borderTopWidth: 0,
          },
        ]
      case 'right':
        return [
          styles.rootRight,
          {
            minWidth: '45%' as const,
            maxWidth: '78%' as const,
            height: '100%' as const,
            paddingTop: statusBarHeight,
            borderTopWidth: 0,
          },
        ]
      case 'bottom':
      default:
        return [
          styles.rootBottom,
          {
            width: '100%' as const,
            maxHeight: '82%' as const,
            borderTopLeftRadius: BorderRadius.xlarge,
            borderTopRightRadius: BorderRadius.xlarge,
          },
        ]
    }
  }, [position, statusBarHeight])

  if (!visible) return null

  const backdropOpacity = backdrop.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  })
  const transform = (position === 'left' || position === 'right')
    ? [{ translateX: translate }]
    : [{ translateY: translate }]
  const hasHeader = Boolean(title) || Boolean(subtitle) || closeBtn

  return (
    <Modal
      transparent
      hardwareAccelerated
      statusBarTranslucent
      visible={visible}
      animationType="none"
      onRequestClose={handleRequestClose}
    >
      <View style={[styles.modalRoot, rootStyle]}>
        <TouchableWithoutFeedback onPress={handleBgClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { transform },
          ]}
        >
          {/* 底部留白必须位于玻璃背景内，避免面板下方出现透明断层。 */}
          <GlassSurface highlight="none" scrim={theme.isDark ? 0.7 : 0.4} style={[styles.sheetFill, position == 'top' && {
            borderBottomLeftRadius: BorderRadius.xlarge,
            borderBottomRightRadius: BorderRadius.xlarge,
          }, isBottom && {
            borderRadius: BorderRadius.xlarge,
            paddingBottom: 28 + (keyboardShown ? keyboardHeight : 0),
          }]}>
          <View collapsable={false} {...(isBottom ? dragHandlers : {})}>
            {
              isBottom
                ? (
                    <View style={styles.grabberContainer}>
                      <View style={[styles.grabber, { backgroundColor: theme['c-font-label'] }]} />
                    </View>
                  )
                : null
            }

            {
              hasHeader
                ? (
                    <View style={[styles.header, { borderBottomColor: theme['c-border-background'] }]}>
                      <View style={styles.headerInfo}>
                        {
                          title
                            ? (
                                <Text
                                  style={[styles.headerTitle, subtitle ? styles.headerTitleWithSub : undefined]}
                                  size={16}
                                  color={theme['c-font']}
                                  numberOfLines={1}
                                >
                                  {title}
                                </Text>
                              )
                            : null
                        }
                        {
                          subtitle
                            ? (
                                <Text size={12} color={theme['c-font-label']} numberOfLines={1}>
                                  {subtitle}
                                </Text>
                              )
                            : null
                        }
                      </View>
                      {closeBtnComponent}
                    </View>
                  )
                : null
            }
          </View>

          <View style={styles.body}>
            {children}
          </View>
          </GlassSurface>
        </Animated.View>
      </View>
    </Modal>
  )
})

const styles = createStyle({
  modalRoot: {
    flex: 1,
    zIndex: 9999,
    elevation: 9999,
  },
  rootBottom: {
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  rootTop: {
    justifyContent: 'flex-start',
  },
  rootLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  rootRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    flexGrow: 0,
    flexShrink: 1,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  sheetFill: {
    flexGrow: 0,
    flexShrink: 1,
    borderWidth: 0.5,
    minHeight: 0,
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
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: BorderWidths.hairline,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerTitleWithSub: {
    marginBottom: 3,
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 0,
  },
})
