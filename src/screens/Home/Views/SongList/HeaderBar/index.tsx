import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View } from 'react-native'

import SortTab, { type SortTabProps, type SortTabType } from './SortTab'
import { createStyle } from '@/utils/tools'
import SourceSelector, {
  type SourceSelectorType,
  type SourceSelectorProps,
} from './SourceSelector'
import { type Source } from '@/store/songlist/state'
import { useTheme } from '@/store/theme/hook'
import OpenList, { type OpenListType } from './OpenList'

export interface HeaderBarProps {
  onSortChange: SortTabProps['onSortChange']
  onSourceChange: SourceSelectorProps['onSourceChange']
}

export interface HeaderBarType {
  setSource: (source: Source, sortId: string) => void
}

export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSortChange, onSourceChange }, ref) => {
  const sortTabRef = useRef<SortTabType>(null)
  const openListRef = useRef<OpenListType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    setSource(source, sortId) {
      sortTabRef.current?.setSource(source, sortId)
      sourceSelectorRef.current?.setSource(source)
      openListRef.current?.setInfo(source)
    },
  }), [])

  return (
    <View style={styles.container}>
      <View style={{ ...styles.sourceRow, borderBottomColor: theme['c-border-background'] }}>
        <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
      </View>
      <View style={styles.controlsRow}>
        <SortTab ref={sortTabRef} onSortChange={onSortChange} />
        <View style={styles.openList}>
          <OpenList ref={openListRef} />
        </View>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingBottom: 6,
    zIndex: 2,
  },
  sourceRow: {
    height: 44,
    borderBottomWidth: 0.5,
  },
  controlsRow: {
    minHeight: 44,
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  openList: {
    paddingLeft: 4,
    paddingRight: 12,
  },
})

