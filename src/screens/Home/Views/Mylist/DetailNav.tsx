import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import Loading from '@/components/common/Loading'
import { useTheme } from '@/store/theme/hook'
import { useActiveListId, useActiveListName, useListFetching } from '@/store/list/uiHook'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'

export default ({ titleSize = 22 }: { titleSize?: number }) => {
  const theme = useTheme()
  const t = useI18n()
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
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: theme['c-primary-input-background'] }]}
        onPress={handleBack}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
      >
        <Icon name="chevron-left" color={theme['c-accent']} size={18} />
      </TouchableOpacity>
      { fetching ? <Loading color={theme['c-font']} style={styles.loading} /> : null }
      <Text style={styles.title} size={titleSize} color={theme['c-font']} numberOfLines={1}>{name}</Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: theme['c-primary-input-background'] }]}
        onPress={handleSearch}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={t('nav_search')}
      >
        <Icon name="search-2" color={theme['c-accent']} size={18} />
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
    paddingHorizontal: 12,
    gap: 8,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  loading: {
    marginRight: 2,
  },
})
