import { memo, useRef, type ReactNode } from 'react'
import { View, TouchableOpacity, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'

import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'

export interface MusicRowPosition {
  x: number
  y: number
  w: number
  h: number
}

export interface MusicRowProps {
  title: string
  subtitle?: string | null
  coverUrl?: string | null
  duration?: string | null
  active?: boolean
  selected?: boolean
  disabled?: boolean
  rank?: number
  rankWidth?: number
  metadata?: ReactNode
  metadataKey?: string
  width?: DimensionValue
  height?: number
  style?: StyleProp<ViewStyle>
  onPress?: () => void
  onLongPress?: () => void
  onPressMore?: (position: MusicRowPosition) => void
  accessibilityLabel?: string
  moreAccessibilityLabel?: string
}

/** Shared geometry for normal song rows and all FlatList measurements. */
export const getMusicRowHeight = () => scaleSizeH(LIST_ITEM_HEIGHT)

/** Presentation-only row; list adapters own music objects and player state. */
const MusicRow = memo(({
  title,
  subtitle,
  coverUrl,
  duration,
  active = false,
  selected = false,
  disabled = false,
  rank,
  rankWidth,
  metadata,
  width,
  height,
  style,
  onPress,
  onLongPress,
  onPressMore,
  accessibilityLabel,
  moreAccessibilityLabel,
}: MusicRowProps) => {
  const theme = useTheme()
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const rowHeight = height ?? getMusicRowHeight()
  const hasCover = rank == null
  const leadingWidth = hasCover ? styles.leading.width : rankWidth ?? styles.leading.width

  const handleShowMenu = () => {
    moreButtonRef.current?.measure((fx, fy, measuredWidth, measuredHeight, pageX, pageY) => {
      onPressMore?.({
        x: Math.ceil(pageX),
        y: Math.ceil(pageY),
        w: Math.ceil(measuredWidth),
        h: Math.ceil(measuredHeight),
      })
    })
  }

  const defaultAccessibilityLabel = [title, subtitle].filter(Boolean).join(' · ')

  return (
    <View
      style={[
        styles.row,
        {
          width,
          height: rowHeight,
          backgroundColor: selected ? theme['c-primary-background-hover'] : 'transparent',
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.main}
        activeOpacity={0.6}
        disabled={disabled || onPress == null}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? defaultAccessibilityLabel}
        accessibilityState={{ selected, disabled }}
      >
        <View
          style={[
            styles.leading,
            { width: leadingWidth, marginRight: hasCover ? styles.leading.marginRight : 0 },
            hasCover && styles.coverWrap,
            hasCover && { backgroundColor: active ? theme['c-primary-background-hover'] : theme['c-primary-input-background'] },
          ]}
        >
          {active
            ? <Icon name="play-outline" size={18} color={theme['c-primary']} />
            : rank != null
              ? <Text style={styles.rankText} size={12} color={theme['c-font-label']}>{rank}</Text>
              : coverUrl
                ? <Image url={coverUrl} style={styles.cover} />
                : <Icon name="music" size={20} color={theme['c-font-label']} />}
        </View>
        <View style={styles.info}>
          <Text numberOfLines={1} color={active ? theme['c-primary'] : theme['c-font']}>{title}</Text>
          <View style={styles.subtitleRow}>
            {metadata}
            {subtitle
              ? <Text style={styles.subtitle} size={12} color={active ? theme['c-primary-alpha-300'] : theme['c-font-label']} numberOfLines={1}>{subtitle}</Text>
              : null}
          </View>
        </View>
        {duration
          ? <Text style={styles.duration} size={12} color={active ? theme['c-primary-alpha-400'] : theme['c-font-label']} numberOfLines={1}>{duration}</Text>
          : null}
      </TouchableOpacity>
      {onPressMore
        ? (
            <TouchableOpacity
              ref={moreButtonRef}
              style={styles.moreButton}
              activeOpacity={0.6}
              onPress={handleShowMenu}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={moreAccessibilityLabel}
            >
              <Icon name="dots-vertical" color={theme['c-font-label']} size={16} />
            </TouchableOpacity>
          )
        : null}
    </View>
  )
}, (prevProps, nextProps) => {
  return prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.coverUrl === nextProps.coverUrl &&
    prevProps.duration === nextProps.duration &&
    prevProps.active === nextProps.active &&
    prevProps.selected === nextProps.selected &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.rank === nextProps.rank &&
    prevProps.rankWidth === nextProps.rankWidth &&
    prevProps.metadataKey === nextProps.metadataKey &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.style === nextProps.style
})

export default MusicRow

const styles = createStyle({
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingLeft: 16,
    paddingRight: 4,
    alignItems: 'center',
  },
  main: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  leading: {
    width: 40,
    height: 40,
    marginRight: 12,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  rankText: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  info: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  subtitleRow: {
    minWidth: 0,
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '400',
  },
  duration: {
    flexShrink: 0,
  },
  moreButton: {
    width: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
