import { memo, useEffect } from 'react'
import { View, AppState } from 'react-native'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import MoreBtn from './MoreBtn'

import Header from './components/Header'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'

import Pic from './Pic'
// import ControlBtn from './ControlBtn'
import Lyric from './Lyric'
import Player from './Player'
import { createStyle } from '@/utils/tools'
import AlbumBackground from '../Vertical/components/AlbumBackground'
import SongTitle from '../Vertical/SongTitle'

export default memo(({ componentId }: { componentId: string }) => {
  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
    screenkeepAwake()
    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    return () => {
      appstateListener.remove()
      screenUnkeepAwake()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={styles.root}>
      <AlbumBackground />
      <Header />
      <View style={styles.container}>
        <View style={styles.left}>
          <Pic componentId={componentId} />
          <SongTitle compact />
          <Player />
        </View>
        <View style={styles.right}>
          <MoreBtn />
          <Lyric />
        </View>
      </View>
    </View>
  )
})

const styles = createStyle({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  left: {
    width: '44%',
    paddingBottom: 10,
    minHeight: 0,
    overflow: 'hidden',
  },
  right: {
    width: '56%',
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 0,
  },
})
