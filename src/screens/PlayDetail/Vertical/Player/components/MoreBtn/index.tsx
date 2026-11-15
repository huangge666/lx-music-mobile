import { memo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import PlayModeBtn from './PlayModeBtn'
import QueueBtn from './QueueBtn'
import DownloadBtn from './DownloadBtn'


/**
 * 底部功能栏 — 无背景
 * 1. 播放顺序（列表循环 / 顺序 / 随机 / 单曲循环 / 单曲）
 * 2. 下载
 * 3. 当前播放列表
 */
const ActionBar = () => {
  return (
    <View style={styles.container}>
      <PlayModeBtn />
      <DownloadBtn />
      <QueueBtn />
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    // 与切歌栏贴紧
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
})

export default memo(ActionBar)
