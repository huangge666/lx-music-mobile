import { memo, useCallback, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextLayoutEventData,
  type ViewStyle,
} from 'react-native'

import Image from './Image'
import Loading from './Loading'
import Text from './Text'
import { Icon } from './Icon'
import { getPlaylistCoverTint, getPlaylistInitial } from './playlistCover'
import { useTheme } from '@/store/theme/hook'
import { BorderRadius } from '@/theme'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'

export type PlaylistHeroStatus = 'idle' | 'loading' | 'error'

export interface PlaylistHeroProps {
  title: string
  /** 封面地址；为空、加载失败时使用派生占位，不留空档 */
  coverUrl?: string | null
  /** 共享元素封面 id（在线歌单详情转场用） */
  coverNativeID?: string
  /** 共享元素标题 id */
  titleNativeID?: string
  /** 封面上的附加信息（例如播放量），由调用方提供渲染 */
  coverBadge?: ReactNode
  /** 无封面时的占位：按 seed 派生稳定色相 */
  placeholderSeed?: string
  /** 无封面时的占位文字（通常是标题首字），留空则只用图标 */
  placeholderText?: string
  placeholderIcon?: ComponentProps<typeof Icon>['name']
  /** 已本地化的次要信息，例如「32 首 · 作者 · kw」 */
  meta?: string | null
  description?: string | null
  expandText?: string
  collapseText?: string
  status?: PlaylistHeroStatus
  statusText?: string
  onRetry?: () => void
  /** 当前播放模式是否为随机，仅用于展示，不在这里切换模式 */
  shuffleActive?: boolean
  /** 播放/随机动作进行中，禁止重复点击 */
  busy?: boolean
  /** 数据不可用（例如空歌单）时禁用动作按钮 */
  disabled?: boolean
  isCollected?: boolean
  onPlay?: () => void
  onShuffle?: () => void
  onCollect?: () => void
  onMore?: () => void
  playLabel?: string
  shuffleLabel?: string
  collectLabel?: string
  moreLabel?: string
  style?: StyleProp<ViewStyle>
}

const COVER_RATIO = 0.33
const COVER_MIN = scaleSizeW(96)
const COVER_MAX = scaleSizeW(150)
const ACTION_SIZE = scaleSizeW(40)
const ACTION_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }
const coverImageStyle = StyleSheet.absoluteFillObject

/** 圆形次要操作按钮：40 的可视热区配 8 的 hitSlop，达到 48dp 点按面积且不与相邻按钮重叠 */
const CircleButton = ({
  icon,
  label,
  onPress,
  disabled,
  active,
  selected,
}: {
  icon: ComponentProps<typeof Icon>['name']
  label?: string
  onPress: () => void
  disabled?: boolean
  active?: boolean
  selected?: boolean
}) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      hitSlop={ACTION_HIT_SLOP}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      style={[
        styles.actionCircle,
        {
          backgroundColor: active ? theme['c-primary-background'] : theme['c-primary-input-background'],
          borderColor: active ? theme['c-primary-alpha-700'] : theme['c-border-background'],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Icon name={icon} size={16} color={active ? theme['c-primary'] : theme['c-font']} />
    </TouchableOpacity>
  )
}

/**
 * 歌单主视觉（我的歌单详情、在线歌单详情共用）。
 *
 * 只接收展示数据与回调，不订阅播放器或歌单 store；页面动作（播放全部、真实随机、收藏）
 * 留在各自的页面/动作层，两个详情页都能用同一套排版。
 * 组件本身用于歌曲 FlatList 的 ListHeaderComponent，随列表一起滚走，高度由列表外层 wrapper 测量。
 */
const PlaylistHero = ({
  title,
  coverUrl,
  coverNativeID,
  titleNativeID,
  coverBadge,
  placeholderSeed,
  placeholderText,
  placeholderIcon,
  meta,
  description,
  expandText,
  collapseText,
  status = 'idle',
  statusText,
  onRetry,
  shuffleActive = false,
  busy = false,
  disabled: disabledProp = false,
  isCollected = false,
  onPlay,
  onShuffle,
  onCollect,
  onMore,
  playLabel,
  shuffleLabel,
  collectLabel,
  moreLabel,
  style,
}: PlaylistHeroProps) => {
  const theme = useTheme()
  const [width, setWidth] = useState(0)
  const [descExpanded, setDescExpanded] = useState(false)
  const [descOverflow, setDescOverflow] = useState(false)

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const nextWidth = e.nativeEvent.layout.width
    setWidth(prev => Math.abs(prev - nextWidth) > 0.5 ? nextWidth : prev)
  }, [])

  // onLayout 得到的是实际尺寸，不能再交给 scaleSizeW/H 二次缩放
  const coverSize = width > 0
    ? Math.round(Math.min(Math.max(width * COVER_RATIO, COVER_MIN), COVER_MAX))
    : 0

  const tint = useMemo(() => getPlaylistCoverTint(placeholderSeed ?? title), [placeholderSeed, title])
  const initial = placeholderText ?? getPlaylistInitial(title)
  // c-primary 是「反色实底」（浅色主题近黑、深色主题近白），
  // c-primary-font 与它同值，不能当作实底上的文字色，这里与 ButtonPrimary 一样取反色
  const onPrimaryColor = theme.isDark ? 'rgb(18, 16, 14)' : 'rgb(255, 255, 255)'
  const disabled = busy || disabledProp || status === 'loading'
  const showLoading = status === 'loading'
  const showError = status === 'error'

  const handleDescOverflow = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (descExpanded) return
    if (e.nativeEvent.lines.length > 2) setDescOverflow(true)
  }, [descExpanded])

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <View style={styles.ambient} pointerEvents="none">
        <View style={{ ...styles.ambientPrimary, backgroundColor: theme['c-primary-alpha-800'] }} />
        <View style={{ ...styles.ambientSecondary, backgroundColor: theme['c-primary-alpha-900'] }} />
      </View>

      <View
        style={[
          styles.coverFrame,
          { width: coverSize, height: coverSize, borderColor: theme['c-glass-border'] },
        ]}
      >
        <View style={[styles.cover, { backgroundColor: tint.backgroundColor }]}>
          {placeholderIcon != null
            ? <Icon name={placeholderIcon} size={Math.max(coverSize * 0.22, 18)} color={tint.color} />
            : initial
              ? <Text style={styles.coverInitial} color={tint.color} numberOfLines={1}>{initial}</Text>
              : <Icon name="music" size={Math.max(coverSize * 0.22, 18)} color={tint.color} />}
          {coverUrl
            ? <Image url={coverUrl} nativeID={coverNativeID} style={coverImageStyle} />
            : null}
          {showLoading
            ? (
                <View style={styles.coverScrim}>
                  <Loading size={18} color="#fff" />
                </View>
              )
            : null}
          {coverBadge
            ? <View style={styles.coverBadge} pointerEvents="none">{coverBadge}</View>
            : null}
        </View>
      </View>

      <View style={styles.info}>
        <Text
          nativeID={titleNativeID}
          style={styles.title}
          size={22}
          color={theme['c-font']}
          numberOfLines={2}
        >{title}</Text>
        {meta
          ? <Text style={styles.meta} size={12} color={theme['c-font-label']} numberOfLines={1}>{meta}</Text>
          : null}
        {description
          ? (
              <TouchableOpacity
                activeOpacity={descOverflow ? 0.7 : 1}
                disabled={!descOverflow}
                onPress={() => { setDescExpanded(expanded => !expanded) }}
                accessibilityRole={descOverflow ? 'button' : undefined}
                accessibilityState={{ expanded: descExpanded }}
              >
                <Text
                  style={styles.description}
                  size={12}
                  color={theme['c-font-label']}
                  numberOfLines={descExpanded ? undefined : 2}
                  onTextLayout={handleDescOverflow}
                >
                  {description}
                  {descOverflow
                    ? <Text size={12} color={theme['c-primary']}>{'  '}{descExpanded ? collapseText : expandText}</Text>
                    : null}
                </Text>
              </TouchableOpacity>
            )
          : null}
        {showError && statusText
          ? (
              <TouchableOpacity
                onPress={onRetry}
                disabled={!onRetry}
                hitSlop={ACTION_HIT_SLOP}
                activeOpacity={0.7}
                accessibilityRole={onRetry ? 'button' : undefined}
              >
                <Text style={styles.statusText} size={12} color={theme['c-primary']} numberOfLines={2}>{statusText}</Text>
              </TouchableOpacity>
            )
          : null}
      </View>

      <View style={styles.actions}>
        {onPlay
          ? (
              <TouchableOpacity
                onPress={onPlay}
                disabled={disabled}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel={playLabel}
                accessibilityState={{ disabled }}
                style={[styles.playButton, {
                  backgroundColor: theme['c-primary'],
                  opacity: disabled ? 0.5 : 1,
                }]}
              >
                {busy
                  ? <Loading size={14} color={onPrimaryColor} />
                  : <Icon name="play" size={14} color={onPrimaryColor} />}
                {playLabel
                  ? <Text style={styles.playLabel} size={13} color={onPrimaryColor} numberOfLines={1}>{playLabel}</Text>
                  : null}
              </TouchableOpacity>
            )
          : null}
        {onShuffle
          ? (
              <CircleButton
                icon="list-random"
                label={shuffleLabel}
                onPress={onShuffle}
                disabled={disabled}
                active={shuffleActive}
                selected={shuffleActive}
              />
            )
          : null}
        {onCollect
          ? (
              <CircleButton
                icon="love"
                label={collectLabel}
                onPress={onCollect}
                disabled={busy}
                active={isCollected}
                selected={isCollected}
              />
            )
          : null}
        {onMore
          ? (
              <CircleButton
                icon="dots-vertical"
                label={moreLabel}
                onPress={onMore}
                disabled={busy}
              />
            )
          : null}
      </View>
    </View>
  )
}

export default memo(PlaylistHero)

const styles = createStyle({
  container: {
    position: 'relative',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  ambient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 220,
    overflow: 'hidden',
  },
  ambientPrimary: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    top: -150,
    right: -80,
    opacity: 0.65,
  },
  ambientSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: 30,
    left: -110,
    opacity: 0.5,
  },
  coverFrame: {
    alignSelf: 'center',
    borderRadius: BorderRadius.large,
    borderWidth: 0.5,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
  },
  cover: {
    flex: 1,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverInitial: {
    // createStyle 会对 fontSize 走 setSpText，这里写设计值，避免二次缩放
    fontSize: 46,
    fontWeight: '700',
    letterSpacing: -1,
    includeFontPadding: false,
  },
  coverScrim: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 8, 10, 0.4)',
  },
  coverBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    width: '100%',
    paddingTop: 14,
    alignItems: 'center',
  },
  title: {
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  meta: {
    marginTop: 5,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
  statusText: {
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: scaleSizeH(16),
  },
  playButton: {
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: scaleSizeW(240),
    minHeight: scaleSizeH(40),
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  playLabel: {
    fontWeight: '700',
  },
  actionCircle: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
