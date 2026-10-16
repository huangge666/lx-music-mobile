import { TouchableOpacity } from 'react-native'
import Button from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { openLeaderboard } from '@/core/common'

/**
 * 首页辅助抽屉的显式入口。
 * 抽屉只承载下载、设置与受开关控制的回桌面/退出，
 * 三个主标签改由底部标签栏切换，因此这里不再重复主标签菜单。
 */
export const MoreButton = () => {
  const t = useI18n()
  const theme = useTheme()

  return (
    <TouchableOpacity
      style={[styles.iconButton, { backgroundColor: theme['c-glass-surface'], borderColor: theme['c-glass-border'] }]}
      onPress={() => { global.app_event.changeMenuVisible(true) }}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={t('nav_more')}
    >
      <Icon name="dots-vertical" size={18} color={theme['c-font']} />
    </TouchableOpacity>
  )
}

/**
 * 浏览页的排行榜入口。
 * 排行榜是浏览的覆盖页，打开时先把父级固定为浏览，返回也回到浏览。
 */
export const LeaderboardEntry = () => {
  const t = useI18n()
  const theme = useTheme()

  return (
    <Button
      style={{ ...styles.chip, backgroundColor: theme['c-glass-surface'], borderColor: theme['c-glass-border'] }}
      onPress={openLeaderboard}
      accessibilityRole="button"
      accessibilityLabel={t('nav_top')}
    >
      <Icon name="leaderboard" size={14} color={theme['c-font']} />
      <Text color={theme['c-font']} size={13} style={styles.chipText}>{t('nav_top')}</Text>
    </Button>
  )
}

const styles = createStyle({
  iconButton: {
    width: 34,
    height: 34,
    marginLeft: 8,
    borderRadius: 17,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    minHeight: 30,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  chipText: {
    fontWeight: '600',
  },
})
