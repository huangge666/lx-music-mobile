import { createStyle } from '@/utils/tools'
import { View } from 'react-native'
import PlayModeBtn from './PlayModeBtn'
import QueueBtn from './QueueBtn'
import MusicAddBtn from './MusicAddBtn'


/** 工具栏置于歌词区顶部，不再绝对定位到封面和播放控制之上。 */
export default () => {
  return (
    <View style={styles.container}>
      <MusicAddBtn />
      <PlayModeBtn />
      <QueueBtn />
    </View>
  )
}


const styles = createStyle({
  container: {
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 16,
  },
})
