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
    backgroundColor: theme['c-glass-background'],
    borderWidth: BorderWidths.hairline,
    borderColor: theme['c-glass-border'],
    shadowColor: isDark ? '#000000' : theme['c-accent'],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.36 : 0.08,
    shadowRadius: 22,
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
  // NavRow 按压弹簧缩放作用在外层包装上，避免与瓷贴自身布局样式冲突
  iconBubbleWrapper: {
    flexShrink: 0,
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
