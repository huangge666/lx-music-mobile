import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { BorderRadius } from '@/theme'
import { createStyle } from '@/utils/tools'

export interface ChoiceOption<T extends string> {
  id: T
  label: string
}

/**
 * 胶囊单选：少量选项铺成整行分段，多选项自动折行。
 *
 * Phase 6A 配色：
 * - 未选中 = 中性填充底 + 次要文字色（浅色下不会和卡片白底糊在一起）
 * - 选中 = 强调色柔光底 + 强调色文字；分段器选中块用实色卡片底，形成 iOS 分段控件观感
 */
function ChoicePills<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: ReadonlyArray<ChoiceOption<T>>
  onChange: (id: T) => void
}) {
  const theme = useTheme()
  const segmented = options.length > 1 && options.length <= 3

  if (segmented) {
    return (
      <View style={[
        styles.track,
        { backgroundColor: theme['c-primary-input-background'] },
      ]}>
        {options.map(item => {
          const selected = item.id == value
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.segment,
                selected
                  ? { backgroundColor: theme['c-card-background'] }
                  : { backgroundColor: 'transparent' },
              ]}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => { onChange(item.id) }}
            >
              <Text
                size={12}
                color={selected ? theme['c-accent'] : theme['c-font-label']}
                style={selected ? styles.selectedText : styles.text}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      {options.map(item => {
        const selected = item.id == value
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.chip,
              {
                backgroundColor: selected
                  ? theme['c-accent-soft']
                  : theme['c-primary-input-background'],
              },
            ]}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => { onChange(item.id) }}
          >
            <Text
              size={13}
              color={selected ? theme['c-accent'] : theme['c-font-label']}
              style={selected ? styles.selectedText : styles.text}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default memo(ChoicePills) as typeof ChoicePills

const styles = createStyle({
  track: {
    flexDirection: 'row',
    borderRadius: BorderRadius.round,
    padding: 4,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '500',
  },
  selectedText: {
    fontWeight: '600',
  },
})
