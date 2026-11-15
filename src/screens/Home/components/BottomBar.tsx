import { memo, useEffect, useRef, useState } from 'react'
import { Animated, PixelRatio, Pressable, StyleSheet, View } from 'react-native'
import { getMainNavIndex, isMainNavId, MAIN_NAV_MENUS, type NAV_MENUS } from '@/config/constant'
import { setNavActiveId } from '@/core/common'
import { useI18n } from '@/lang'
import { useFontSize, useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { setSpText } from '@/utils/pixelRatio'
import { useReduceMotion } from '@/utils/hooks/useReduceMotion'

/** 标签栏只呈现四个主标签，顺序与首页分页器、主标签判断共用同一份定义。 */
const TAB_BAR_MENUS = MAIN_NAV_MENUS

const getLabelHeight = () => Math.max(16, Math.ceil(setSpText(12) * PixelRatio.getFontScale() * 1.2))
export const getTabBarHeight = () => Math.max(64, 26 + getLabelHeight() + 18)

interface BarItemProps {
  id: typeof NAV_MENUS[number]['id']
  icon: typeof NAV_MENUS[number]['icon']
  labelBox: number
}

/**
 * 标签栏页签。
 *
 * 图标与文字常显，选中靠透镜与字重，按下给即时反馈而不改变导航含义。
 */
const BarItem = ({ id, icon, labelBox }: BarItemProps) => {
  const theme = useTheme()
  const t = useI18n()
  const activeId = useNavActiveId()
  const isActive = activeId == id
  const color = isActive ? theme['c-accent'] : theme['c-font-label']

  const handlePress = () => {
    if (isActive) return
    setNavActiveId(id)
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.item, {
        backgroundColor: pressed ? theme['c-glass-surface'] : 'transparent',
        transform: [{ scale: pressed ? 0.95 : 1 }],
        opacity: 1,
      }]}
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityLabel={t(id)}
      accessibilityState={{ selected: isActive }}
    >
      <Icon
        name={icon}
        rawSize={26}
        strokeWidth={isActive ? 2.3 : 1.8}
        color={color}
      />
      {/*
        高度按真实字号留出，不用固定 13dp：
        setSpText 会放大字号，Android 默认字体内边距再叠一层，固定高度会把默认态的文字裁掉。
      */}
      <View style={{ alignSelf: 'stretch', overflow: 'hidden' }}>
        <Text
          style={{
            lineHeight: labelBox,
            textAlign: 'center',
            fontWeight: isActive ? '700' : '500',
            includeFontPadding: false,
          }}
          size={12}
          color={color}
          numberOfLines={1}
        >
          {t(id)}
        </Text>
      </View>
    </Pressable>
  )
}

/**
 * 底部标签栏内容。竖屏时铺在 HomeDock 的玻璃胶囊里。
 * 选中态是一枚跟着当前标签走的玻璃透镜，图标保持内容色。
 */
export default memo(() => {
  const theme = useTheme()
  const activeId = useNavActiveId()
  useFontSize()
  const reducedMotion = useReduceMotion()
  const [barWidth, setBarWidth] = useState(0)
  const activeIndex = isMainNavId(activeId) ? getMainNavIndex(activeId) : 0
  const slide = useRef(new Animated.Value(activeIndex)).current
  const labelBox = getLabelHeight()
  const tabWidth = barWidth / TAB_BAR_MENUS.length
  const lensInset = 4

  useEffect(() => {
    slide.stopAnimation()
    if (reducedMotion) {
      slide.setValue(activeIndex)
      return
    }
    const animation = Animated.spring(slide, {
      toValue: activeIndex,
      useNativeDriver: true,
      damping: 24,
      stiffness: 240,
      mass: 0.8,
      overshootClamping: true,
    })
    animation.start()
    return () => { animation.stop() }
  }, [activeIndex, reducedMotion, slide])

  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      onLayout={({ nativeEvent }) => {
        const next = nativeEvent.layout.width
        setBarWidth(prev => (prev == next ? prev : next))
      }}
    >
      {tabWidth > 0
        ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.lens,
                {
                  width: tabWidth - lensInset * 2,
                  backgroundColor: theme['c-accent-soft'],
                  borderColor: theme['c-glass-border'],
                  borderTopColor: theme['c-glass-highlight'],
                  transform: [{
                    translateX: slide.interpolate({
                      inputRange: TAB_BAR_MENUS.map((_, index) => index),
                      outputRange: TAB_BAR_MENUS.map((_, index) => index * tabWidth + lensInset),
                      extrapolate: 'clamp',
                    }),
                  }],
                },
              ]}
            />
          )
        : null}
      {TAB_BAR_MENUS.map(item => (
        <BarItem key={item.id} id={item.id} icon={item.icon} labelBox={labelBox} />
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lens: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 25,
    borderWidth: 1,
  },
  item: {
    flex: 1,
    minHeight: 48,
    alignSelf: 'stretch',
    borderRadius: 25,
    margin: 4,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
