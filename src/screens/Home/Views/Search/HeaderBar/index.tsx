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
 * Apple Music 风格搜索栏
 *
 * — 整体浅灰圆角背景容器
 * — 源选择器 + 搜索输入横向排列
 * — 无硬边框，用背景色区分
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
        ...styles.searchBar,
        backgroundColor: theme['c-glass-background'],
        borderColor: theme['c-glass-border'],
      }}>
        <View style={styles.selector}>
          <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} center />
        </View>
        <SearchInput
          ref={searchInputRef}
          onChangeText={onTipSearch}
          onSubmit={onSearch}
          onBlur={onHideTipList}
          onTouchStart={onShowTipList}
        />
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
  searchBar: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    borderWidth: 0.5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  selector: {
    flexGrow: 0,
    flexShrink: 0,
  },
})
