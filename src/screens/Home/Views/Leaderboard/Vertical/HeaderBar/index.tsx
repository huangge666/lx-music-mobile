import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import SourceTab, { type SourceTabType } from './SourceTab'
import { useTheme } from '@/store/theme/hook'
import ActiveListName, { type ActiveListNameType } from './ActiveListName'

export interface HeaderBarProps {
  onShowBound: () => void
  onSourceChange: (source: LX.OnlineSource) => void
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}

/**
 * 排行榜头部栏 — 沉浸式双层导航
 * 第一层：平台 Tab（固定均分，一级导航）
 * 第二层：当前榜单选择 chip
 */
export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange }, ref) => {
  const activeListNameRef = useRef<ActiveListNameType>(null)
  const sourceTabRef = useRef<SourceTabType>(null)
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    setBound(source, id, name) {
      sourceTabRef.current?.setSource(source)
      activeListNameRef.current?.setBound(id, name)
    },
  }), [])

  return (
    <View style={styles.container}>
      {/* 平台 Tab — 最顶层一级导航 */}
      <View style={{ ...styles.sourceRow, borderBottomColor: theme['c-border-background'] }}>
        <SourceTab ref={sourceTabRef} onSourceChange={onSourceChange} />
      </View>
      {/* 第二层：榜单选择 */}
      <View style={styles.boardRow}>
        <ActiveListName ref={activeListNameRef} onShowBound={onShowBound} />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    zIndex: 2,
  },
  sourceRow: {
    height: 44,
    borderBottomWidth: 0.5,
  },
  boardRow: {
    minHeight: 40,
    paddingTop: 6,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
})
