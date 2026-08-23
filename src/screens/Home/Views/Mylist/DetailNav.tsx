import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import Loading from '@/components/common/Loading'
import { useTheme } from '@/store/theme/hook'
import { useActiveListId, useActiveListName, useListFetching } from '@/store/list/uiHook'
import { createStyle } from '@/utils/tools'
import { HEADER_HEIGHT } from '@/config/constant'

export default ({ titleSize = 22 }: { titleSize?: number }) => {
  const theme = useTheme()
  const currentListId = useActiveListId()
  const fetching = useListFetching(currentListId)
  const name = useActiveListName()

  const handleBack = () => {
    global.app_event.changeLoveListVisible(true)
  }
  const handleSearch = () => {
    global.app_event.showMylistSearch()
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={handleBack} activeOpacity={0.6}>
        <Icon name="chevron-left" color={theme['c-primary']} size={20} />
      </TouchableOpacity>
      { fetching ? <Loading color={theme['c-font']} style={styles.loading} /> : null }
      <Text style={styles.title} size={titleSize} color={theme['c-font']} numberOfLines={1}>{name}</Text>
      <TouchableOpacity style={styles.btn} onPress={handleSearch} activeOpacity={0.6}>
        <Icon name="search-2" color={theme['c-font']} size={20} />
      </TouchableOpacity>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  btn: {
    width: HEADER_HEIGHT,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  loading: {
    marginRight: 6,
  },
})
