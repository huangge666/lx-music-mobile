import { memo } from 'react'
import { ScrollView, Pressable, StyleSheet, View } from 'react-native'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import RecordArtwork from '@/components/common/RecordArtwork'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { type ListInfoItem } from '@/store/songlist/state'

interface Props {
  items: ListInfoItem[]
  width: number
  onOpenDetail: (item: ListInfoItem, index: number) => void
}

const GAP = 14

/** 当前平台返回的真实歌单。横向唱片架与下方网格共用详情入口，不生成推荐数据。 */
export default memo(({ items, width, onOpenDetail }: Props) => {
  const theme = useTheme()
  const t = useI18n()
  const cardWidth = Math.min(Math.max(width * 0.9, 220), 440)
  const coverSize = Math.round(cardWidth * 0.46)
  if (!items.length) return null

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text size={24} style={styles.headingText} accessibilityRole="header">{t('browse_featured')}</Text>
        <Text size={11} color={theme['c-font-label']} style={styles.edition}>{String(items.length).padStart(2, '0')} / LX</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={cardWidth + GAP}
        snapToAlignment="start" disableIntervalMomentum contentContainerStyle={styles.row}>
        {items.map((item, index) => (
          <Pressable key={`${item.source}_${item.id}`} onPress={() => { onOpenDetail(item, index) }}
            accessibilityRole="button" accessibilityLabel={[item.name, item.author].filter(Boolean).join(' · ')}
            style={({ pressed }) => [styles.card, { width: cardWidth, opacity: pressed ? 0.88 : 1 }]}>
            <RecordArtwork seed={item.id} style={[styles.record, { width: cardWidth, height: cardWidth }]} />
            <View style={styles.scrim} pointerEvents="none" />
            <View style={styles.cardTop}>
              <Text size={12} color="#D3EFA5" style={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</Text>
              <View style={styles.open}><Icon name="chevron-right" rawSize={20} color="#F4F8EB" /></View>
            </View>
            <Image url={item.img} style={{ ...styles.cover, width: coverSize, height: coverSize }} />
            <View style={styles.info}>
              <Text size={24} color="#F4F8EB" style={styles.title} numberOfLines={2}>{item.name}</Text>
              <Text size={12} color="#D8E5CB" style={styles.meta} numberOfLines={1}>{[item.author, item.play_count].filter(Boolean).join(' · ')}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
})

const styles = StyleSheet.create({
  section: { paddingTop: 12, marginBottom: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headingText: { fontWeight: '800', letterSpacing: -0.6 },
  edition: { fontWeight: '600', letterSpacing: 1.3, fontVariant: ['tabular-nums'] },
  row: { gap: GAP, paddingRight: 4 },
  card: { minHeight: 288, borderRadius: 22, overflow: 'hidden', backgroundColor: '#243622', justifyContent: 'space-between' },
  record: { position: 'absolute', right: -48, top: -38 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,23,12,0.22)' },
  cardTop: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { fontWeight: '700', letterSpacing: 2 },
  open: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  cover: { position: 'absolute', right: 34, top: 52, borderRadius: 10, transform: [{ rotate: '-9deg' }] },
  info: { marginTop: 128, padding: 20, backgroundColor: 'rgba(13,30,15,0.88)' },
  title: { fontWeight: '800', letterSpacing: -0.5 },
  meta: { marginTop: 7 },
})
