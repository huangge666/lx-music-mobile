import { TouchableOpacity, View } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo, useProgress } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import Text from '@/components/common/Text'
import { LIST_IDS, COMPONENT_IDS } from '@/config/constant'
import { usePageVisible } from '@/store/common/hook'
import { useCallback, useState } from 'react'
import { createStyle, formatMusicName } from '@/utils/tools'

const TIME_FONT_SIZE = 10

/**
 * 小播放栏标题区
 *
 * 布局：
 * — 左侧纵向：歌名 + 歌手名
 * — 右侧：时长（小字、灰色，与歌手名同一行右侧）
 *
 * 设计原则：
 * — 标题区只负责"歌名 / 歌手 / 时长"，进度条单独在 PlayInfo 中
 * — 时长跟随播放进度实时更新（仅小播放栏展示）
 */
export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const downloadFileName = useSettingValue('download.fileName')
  const theme = useTheme()
  const [autoUpdate, setAutoUpdate] = useState(true)
  const { nowPlayTimeStr, maxPlayTimeStr } = useProgress(autoUpdate)

  usePageVisible([COMPONENT_IDS.home], useCallback((visible) => {
    if (isHome) setAutoUpdate(visible)
  }, [isHome]))

  const handlePress = () => {
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)
  }

  const handleLongPress = () => {
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  const title = musicInfo.id
    ? musicInfo.singer
      ? formatMusicName(downloadFileName, musicInfo.name, musicInfo.singer)
      : musicInfo.name
    : ''
  // 引用一次避免未使用变量告警（同时为未来扩展预留）
  void title

  return (
    <TouchableOpacity style={styles.container} onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7}>
      {/* 左侧：歌名 + 歌手名（纵向） */}
      <View style={styles.textCol}>
        {/* Semibold 歌名 */}
        <Text style={styles.title} color={theme['c-font']} numberOfLines={1}>{musicInfo.name || 'Not Playing'}</Text>
        {/* 歌手名 + 时长（同一行：左歌手，右时长） */}
        <View style={styles.singerRow}>
          <Text style={styles.singer} size={11} color={theme['c-font-label']} numberOfLines={1}>
            {musicInfo.singer || ''}
          </Text>
          {
            musicInfo.id ? (
              <Text style={styles.time} size={TIME_FONT_SIZE} color={theme['c-500']} numberOfLines={1}>
                {`${nowPlayTimeStr} / ${maxPlayTimeStr}`}
              </Text>
            ) : null
          }
        </View>
      </View>
    </TouchableOpacity>
  )
}


const styles = createStyle({
  container: {
    width: '100%',
    paddingHorizontal: 4,
    justifyContent: 'flex-start',
  },
  textCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '700',
    fontSize: 11,
  },
  singerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    // 行内左右对齐：歌手左、时长右
    justifyContent: 'space-between',
    width: '100%',
  },
  singer: {
    fontSize: 10,
    // 歌手占左侧主空间，时长在右
    flexShrink: 1,
    marginRight: 6,
  },
  time: {
    fontSize: TIME_FONT_SIZE,
    flexShrink: 0,
  },
})
