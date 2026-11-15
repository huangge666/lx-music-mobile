import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import { setSpText } from '@/utils/pixelRatio'
import { useI18n } from '@/lang'

/**
 * 小播放栏标题区。
 *
 * 标题区独立打开详情，长按仍定位歌曲；两行文字与播放器槽位共用字号。
 */
export default ({ componentId }: { isHome?: boolean, componentId?: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const t = useI18n()
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

  const titleLine = Math.ceil(setSpText(14) * 1.2)
  const singerLine = Math.ceil(setSpText(12) * 1.2)

  return (
    <TouchableOpacity style={styles.container} onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${t('player_open')} ${musicInfo.name}`}>
      <View style={styles.textCol}>
        <Text
          style={[styles.title, { lineHeight: titleLine }]}
          size={14}
          color={theme['c-font']}
          numberOfLines={1}
        >{musicInfo.name || t('player_idle')}</Text>
        <Text
          style={[styles.singer, { lineHeight: singerLine }]}
          size={12}
          color={theme['c-font']}
          numberOfLines={1}
        >
          {musicInfo.singer || ''}
        </Text>
      </View>
    </TouchableOpacity>
  )
}


const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 48,
    justifyContent: 'center',
  },
  textCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '600',
    includeFontPadding: false,
  },
  singer: {
    marginTop: 1,
    opacity: 0.75,
    includeFontPadding: false,
  },
})
