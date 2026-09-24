import { ScrollView } from 'react-native'

import { createStyle } from '@/utils/tools'
import { SettingScreen, type SettingScreenIds } from '../Main'

export default ({ id }: { id: SettingScreenIds }) => {
  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      style={{
        flex: 1,
        backgroundColor: 'transparent',
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
