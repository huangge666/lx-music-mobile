import { useEffect } from 'react'
import { View } from 'react-native'
import { useHorizontalMode } from '@/utils/hooks'

import Vertical from './Vertical'
import Horizontal from './Horizontal'
import StatusBar from '@/components/common/StatusBar'
import SizeView from '@/components/SizeView'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { createStyle } from '@/utils/tools'

/**
 * 播放详情根容器
 * — 不用 PageContent 的主题实色底，避免下半操作区透出底板色
 * — 背景完全由竖屏 AlbumBackground / 横屏自身处理
 */
export default ({ componentId }: { componentId: string }) => {
  const isHorizontalMode = useHorizontalMode()

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={styles.root}>
      <SizeView />
      <StatusBar />
      {
        isHorizontalMode
          ? <Horizontal componentId={componentId} />
          : <Vertical componentId={componentId} />
      }
    </View>
  )
}

const styles = createStyle({
  root: {
    flex: 1,
    // 全透明，只露出专辑氛围底
    backgroundColor: 'transparent',
  },
})
