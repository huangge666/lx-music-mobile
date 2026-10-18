import { useTheme } from '@/store/theme/hook'
import { BorderRadius, BorderWidths } from '@/theme'
import { createStyle } from '@/utils/tools'

/**
 * 设置分组卡（Phase 6A）
 *
 * 内容区不再使用玻璃：实色卡片压在页面底上，只用一条中性发丝线描边，
 * 不带阴影、不带顶部高光，避免设置页保留第二套玻璃风格。
 * 玻璃仍然只用于导航控制区、抽屉和弹层。
 */
export const useSettingCardStyle = () => {
  const theme = useTheme()

  return {
    backgroundColor: theme['c-card-background'],
    borderWidth: BorderWidths.hairline,
    borderColor: theme['c-border-background'],
  }
}

export const settingLayout = createStyle({
  card: {
    borderRadius: BorderRadius.large,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardTitle: {
    paddingHorizontal: 2,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: BorderWidths.hairline,
  },
  // NavRow 按压弹簧缩放作用在外层包装上，避免与瓷贴自身布局样式冲突
  iconBubbleWrapper: {
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
    marginTop: 3,
    lineHeight: 16,
  },
  inset: {
    borderRadius: BorderRadius.normal,
    overflow: 'hidden',
  },
})
