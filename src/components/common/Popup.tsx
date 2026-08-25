import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  PanResponder,
  StyleSheet,
} from 'react-native'

import { Icon } from '@/components/common/Icon'
import { useKeyboard, useWindowSize } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { useStatusbarHeight } from '@/store/common/hook'
import { BorderRadius, BorderWidths } from '@/theme'

const ANIMATION_DURATION = 260
const DISMISS_DISTANCE = 100
const DISMISS_VELOCITY = 1.2

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
    ]).start(() => {
      visibleRef.current = false
      closingRef.current = false
      setVisible(false)
      onHide?.()
      onFinished?.()
    })
  }, [backdrop, onHide, translate])

  const openDrawer = useCallback(() => {
    closingRef.current = false
    visibleRef.current = true
    translate.setValue(hiddenOffsetRef.current)
    backdrop.setValue(0)
    setVisible(true)
    requestAnimationFrame(() => {
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
  }, [backdrop, translate])

  const closeDrawerRef = useRef(closeDrawer)
  closeDrawerRef.current = closeDrawer

  // 仅底部抽屉在拉条/标题栏上下拉关闭，避免和内容区 ScrollView 抢手势
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => {
      return gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx)
    },
    onPanResponderMove: (_, gesture) => {
      if (gesture.dy <= 0) {
        translate.setValue(0)
        backdrop.setValue(1)
        return
      }
      translate.setValue(gesture.dy)
      backdrop.setValue(Math.max(0, 1 - gesture.dy / 320))
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
        closeDrawerRef.current()
        return
      }
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
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start()
    },
  })).current

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
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: theme['c-card-background'] }]}
          activeOpacity={0.7}
          onPress={() => { closeDrawer() }}
        >
          <Icon name="close" size={13} color={theme['c-font-label']} />
        </TouchableOpacity>
      )
    : null, [closeBtn, closeDrawer, theme])

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
            paddingBottom: 28 + (keyboardShown ? keyboardHeight : 0),
          },
        ]
    }
  }, [keyboardHeight, keyboardShown, position, statusBarHeight])

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
            {
              backgroundColor: theme['c-content-background'],
              borderColor: theme['c-border-background'],
              transform,
            },
          ]}
        >
          <View {...(isBottom ? panResponder.panHandlers : {})}>
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
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    borderTopWidth: BorderWidths.hairline,
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
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 0,
  },
})
