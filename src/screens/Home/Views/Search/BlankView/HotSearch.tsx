import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { type Source, type InitState } from '@/store/hotSearch/state'
import Button from '@/components/common/Button'
import { getList } from '@/core/hotSearch'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { BorderRadius } from '@/theme'


interface ListProps {
  onSearch: (keyword: string) => void
}
export interface HotSearchType {
  show: (source: Source) => void
}


export type List = NonNullable<InitState['sourceList'][keyof InitState['sourceList']]>

/**
 * Apple Music 风格热搜标签项
 * — 胶囊式圆角 (radius 999)
 * — 浅色背景 + 圆角
 */
const ListItem = ({ keyword, onSearch }: {
  keyword: string
  onSearch: (keyword: string) => void
}) => {
  const theme = useTheme()
  return (
    <Button
      style={{ ...styles.button, backgroundColor: theme['c-card-background'] }}
      onPress={() => { onSearch(keyword) }}
    >
      <Text color={theme['c-font']} size={14}>{keyword}</Text>
    </Button>
  )
}

export default forwardRef<HotSearchType, ListProps>((props, ref) => {
  const [list, setList] = useState<List>([])
  const t = useI18n()
  const theme = useTheme()

  const isUnmountedRef = useRef(false)
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    show(source) {
      void getList(source).then((list) => {
        if (isUnmountedRef.current) return
        setList(list)
      })
    },
  }), [])

  return (
    list.length
      ? (
          <ScrollView>
            {/* Apple Music 风格区段标题 — 粗体大号 */}
            <Text style={styles.title} size={20} color={theme['c-font']}>{t('search_hot_search')}</Text>
            <View style={styles.list}>
              {
                list.map(keyword => <ListItem keyword={keyword} key={keyword} onSearch={props.onSearch} />)
              }
            </View>
          </ScrollView>
        )
      : null
  )
})


const styles = createStyle({
  title: {
    paddingTop: 20,
    paddingBottom: 8,
    fontWeight: '700',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Apple Music 胶囊式标签
  button: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: BorderRadius.round,
    marginRight: 8,
    marginTop: 8,
  },
})
