import { memo } from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import Text from './Text'
import { Icon } from './Icon'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'

/**
 * 首屏状态与分页页脚分离：空列表不再把“到底了”当作搜索结果。
 *
 * Phase 6A：加载/空/失败共用同一套排版与配色，下载等辅助页面通过
 * `title` / `hint` 覆盖文案复用，不再各写一份纯文本提示。
 */
export default memo(({
  status,
  search = false,
  onRetry,
  title,
  hint,
}: {
  status: 'loading' | 'refreshing' | 'end' | 'error' | 'idle'
  search?: boolean
  onRetry: () => void
  /** 覆盖标题文案；不传时按 status/search 取默认的多语言文案 */
  title?: string
  /** 覆盖说明文案；不传时取默认文案 */
  hint?: string
}) => {
  const theme = useTheme()
  const t = useI18n()
  if (status == 'idle') return null
  const loading = status == 'loading' || status == 'refreshing'
  const error = status == 'error'
  const titleText = title ?? t(loading ? 'list_loading' : error ? 'list_load_failed' : search ? 'search_no_results' : 'list_no_content')
  const hintText = hint ?? t(error ? 'list_load_failed_hint' : search ? 'search_no_results_hint' : 'list_no_content_hint')
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View style={[styles.icon, { backgroundColor: theme['c-accent-soft'] }]}>
        {loading
          ? <ActivityIndicator color={theme['c-accent']} />
          : <Icon name={error ? 'retry' : search ? 'search-2' : 'music'} size={26} color={theme['c-accent']} />}
      </View>
      <Text style={styles.title} size={17}>{titleText}</Text>
      {!loading && <Text style={styles.hint} size={13} color={theme['c-font-label']}>{hintText}</Text>}
      {error && (
        <TouchableOpacity onPress={onRetry} style={[styles.retry, { backgroundColor: theme['c-accent-soft'] }]} accessibilityRole="button" accessibilityLabel={t('download_retry')} activeOpacity={0.65}>
          <Icon name="retry" size={16} color={theme['c-accent']} />
          <Text color={theme['c-accent']} style={styles.retryText}>{t('download_retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
})

const styles = createStyle({
  container: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  icon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { textAlign: 'center', fontWeight: '600' },
  hint: { textAlign: 'center', marginTop: 8, lineHeight: 21 },
  retry: { minHeight: 48, paddingHorizontal: 24, borderRadius: 24, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  retryText: { marginLeft: 8, fontWeight: '600' },
})
