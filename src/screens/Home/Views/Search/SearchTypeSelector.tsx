import { useEffect, useMemo, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { createStyle } from '@/utils/tools'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { getSearchSetting } from '@/utils/data'

const SEARCH_TYPE_LIST = [
  'music',
  'songlist',
] as const

/**
 * 搜索类型放在搜索栏里，做成滑动胶囊，不再占用标题栏右侧。
 */
export default () => {
  const t = useI18n()
  const theme = useTheme()
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then(info => {
      setType(info.type)
    })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map(item => ({ label: t(`search_type_${item}`), id: item }))
  }, [t])

  const handleTypeChange = (next: SearchType) => {
    setType(next)
    global.app_event.searchTypeChanged(next)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme['c-glass-surface'] }]}>
      {list.map(item => {
        const active = type == item.id
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.76}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => { handleTypeChange(item.id) }}
            style={[
              styles.tab,
              active ? { backgroundColor: theme['c-accent'] } : null,
            ]}
          >
            <Text
              size={12}
              style={styles.tabText}
              color={active ? (theme.isDark ? 'rgb(18, 16, 14)' : 'rgb(255, 255, 255)') : theme['c-font-label']}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 2,
    padding: 3,
    borderRadius: 18,
    flexShrink: 0,
  },
  tab: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: '700',
  },
})
