import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

/**
 * 首页辅助抽屉的显式入口。
 * 抽屉只承载下载、设置与受开关控制的回桌面/退出。
 * Phase 7 起四个主标签都由底部标签栏切换；排行榜也升为主标签，
 * 浏览页不再需要额外的排行榜按钮。
 */
export const MoreButton = () => {
  const t = useI18n()
  const theme = useTheme()

  return (
    <TouchableOpacity
      style={[styles.iconButton, { backgroundColor: theme['c-primary-input-background'] }]}
      onPress={() => { global.app_event.changeMenuVisible(true) }}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={t('nav_more')}
    >
      <Icon name="dots-vertical" size={18} color={theme['c-font']} />
    </TouchableOpacity>
  )
}

const styles = createStyle({
  iconButton: {
    width: 32,
    height: 32,
    marginLeft: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
