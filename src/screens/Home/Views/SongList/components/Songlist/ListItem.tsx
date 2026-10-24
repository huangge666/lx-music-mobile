import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { type ListInfoItem } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import Image from '@/components/common/Image'

export default memo(({ item, index, width, showSource, onPress }: {
  item: ListInfoItem
  index: number
  showSource: boolean
  width: number
  onPress: (item: ListInfoItem, index: number) => void
}) => {
  const theme = useTheme()
  // 列宽与列间距由列表统一计算，这里只按给定宽度渲染
  const itemWidth = width
  const handlePress = () => {
    onPress(item, index)
  }
  const meta = [item.author, item.play_count].filter(Boolean).join(' · ')
  return (
    item.source
      ? (
          <View style={{ ...styles.listItem, width: itemWidth }}>
          <View style={{ ...styles.listItemImg, backgroundColor: theme['c-primary-input-background'] }}>
              <TouchableOpacity activeOpacity={0.72} onPress={handlePress}>
                <Image url={item.img} nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`} style={{ width: itemWidth, height: itemWidth, borderRadius: 14 }} />
                { showSource ? <Text style={{ ...styles.sourceLabel, backgroundColor: theme['c-accent'] }} size={9} color="#FFFFFF" >{item.source}</Text> : null }
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={0.5} onPress={handlePress}>
                <Text style={styles.listItemTitle} size={13} numberOfLines={2}>{item.name}</Text>
                { meta ? (
                  <Text style={styles.listItemMeta} size={12} color={theme['c-font-label']} numberOfLines={1}>{meta}</Text>
                ) : null }
            </TouchableOpacity>
          </View>
        )
      : <View style={{ ...styles.listItem, width: itemWidth }} />
  )
})

const styles = createStyle({
  listItem: {
    marginBottom: 16,
  },
  listItemImg: {
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sourceLabel: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  listItemTitle: {
    lineHeight: 17,
    fontWeight: '500',
  },
  listItemMeta: {
    marginTop: 2,
    lineHeight: 16,
  },
})
