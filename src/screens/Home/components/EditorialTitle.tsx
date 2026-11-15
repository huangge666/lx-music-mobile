import { View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { getMainNavIndex, type MAIN_NAV_ID_Type } from '@/config/constant'

interface Props {
  id: MAIN_NAV_ID_Type
  compact?: boolean
}

/** 两种方向共用的标题层级；序号来自真实主导航顺序，不另维护一份编号。 */
export default ({ id, compact = false }: Props) => {
  const theme = useTheme()
  const t = useI18n()
  return (
    <View style={styles.container}>
      <View style={styles.signature} accessible={false}>
        <View style={[styles.rule, { backgroundColor: theme['c-accent'] }]} />
        <Text size={10} color={theme['c-font-label']} style={styles.wordmark}>LX / MUSIC</Text>
        <Text size={10} color={theme['c-font-label']} style={styles.number}>{String(getMainNavIndex(id) + 1).padStart(2, '0')}</Text>
      </View>
      <Text accessibilityRole="header" numberOfLines={1} size={compact ? 24 : 38} style={styles.title}>{t(id)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 3 },
  signature: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rule: { width: 16, height: 2 },
  wordmark: { fontWeight: '700', letterSpacing: 2, includeFontPadding: false },
  number: { fontVariant: ['tabular-nums'], letterSpacing: 1, marginLeft: 2 },
  title: { fontWeight: '800', letterSpacing: -1.2, includeFontPadding: false },
})
