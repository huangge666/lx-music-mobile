import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useHorizontalMode } from '@/utils/hooks'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { LIST_IDS, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { useCallback } from 'react'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'
import { useI18n } from '@/lang'
import RecordArtwork from '@/components/common/RecordArtwork'

// 封面与固定 dp 的操作热区配套，不随屏幕缩放重复放大。
// 横屏条更高，封面放到 40dp。都不能走屏幕缩放，否则会冲出固定槽位。
const PHONE_PIC_SIZE = 36
const WIDE_PIC_SIZE = 40
const PIC_RADIUS = 10

export default ({ isHome, embedded = false, componentId }: { isHome: boolean, embedded?: boolean, componentId?: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const t = useI18n()
  const wide = useHorizontalMode()
  const size = wide && !embedded ? WIDE_PIC_SIZE : PHONE_PIC_SIZE
  const radius = PIC_RADIUS
  const handlePress = () => {
    if (!musicInfo.id) return
    const targetComponentId = componentId ?? commonState.componentIds.home
    if (!targetComponentId) return
    navigations.pushPlayDetailScreen(targetComponentId)
  }

  const handleLongPress = () => {
    if (!isHome) return
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({
      pic: null,
    })
  }, [])

  return (
    <TouchableOpacity style={styles.button} onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('player_open')}>
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
        <RecordArtwork seed={musicInfo.id ?? 'lx-player'} style={StyleSheet.absoluteFill} />
        <Image url={musicInfo.pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={{ width: size, height: size, borderRadius: radius }} onError={handleError} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: { minWidth: 40, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
})
