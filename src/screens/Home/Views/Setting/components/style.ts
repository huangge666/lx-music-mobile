import { useTheme } from '@/store/theme/hook'
import { BorderRadius } from '@/theme'
import { createStyle } from '@/utils/tools'

/**
 * CyShineMusic 风格设置卡片：大圆角、轻阴影、抬升底
 */
export const useSettingCardStyle = () => {
  const theme = useTheme()
  const isDark = theme.isDark

  return {
    backgroundColor: isDark ? theme['c-card-background'] : theme['c-content-background'],
    shadowColor: isDark ? '#000000' : theme['c-primary'],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.38 : 0.12,
    shadowRadius: 22,
    elevation: 6,
  }
}

export const settingLayout = createStyle({
  card: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    marginBottom: 24,
    overflow: 'visible',
  },
  cardTitle: {
    paddingHorizontal: 2,
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 56,
  },
  rowBody: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontWeight: '500',
  },
  rowSubtitle: {
    marginTop: 4,
    lineHeight: 16,
  },
  inset: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
})
