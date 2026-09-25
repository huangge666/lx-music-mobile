import { memo } from 'react'
import { View, Platform, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { BorderRadius } from '@/theme'
import { type ListInfoItem } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { scaleSizeW } from '@/utils/pixelRatio'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'

const gap = scaleSizeW(10)
export default memo(({ item, index, width, showSource, onPress }: {
  item: ListInfoItem
  index: number
  showSource: boolean
  width: number
  onPress: (item: ListInfoItem, index: number) => void
}) => {
  const theme = useTheme()
  const itemWidth = width - gap
  const handlePress = () => {
    onPress(item, index)
  }
  const meta = [item.author, item.play_count].filter(Boolean).join(' · ')
  return (
    item.source
      ? (
          <View style={{ ...styles.listItem, width: itemWidth }}>
          <View style={{ ...styles.listItemImg, backgroundColor: theme['c-card-background'] }}>
              <TouchableOpacity activeOpacity={0.78} onPress={handlePress}>
                <Image url={item.img} nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`} style={{ width: itemWidth, height: itemWidth, borderRadius: BorderRadius.large }} />
                <View style={styles.imageShade} />
                { item.play_count
                  ? (
                      <View style={styles.playCount}>
                        <Icon name="play" size={8} color="#fff" />
                        <Text style={styles.playCountText} size={10} color="#fff" numberOfLines={1}>{item.play_count}</Text>
                      </View>
                    )
                  : null }
                { showSource ? <Text style={{ ...styles.sourceLabel, backgroundColor: theme['c-primary-background'] }} size={9} color={theme['c-primary-font']} >{item.source}</Text> : null }
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={0.5} onPress={handlePress}>
                <Text style={styles.listItemTitle} numberOfLines={ 2 }>{item.name}</Text>
                { meta ? <Text style={styles.listItemMeta} size={11} color={theme['c-font-label']} numberOfLines={1}>{meta}</Text> : null }
            </TouchableOpacity>
          </View>
        )
      : <View style={{ ...styles.listItem, width: itemWidth }} />
  )
})

const styles = createStyle({
  listItem: {
    marginHorizontal: 5,
    marginBottom: 14,
  },
  listItemImg: {
    borderRadius: BorderRadius.large,
    marginBottom: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  playCount: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  playCountText: {
    fontWeight: '600',
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
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  listItemMeta: {
    marginTop: 2,
    lineHeight: 15,
  },
})
