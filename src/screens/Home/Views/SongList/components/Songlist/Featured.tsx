import { memo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { type ListInfoItem } from '@/store/songlist/state'

interface Props {
  items: ListInfoItem[]
  /** 列表实测可用宽度（不含左右内容边距） */
  width: number
  onOpenDetail: (item: ListInfoItem, index: number) => void
}

/**
 * 浏览页第一排货架。
 *
 * 对齐 Sonify 首页推荐卡：大封面 + 圆角 14 的深色信息条，横向一次露出一张半。
 * 仍只用真实歌单的前几条，不造推荐数据，也不做封面取色。
 */
export default memo(({ items, width, onOpenDetail }: Props) => {
  const theme = useTheme()
  const t = useI18n()
  const cardWidth = Math.max(Math.min(Math.round(width * 0.72), 268), 160)
  const footerHeight = Math.round(cardWidth * 86 / 268)

  if (!items.length) return null

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} size={20} color={theme['c-font']}>{t('browse_featured')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + GAP}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={styles.row}
      >
        {items.map((item, index) => {
          const meta = [item.author, item.play_count].filter(Boolean).join(' · ')
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.72}
              onPress={() => { onOpenDetail(item, index) }}
              accessibilityRole="button"
              accessibilityLabel={[item.name, meta].filter(Boolean).join(' · ')}
              style={[styles.card, { width: cardWidth }]}
            >
              <Image url={item.img} style={{ width: cardWidth, height: cardWidth }} />
              <View style={[styles.footer, { height: footerHeight }]}>
                <Text style={styles.title} size={16} color="#FFFFFF" numberOfLines={1}>{item.name}</Text>
                {meta
                  ? <Text style={styles.meta} size={13} color="rgba(255, 255, 255, 0.6)" numberOfLines={1}>{meta}</Text>
                  : null}
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
})

const GAP = 10

const styles = createStyle({
  section: {
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    paddingBottom: 12,
  },
  row: {
    gap: GAP,
    paddingRight: 4,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgb(28, 28, 30)',
  },
  footer: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgb(17, 17, 19)',
  },
  title: {
    fontWeight: '700',
  },
  meta: {
    marginTop: 2,
  },
})
