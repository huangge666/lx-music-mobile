import { useTheme } from '@/store/theme/hook'
import { BorderRadius, BorderWidths } from '@/theme'
import { createStyle } from '@/utils/tools'

/**
 * 弥散流体水光玻璃风格 — 设置卡片质感
 * — 柔润水光半透底
 * — 细致微光边框与环境色漫反射阴影
 */
export const useSettingCardStyle = () => {
  const theme = useTheme()
  const isDark = theme.isDark

  return {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.045)' : theme['c-content-background'],
    borderWidth: BorderWidths.hairline,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme['c-glass-border'],
    shadowColor: isDark ? '#000000' : theme['c-primary'],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.32 : 0.08,
    shadowRadius: 20,
    elevation: 4,
  }
}

export const settingLayout = createStyle({
  card: {
    borderRadius: BorderRadius.xlarge,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  cardTitle: {
    paddingHorizontal: 2,
    marginBottom: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    minHeight: 52,
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
    marginTop: 3,
    lineHeight: 16,
  },
  inset: {
    borderRadius: BorderRadius.normal,
    overflow: 'hidden',
  },
})
