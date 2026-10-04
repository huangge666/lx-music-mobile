import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export default ({ onRetry }: { onRetry: () => void }) => {
  const t = useI18n()
  const theme = useTheme()
  return (
    <View style={[styles.container, { backgroundColor: theme['c-accent-soft'] }]}>
      <Text style={styles.message} size={12} color={theme['c-font-label']} accessibilityLiveRegion="polite">{t('search_partial_failed')}</Text>
      <TouchableOpacity style={styles.retry} onPress={onRetry} accessibilityRole="button" accessibilityLabel={t('download_retry')} activeOpacity={0.6}>
        <Icon name="retry" size={14} color={theme['c-accent']} />
        <Text size={13} color={theme['c-accent']} style={styles.label}>{t('download_retry')}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = createStyle({
  container: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, paddingLeft: 14, borderRadius: 14 },
  message: { flex: 1, lineHeight: 18, paddingVertical: 10 },
  retry: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  label: { marginLeft: 6 },
})
