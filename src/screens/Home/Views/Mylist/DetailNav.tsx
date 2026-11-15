import { View } from 'react-native'
import GlassIconButton from '@/components/common/GlassIconButton'
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
      <GlassIconButton
        name="chevron-left"
        label={t('back')}
        onPress={handleBack}
      />
      { fetching ? <Loading color={theme['c-font']} style={styles.loading} /> : null }
      <Text style={styles.title} size={titleSize} color={theme['c-font']} numberOfLines={1}>{name}</Text>
      <GlassIconButton
        name="search-2"
        label={t('nav_search')}
        onPress={handleSearch}
      />
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
  title: {
    flex: 1,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  loading: {
    marginRight: 2,
  },
})
