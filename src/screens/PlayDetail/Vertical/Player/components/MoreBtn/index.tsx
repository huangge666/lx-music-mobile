import { memo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import PlayModeBtn from './PlayModeBtn'
import DownloadBtn from './DownloadBtn'
import CommentBtn from './CommentBtn'
import { MacSpacing } from '../../../../macOS'


/**
 * 底部功能栏 — 无背景
 * 1. 播放顺序（列表循环 / 顺序 / 随机 / 单曲循环 / 单曲）
 * 2. 下载
 * 3. 评论
 */
const ActionBar = () => {
  return (
    <View style={styles.container}>
      <PlayModeBtn />
      <DownloadBtn />
      <CommentBtn />
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: MacSpacing.xl,
    // 与切歌栏贴紧
    paddingVertical: MacSpacing.xs,
    backgroundColor: 'transparent',
  },
})

export default memo(ActionBar)
