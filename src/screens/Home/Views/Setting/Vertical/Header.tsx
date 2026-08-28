import { useEffect, useRef } from 'react'
import { Animated, Easing, TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { type SettingScreenIds } from '../Main'

/**
 * 二级页沉浸式 Header — 不透明内容背景（遵循头部层约定，无分隔线）
 * 左侧圆形返回按钮 + 粗体标题
 * 挂载时自上而下轻微滑入，与子页推入转场呼应
 */
export default ({
  id,
  onBack,
}: {
  id: SettingScreenIds
  onBack: () => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [progress])

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme['c-content-background'],
          opacity: progress,
          transform: [{
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-10, 0],
              extrapolate: 'clamp',
            }),
          }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
        style={[styles.backBtn, { backgroundColor: theme['c-primary-background'] }]}
      >
        <Icon name="chevron-left" color={theme['c-primary']} size={18} />
      </TouchableOpacity>
      <Text numberOfLines={1} size={17} style={styles.title} color={theme['c-font']}>
        {t(`setting_${id}`)}
      </Text>
    </Animated.View>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingLeft: 12,
    paddingRight: 16,
    flexShrink: 0,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    paddingLeft: 12,
    fontWeight: '700',
  },
})
