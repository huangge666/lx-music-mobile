import { useRef, forwardRef, useImperativeHandle } from 'react'
import { View } from 'react-native'

import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import SearchInput, { type SearchInputType, type SearchInputProps } from './SearchInput'
import SearchTypeSelector from '../SearchTypeSelector'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { type Source as MusicSource } from '@/store/search/music/state'
import { type Source as SonglistSource } from '@/store/search/songlist/state'

type Sources = Readonly<Array<MusicSource | SonglistSource>>
type SourceSelectorProps = _SourceSelectorProps<Sources>
type SourceSelectorType = _SourceSelectorType<Sources>

export interface HeaderBarProps {
  onSourceChange: SourceSelectorProps['onSourceChange']
  onTipSearch: SearchInputProps['onChangeText']
  onSearch: SearchInputProps['onSubmit']
  onHideTipList: SearchInputProps['onBlur']
  onShowTipList: SearchInputProps['onTouchStart']
}

export interface HeaderBarType {
  setSourceList: SourceSelectorType['setSourceList']
  setText: SearchInputType['setText']
  blur: SearchInputType['blur']
}


/**
 * 搜索头部：输入框独占一行，平台与搜索类型统一放在下方筛选区。
 * ref 合同保持不变，外部仍可切换来源、回填文本和收起键盘。
 */
export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSourceChange, onTipSearch, onSearch, onHideTipList, onShowTipList }, ref) => {
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const searchInputRef = useRef<SearchInputType>(null)
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    setSourceList(list, source) {
      sourceSelectorRef.current?.setSourceList(list, source)
    },
    setText(text) {
      searchInputRef.current?.setText(text)
    },
    blur() {
      searchInputRef.current?.blur()
    },
  }), [])


  return (
    <View style={styles.wrap}>
      <View style={{
        ...styles.inputRow,
        backgroundColor: theme['c-primary-input-background'],
        borderColor: theme['c-border-background'],
      }}>
        <SearchInput
          ref={searchInputRef}
          onChangeText={onTipSearch}
          onSubmit={onSearch}
          onBlur={onHideTipList}
          onTouchStart={onShowTipList}
        />
      </View>
      <View style={[styles.filterRow, { backgroundColor: theme['c-primary-input-background'], borderColor: theme['c-border-background'] }]}>
        <View style={styles.selector}>
          <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} center />
        </View>
        <SearchTypeSelector />
      </View>
    </View>
  )
})

const styles = createStyle({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    zIndex: 2,
  },
  inputRow: {
    height: 48,
    borderRadius: 14,
    borderWidth: 0.5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  filterRow: {
    minHeight: 44,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 0.5,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selector: {
    flex: 1,
    minWidth: 0,
    height: 42,
    justifyContent: 'center',
  },
})
