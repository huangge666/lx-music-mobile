import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useBgPic } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import versionState from '@/store/version/state'
import { createStyle } from '@/utils/tools'
import Section from '../components/Section'
import SettingIcon from '../components/SettingIcon'
import { settingLayout } from '../components/style'
import {
  SETTING_NAV_GROUPS,
  SETTING_NAV_ICONS,
  type SettingScreenIds,
} from '../Main'

/** 分组卡入场：每组的进度起点（单一进度值 + 输入区间错峰） */
const GROUP_STAGGER = 0.09

const NavRow = memo(({
  id,
  showDivider,
  onPress,
}: {
  id: SettingScreenIds
  showDivider: boolean
  onPress: (id: SettingScreenIds) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  // 按压进度：驱动图标瓷贴弹簧缩放与 chevron 位移微交互
  const press = useRef(new Animated.Value(0)).current

  const handlePressIn = useCallback(() => {
    Animated.spring(press, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 220,
    }).start()
  }, [press])

  const handlePressOut = useCallback(() => {
    Animated.spring(press, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
      tension: 160,
    }).start()
  }, [press])

  return (
    <View>
      <TouchableOpacity
        onPress={() => { onPress(id) }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.65}
        accessibilityRole="button"
        accessibilityLabel={t(`setting_${id}`)}
        style={settingLayout.row}
      >
        <Animated.View
          style={[settingLayout.iconBubbleWrapper, {
            transform: [{
              // 按压时图标瓷贴轻微收缩，松手弹回
              scale: press.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.86],
                extrapolate: 'clamp',
              }),
            }],
          }]}
        >
          <SettingIcon name={SETTING_NAV_ICONS[id]} />
        </Animated.View>
        <View style={settingLayout.rowBody}>
          <Text size={16} style={settingLayout.rowTitle} numberOfLines={1}>
            {t(`setting_${id}`)}
          </Text>
          {id == 'source'
            ? (
                <Text size={12} color={theme['c-font-label']} style={settingLayout.rowSubtitle} numberOfLines={1}>
                  {t('setting_source_desc')}
                </Text>
              )
            : null}
        </View>
        <Animated.View
          style={[styles.chevron, {
            backgroundColor: theme['c-primary-background'],
            transform: [{
              // chevron 顺势右移，暗示页面即将推入
              translateX: press.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
                extrapolate: 'clamp',
              }),
            }],
          }]}
        >
          <Icon name="chevron-right" size={16} color={theme['c-primary']} />
        </Animated.View>
      </TouchableOpacity>
      {showDivider
        ? (
            <View
              style={[
                styles.divider,
                { backgroundColor: theme['c-border-background'] },
              ]}
            />
          )
        : null}
    </View>
  )
})

export default ({ onChangeId }: {
  onChangeId: (id: SettingScreenIds) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const hasDynamicBg = useBgPic() != null
  // 整页入场进度：分组卡错峰上浮，底部签名随末尾浮现
  const enter = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 640,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [enter])

  const footerOpacity = useMemo(() => enter.interpolate({
    inputRange: [0.55, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  }), [enter])

  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      style={{
        flex: 1,
        backgroundColor: hasDynamicBg ? 'transparent' : theme['c-card-background'],
      }}
      contentContainerStyle={styles.content}
    >
      {SETTING_NAV_GROUPS.map((group, groupIndex) => {
        // 单值进度按组错峰：各组在自身区间内完成上浮淡入
        const start = Math.min(groupIndex * GROUP_STAGGER, 0.6)
        const end = Math.min(start + 0.45, 1)
        const cardAnim = {
          opacity: enter.interpolate({
            inputRange: [start, end],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
          transform: [{
            translateY: enter.interpolate({
              inputRange: [start, end],
              outputRange: [26, 0],
              extrapolate: 'clamp',
            }),
          }],
        }
        return (
          <Animated.View key={group.titleKey} style={cardAnim}>
            <Text
              size={13}
              color={theme['c-font-label']}
              style={styles.groupTitle}
            >
              {t(group.titleKey)}
            </Text>
            <Section style={styles.groupCard}>
              {group.items.map((id, index) => (
                <NavRow
                  key={id}
                  id={id}
                  showDivider={index < group.items.length - 1}
                  onPress={onChangeId}
                />
              ))}
            </Section>
          </Animated.View>
        )
      })}
      {/* 底部品牌签名 — 沉浸式收尾 */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <View style={[styles.footerBadge, {
          backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : theme['c-primary-background'],
          borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : theme['c-glass-border'],
        }]}>
          <Icon name="logo" size={18} color={theme['c-primary']} />
        </View>
        <Text size={12} style={styles.footerName} color={theme['c-font-label']}>LX Music</Text>
        <Text size={10} color={theme['c-font-label']}>v{versionState.versionInfo.version}</Text>
      </Animated.View>
    </ScrollView>
  )
}

const styles = createStyle({
  content: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 88,
  },
  groupTitle: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  groupCard: {
    marginBottom: 10,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 10,
  },
  footerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  footerName: {
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
})
