import { TouchableOpacity, View } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import { setSpText } from '@/utils/pixelRatio'
import { createStyle, formatMusicName } from '@/utils/tools'

/**
 * 小播放栏标题区。
 *
 * 对齐 Sonify 手机迷你条：歌名 12 / 中等字重，歌手 11 且 60% 不透明。
 * 行高压到字号本身，避免 Android 字体内边距把 43dp 胶囊撑破。
 */
export default ({ componentId }: { isHome?: boolean, componentId?: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const downloadFileName = useSettingValue('download.fileName')
  const theme = useTheme()

  const handlePress = () => {
    if (!musicInfo.id) return
    const targetComponentId = componentId ?? commonState.componentIds.home
    if (!targetComponentId) return
    navigations.pushPlayDetailScreen(targetComponentId)
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
  const titleLine = setSpText(12)
  const singerLine = setSpText(11)

  return (
    <TouchableOpacity style={styles.container} onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.textCol}>
        <Text
          style={[styles.title, { lineHeight: titleLine }]}
          size={12}
          color={theme['c-font']}
          numberOfLines={1}
        >{musicInfo.name || 'Not Playing'}</Text>
        <Text
          style={[styles.singer, { lineHeight: singerLine }]}
          size={11}
          color={theme['c-font']}
          numberOfLines={1}
        >
          {musicInfo.singer || ''}
        </Text>
      </View>
    </TouchableOpacity>
  )
}


const styles = createStyle({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  textCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '500',
    includeFontPadding: false,
  },
  singer: {
    marginTop: 1,
    opacity: 0.6,
    includeFontPadding: false,
  },
})
