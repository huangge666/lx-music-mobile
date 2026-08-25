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
    return SEARCH_TYPE_LIST.map(type => ({ label: t(`search_type_${type}`), id: type }))
  }, [t])

  const handleTypeChange = (type: SearchType) => {
    setType(type)
    global.app_event.searchTypeChanged(type)
  }

  return (
    <View style={styles.container}>
      {
        list.map(item => {
          const active = type == item.id
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.76}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => { handleTypeChange(item.id) }}
              style={{
                ...styles.tab,
                backgroundColor: active ? theme['c-primary-background'] : theme['c-card-background'],
                borderColor: active ? theme['c-primary-alpha-700'] : theme['c-border-background'],
              }}
            >
              <Text
                size={13}
                style={styles.tabText}
                color={active ? theme['c-primary-font'] : theme['c-font-label']}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })
      }
    </View>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    gap: 6,
  },
  tab: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: '600',
  },
})
