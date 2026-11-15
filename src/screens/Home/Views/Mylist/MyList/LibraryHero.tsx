import { memo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import RecordArtwork from '@/components/common/RecordArtwork'
import { useI18n } from '@/lang'
import { useListMusicCount } from '@/store/list/hook'
import { useHorizontalMode } from '@/utils/hooks'

interface Props {
  list: LX.List.MyListInfo
  onPress: (list: LX.List.MyListInfo) => void
}

/** 资料库主视觉链接到真实歌单；歌曲数只读取已有索引，不为装饰拉取整张列表。 */
export default memo(({ list, onPress }: Props) => {
  const t = useI18n()
  const count = useListMusicCount(list.id)
  const wide = useHorizontalMode()
  return (
    <Pressable onPress={() => { onPress(list) }} accessibilityRole="button" accessibilityLabel={list.name}
      style={({ pressed }) => [styles.container, wide ? styles.compact : null, { opacity: pressed ? 0.86 : 1 }]}>
      <RecordArtwork seed={list.id} style={styles.artwork} />
      <View style={styles.scrim} pointerEvents="none" />
      <View style={[styles.content, wide ? styles.compactContent : null]}>
        <View style={wide ? styles.compactInfo : null}>
          {!wide ? <Text size={11} color="#D3EFA5" style={styles.kicker}>{t('library_personal_collection')}</Text> : null}
          <Text size={wide ? 22 : 27} color="#F4F8EB" style={styles.title} numberOfLines={2}>{list.name}</Text>
          {count != null ? <Text size={13} color="#D6DFCB" style={styles.meta}>{t('list_music_count', { num: count })}</Text> : null}
        </View>
        <View style={[styles.link, wide ? styles.compactLink : null]}>
          <Icon name="chevron-right" rawSize={18} color="#D3EFA5" />
          <Text size={12} color="#D3EFA5" style={styles.linkText}>{t('songlist_open')}</Text>
        </View>
      </View>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  container: { minHeight: 188, borderRadius: 22, overflow: 'hidden', backgroundColor: '#243622', marginBottom: 22 },
  compact: { minHeight: 88, marginBottom: 12 },
  artwork: { position: 'absolute', width: 250, height: 250, right: -76, top: -25, transform: [{ rotate: '-12deg' }] },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,25,12,0.26)' },
  content: { padding: 22, width: '74%' },
  compactContent: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 20 },
  compactInfo: { flex: 1 },
  kicker: { fontWeight: '700', letterSpacing: 1.2, marginBottom: 13 },
  title: { fontWeight: '800', letterSpacing: -0.7 },
  meta: { marginTop: 5 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 18 },
  compactLink: { marginTop: 0 },
  linkText: { fontWeight: '600' },
})
