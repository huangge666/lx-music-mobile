import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import songlistState, { type SortInfo, type Source } from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'

export interface SortTabProps {
  onSortChange: (id: string) => void
}

export interface SortTabType {
  setSource: (source: Source, activeTab: SortInfo['id']) => void
}


export default forwardRef<SortTabType, SortTabProps>(({ onSortChange }, ref) => {
  const [sortList, setSortList] = useState<SortInfo[]>([])
  const [activeId, setActiveId] = useState<SortInfo['id']>('')
  const t = useI18n()
  const theme = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)

  useImperativeHandle(ref, () => ({
    setSource(source, activeTab) {
      scrollViewRef.current?.scrollTo({ x: 0 })
      setSortList(songlistState.sortList[source]!)
      setActiveId(activeTab)
    },
  }))

  const sorts = useMemo(() => {
    return sortList.map(s => ({ label: t(`songlist_${s.tid}`), id: s.id }))
  }, [sortList, t])

  const handleSortChange = (id: string) => {
    onSortChange(id)
    setActiveId(id)
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps={'always'}
      horizontal
    >
      {
        sorts.map(s => {
          const active = activeId == s.id
          return (
            <TouchableOpacity
              style={{ ...styles.button, backgroundColor: active ? theme['c-primary-background'] : theme['c-card-background'], borderColor: active ? theme['c-primary-alpha-700'] : theme['c-border-background'] }}
              activeOpacity={0.72}
              onPress={() => { handleSortChange(s.id) }}
              key={s.id}
            >
              <View style={{ ...styles.dot, backgroundColor: active ? theme['c-primary'] : theme['c-font-label'] }} />
              <Text style={styles.buttonText} size={13} color={active ? theme['c-primary-font'] : theme['c-font']}>{s.label}</Text>
            </TouchableOpacity>
          )
        })
      }
    </ScrollView>
  )
})


const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  button: {
    height: 32,
    borderRadius: 4,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 1,
    marginRight: 7,
    opacity: 0.9,
  },
  buttonText: {
    fontWeight: '600',
  },
})
