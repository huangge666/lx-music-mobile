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

const gap = scaleSizeW(15)
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
  return (
    item.source
      ? (
          <View style={{ ...styles.listItem, width: itemWidth }}>
          <View style={{ ...styles.listItemImg, backgroundColor: theme['c-card-background'] }}>
              <TouchableOpacity activeOpacity={0.78} onPress={handlePress}>
                <Image url={item.img} nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`} style={{ width: itemWidth, height: itemWidth, borderRadius: BorderRadius.large }} />
                <View style={styles.imageShade} />
                { showSource ? <Text style={{ ...styles.sourceLabel, backgroundColor: theme['c-primary-background'] }} size={9} color={theme['c-primary-font']} >{item.source}</Text> : null }
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={0.5} onPress={handlePress}>
                <Text style={styles.listItemTitle} numberOfLines={ 2 }>{item.name}</Text>
            </TouchableOpacity>
            {/* <Text>{JSON.stringify(item)}</Text> */}
          </View>
        )
      : <View style={{ ...styles.listItem, width: itemWidth }} />
  )
})

const styles = createStyle({
  listItem: {
    margin: 8,
    paddingBottom: 4,
  },
  listItemImg: {
    borderRadius: BorderRadius.large,
    marginBottom: 9,
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
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
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
    marginBottom: 5,
  },
})
