import { TouchableOpacity, View } from 'react-native'

import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { type SettingScreenIds } from '../Main'

export default ({
  id,
  onBack,
}: {
  id: SettingScreenIds
  onBack: () => void
}) => {
  const theme = useTheme()
  const t = useI18n()

  return (
    <View
      style={{
        ...styles.container,
        borderBottomColor: theme['c-glass-border'],
        backgroundColor: theme['c-glass-background'],
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
        style={styles.backBtn}
      >
        <Icon name="chevron-left" color={theme['c-primary']} size={20} />
      </TouchableOpacity>
      <Text numberOfLines={1} size={16} style={styles.title} color={theme['c-font']}>
        {t(`setting_${id}`)}
      </Text>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderBottomWidth: 0.5,
    flexShrink: 0,
  },
  backBtn: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    paddingRight: 16,
    fontWeight: '600',
  },
})
