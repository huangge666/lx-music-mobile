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
 * 胶囊单选：少量选项铺成整行分段，多选项自动折行
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
        {
          backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(118, 118, 128, 0.12)',
          borderColor: theme['c-border-background'],
        },
      ]}>
        {options.map(item => {
          const selected = item.id == value
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.segment,
                selected ? { backgroundColor: theme['c-primary-background'] } : null,
              ]}
              activeOpacity={0.7}
              onPress={() => { onChange(item.id) }}
            >
              <Text
                size={12}
                color={selected ? theme['c-primary'] : theme['c-font-label']}
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
                  ? theme['c-primary-background']
                  : (theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(118, 118, 128, 0.10)'),
              },
            ]}
            activeOpacity={0.7}
            onPress={() => { onChange(item.id) }}
          >
            <Text
              size={13}
              color={selected ? theme['c-primary'] : theme['c-font-label']}
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
    borderWidth: 0.5,
  },
  segment: {
    flex: 1,
    height: 36,
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
    height: 36,
    paddingHorizontal: 14,
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
