import { forwardRef, useImperativeHandle, useState } from 'react'
import { TouchableOpacity, View, type ViewStyle } from 'react-native'

import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import songlistState, { type Source } from '@/store/songlist/state'
import { createStyle } from '@/utils/tools'

export interface SourceSelectorProps {
  style?: ViewStyle
  onSourceChange: (source: Source) => void
}

export interface SourceSelectorType {
  setSource: (source: Source) => void
}

/**
 * 固定音源 Tab。歌单页的音源数量通常为五个，因此直接均分首行空间，
 * 让音源切换成为页面的一级导航；超长平台名通过单行截断保持布局稳定。
 */
export default forwardRef<SourceSelectorType, SourceSelectorProps>(({ style, onSourceChange }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const [source, setSource] = useState<Source>(songlistState.sources[0] ?? 'kw')
  const sourceList = songlistState.sources.map(action => ({
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
