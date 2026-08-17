import { forwardRef, useImperativeHandle, useState } from 'react'
import { TouchableOpacity, View, type ViewStyle } from 'react-native'

import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import leaderboardState, { type Source } from '@/store/leaderboard/state'
import { createStyle } from '@/utils/tools'

export interface SourceTabProps {
  style?: ViewStyle
  onSourceChange: (source: Source) => void
}

export interface SourceTabType {
  setSource: (source: Source) => void
}

/**
 * 排行榜平台 Tab — 固定均分首行空间
 * 将 5 个音源以一级导航 Tab 形式呈现，替代传统下拉选择器，
 * 让平台切换成为页面最顶层的交互入口。
 */
export default forwardRef<SourceTabType, SourceTabProps>(({ style, onSourceChange }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const [source, setSource] = useState<Source>(leaderboardState.sources[0] ?? 'kw')

  const sourceList = leaderboardState.sources.map(action => ({
    action,
    label: t(`source_${sourceNameType}_${action}`),
  }))

  useImperativeHandle(ref, () => ({
    setSource,
  }), [])

  return (
    <View style={[styles.container, style]}>
      {sourceList.map(item => {
        const active = item.action === source
        return (
          <TouchableOpacity
            key={item.action}
            activeOpacity={0.76}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              setSource(item.action)
              onSourceChange(item.action)
            }}
            style={{
              ...styles.tab,
              backgroundColor: active ? theme['c-primary-background'] : 'transparent',
              borderColor: active ? theme['c-primary-alpha-700'] : 'transparent',
            }}
          >
            <Text
              size={13}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ ...styles.tabText, color: active ? theme['c-primary-font'] : theme['c-font-label'] }}
            >
              {item.label}
            </Text>
            <View style={{ ...styles.indicator, backgroundColor: active ? theme['c-primary'] : 'transparent' }} />
          </TouchableOpacity>
        )
      })}
    </View>
  )
})

const styles = createStyle({
  container: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 4,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    height: 40,
    paddingHorizontal: 4,
    borderRadius: 4,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: 22,
    height: 2,
    borderRadius: 1,
  },
})
