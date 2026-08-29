import { ScrollView } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { SettingScreen, type SettingScreenIds } from '../Main'

export default ({ id }: { id: SettingScreenIds }) => {
  const theme = useTheme()

  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      style={{
        flex: 1,
        backgroundColor: theme['c-card-background'],
      }}
      contentContainerStyle={styles.content}
    >
      <SettingScreen id={id} />
    </ScrollView>
  )
}

const styles = createStyle({
  content: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 16,
    paddingBottom: 88,
    flexGrow: 1,
  },
})
