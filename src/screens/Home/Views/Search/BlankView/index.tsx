import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import HistorySearch, { type HistorySearchType } from './HistorySearch'
import HotSearch, { type HotSearchType } from './HotSearch'
import { useBottomInset } from '@/components/common/BottomInset'
import RecordArtwork from '@/components/common/RecordArtwork'

interface BlankViewProps {
  onSearch: (keyword: string) => void
}
type Source = LX.OnlineSource | 'all'

export interface BlankViewType {
  show: (source: Source) => void
}

export default forwardRef<BlankViewType, BlankViewProps>(({ onSearch }, ref) => {
  // const [listType, setListType] = useState<SearchState['searchType']>('music')
  const [visible, setVisible] = useState(false)
  const hotSearchRef = useRef<HotSearchType>(null)
  const historySearchRef = useRef<HistorySearchType>(null)
  const isShowHotSearch = useSettingValue('search.isShowHotSearch')
  const isShowHistorySearch = useSettingValue('search.isShowHistorySearch')
  const t = useI18n()
  const theme = useTheme()
  const bottomInset = useBottomInset()

  const handleShow = (source: Source) => {
    hotSearchRef.current?.show(source)
    historySearchRef.current?.show()
  }

  useImperativeHandle(ref, () => ({
    show(source) {
      if (visible) handleShow(source)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(source)
        })
      }
    },
  }), [visible])

  return (
    visible
      ? isShowHotSearch || isShowHistorySearch
        ? (
            <ScrollView contentContainerStyle={{ paddingBottom: bottomInset + 24 }} showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                { isShowHotSearch ? <HotSearch ref={hotSearchRef} onSearch={onSearch} /> : null }
                { isShowHistorySearch ? <HistorySearch ref={historySearchRef} onSearch={onSearch} /> : null }
              </View>
            </ScrollView>
          )
        : (
            <View style={[styles.welcome, { paddingBottom: bottomInset + 24 }]}>
              <RecordArtwork seed="lx-search" style={styles.welcomeArtwork} />
              <Text size={28} color={theme['c-font']} style={styles.welcomeTitle}>{t('search__welcome')}</Text>
              <Text size={14} color={theme['c-font-label']}>{t('search_input_placeholder')}</Text>
            </View>
          )
      : null

  )
})


const styles = createStyle({
  content: {
    // paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 24,
    paddingRight: 24,
  },
  welcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  welcomeArtwork: { width: 160, height: 160, borderRadius: 20, marginBottom: 24 },
  welcomeTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
})
