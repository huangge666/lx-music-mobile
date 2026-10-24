import { memo, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native'
import { getMainNavIndex, isMainNavId, MAIN_NAV_MENUS, type NAV_MENUS } from '@/config/constant'
import { setNavActiveId } from '@/core/common'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { setSpText } from '@/utils/pixelRatio'

/** 标签栏只呈现四个主标签，顺序与首页分页器、主标签判断共用同一份定义。 */
const TAB_BAR_MENUS = MAIN_NAV_MENUS

interface BarItemProps {
  id: typeof NAV_MENUS[number]['id']
  icon: typeof NAV_MENUS[number]['icon']
  labelBox: number
}

/**
 * 标签栏页签。
 *
 * Sonify 开着液态玻璃时，图标和文字保持黑/白，选中靠背后的透镜，不用品牌红。
 * 文字常显：滚动列表时不再收起，标签栏高度固定。
 */
const BarItem = ({ id, icon, labelBox }: BarItemProps) => {
  const theme = useTheme()
  const t = useI18n()
  const activeId = useNavActiveId()
  const isActive = activeId == id
  const color = theme['c-font']

  const handlePress = () => {
    if (isActive) return
    setNavActiveId(id)
  }

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityLabel={t(id)}
      accessibilityState={{ selected: isActive }}
      activeOpacity={0.6}
    >
      <Icon
        name={icon}
        rawSize={26}
        strokeWidth={2}
        color={color}
      />
      {/*
        高度按真实字号留出，不用固定 13dp：
        setSpText 会放大字号，Android 默认字体内边距再叠一层，固定高度会把默认态的文字裁掉。
      */}
      <View style={{ alignSelf: 'stretch', overflow: 'hidden' }}>
        <Text
          style={{
            height: labelBox,
            lineHeight: labelBox,
            textAlign: 'center',
            fontWeight: '500',
            includeFontPadding: false,
          }}
          size={12}
          color={color}
          numberOfLines={1}
        >
          {t(id)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

/**
 * 底部标签栏内容。竖屏时铺在 HomeDock 的玻璃胶囊里。
 * 选中态是一枚跟着当前标签走的玻璃透镜，图标保持内容色。
 */
export default memo(() => {
  const theme = useTheme()
  const activeId = useNavActiveId()
  const [barWidth, setBarWidth] = useState(0)
  const activeIndex = isMainNavId(activeId) ? getMainNavIndex(activeId) : 0
  const slide = useRef(new Animated.Value(activeIndex)).current
  // 12px 标签的实际占位。+2 给字形下降部留一点，避免展开态被裁切。
  const labelBox = Math.max(16, Math.ceil(setSpText(12)) + 2)
  const tabWidth = barWidth / TAB_BAR_MENUS.length
  const lensInset = 4

  useEffect(() => {
    Animated.spring(slide, {
      toValue: activeIndex,
      useNativeDriver: true,
      friction: 9,
      tension: 80,
    }).start()
  }, [activeIndex, slide])

  return (
    <View
      style={styles.container}
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
                  // Sonify 选中胶囊：浅色黑 10%，深色白 10%
                  backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)',
                  transform: [{
                    translateX: slide.interpolate({
                      inputRange: TAB_BAR_MENUS.map((_, index) => index),
                      outputRange: TAB_BAR_MENUS.map((_, index) => index * tabWidth + lensInset),
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
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
