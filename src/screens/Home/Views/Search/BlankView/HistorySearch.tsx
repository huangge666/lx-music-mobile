import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { type InitState } from '@/store/hotSearch/state'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { clearHistoryList, getSearchHistory, removeHistoryWord } from '@/core/search/search'
import { Icon } from '@/components/common/Icon'
import { BorderRadius } from '@/theme'


export type List = NonNullable<InitState['sourceList'][keyof InitState['sourceList']]>

const ListItem = ({ keyword, onSearch, onRemove }: {
  keyword: string
  onSearch: (keyword: string) => void
  onRemove: (keyword: string) => void
}) => {
  const theme = useTheme()
  return (
    <View style={{ ...styles.chip, backgroundColor: theme['c-card-background'] }}>
      <TouchableOpacity
        style={styles.chipLabel}
        activeOpacity={0.7}
        onPress={() => { onSearch(keyword) }}
      >
        <Text color={theme['c-font']} size={14}>{keyword}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.chipClose}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.6}
        onPress={() => { onRemove(keyword) }}
      >
        <Icon name="close" size={10} color={theme['c-font-label']} />
      </TouchableOpacity>
    </View>
  )
}


interface HistorySearchProps {
  onSearch: (keyword: string) => void
}
export interface HistorySearchType {
  show: () => void
}

export default forwardRef<HistorySearchType, HistorySearchProps>((props, ref) => {
  const [list, setList] = useState<List>([])
  const isUnmountedRef = useRef(false)
  const t = useI18n()
  const theme = useTheme()

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    show() {
      void getSearchHistory().then((list) => {
        if (isUnmountedRef.current) return
        setList(list)
      })
    },
  }), [])

  const handleClear = () => {
    clearHistoryList()
    setList([])
  }

  const handleRemove = useCallback((keyword: string) => {
    setList(list => {
      list = [...list]
      const index = list.indexOf(keyword)
      list.splice(index, 1)
      removeHistoryWord(index)
      return list
    })
  }, [])

  return (
    list.length
      ? (
          <View>
            <View style={styles.titleContent}>
              <Text style={styles.title} size={20} color={theme['c-font']}>{t('search_history_search')}</Text>
              <TouchableOpacity onPress={handleClear} style={styles.titleBtn}>
                <Icon name="eraser" color={theme['c-font-label']} size={14} />
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {
                list.map(keyword => <ListItem keyword={keyword} key={keyword} onSearch={props.onSearch} onRemove={handleRemove} />)
              }
            </View>
          </View>
        )
      : null
  )
})


const styles = createStyle({
  titleContent: {
    paddingTop: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  titleBtn: {
    marginLeft: 10,
    padding: 5,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.round,
    marginRight: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  chipLabel: {
    paddingLeft: 16,
    paddingRight: 6,
    paddingTop: 8,
    paddingBottom: 8,
  },
  chipClose: {
    width: 22,
    height: 22,
    marginRight: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
