import { memo, type ComponentProps } from 'react'
import {
  ArrowLeft,
  Captions,
  CaptionsOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleDot,
  CirclePlay,
  CircleQuestionMark,
  Clock3,
  Disc3,
  Download,
  EllipsisVertical,
  Eraser,
  FolderPlus,
  Gauge,
  HardDrive,
  Heart,
  House,
  ListMusic,
  ListOrdered,
  ListPlus,
  LogOut,
  Menu,
  MessageCircle,
  Minus,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Repeat1,
  Search,
  Settings,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Square,
  SquareCheckBig,
  SquareMinus,
  SquarePlay,
  ThumbsUp,
  Trash2,
  Trophy,
  Volume1,
  Volume2,
  VolumeX,
  X,
  AudioLines,
  type LucideIcon,
} from 'lucide-react-native'
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useTextShadow, useTheme } from '@/store/theme/hook'

/**
 * 旧 IcoMoon glyph 名 → Lucide 图标组件映射。
 * key 必须与历史调用点的 name 字符串完全一致（含 nextMusic、volume-higt 等历史拼写），
 * 新代码请直接使用映射表中的旧名，保证全站统一走这一张表。
 */
const ICON_MAP: Record<string, LucideIcon> = {
  'add-music': ListPlus,
  'music': Music2,
  'add_folder': FolderPlus,
  'album': Disc3,
  'available_updates': RefreshCw,
  'back-2': ArrowLeft,
  'checkbox-blank-outline': Square,
  'checkbox-marked': SquareCheckBig,
  'chevron-left': ChevronLeft,
  'chevron-left-2': ChevronsLeft,
  'chevron-right': ChevronRight,
  'chevron-right-2': ChevronsRight,
  'chevron-down': ChevronDown,
  'close': X,
  'comment': MessageCircle,
  'dots-vertical': EllipsisVertical,
  'download-2': Download,
  'eraser': Eraser,
  'exit': LogOut,
  'exit2': LogOut,
  'full_stop': CircleDot,
  'heart': Heart,
  'help': CircleQuestionMark,
  'home': House,
  'leaderboard': Trophy,
  'list-loop': Repeat,
  'list-order': ListOrdered,
  'list-random': Shuffle,
  'logo': AudioLines,
  'love': Heart,
  'lyric-off': CaptionsOff,
  'lyric-on': Captions,
  'menu': Menu,
  'minus-box': SquareMinus,
  'music_time': Clock3,
  'nextMusic': SkipForward,
  'pause': Pause,
  'play': Play,
  'play-outline': CirclePlay,
  'playback-rate': Gauge,
  'playlist': ListMusic,
  'prevMusic': SkipBack,
  'remove': Minus,
  'sd-card': HardDrive,
  'search-2': Search,
  'setting': Settings,
  'share': Share2,
  'single': SquarePlay,
  'single-loop': Repeat1,
  'slider': SlidersHorizontal,
  'thumbs-up': ThumbsUp,
  'volume-higt': Volume2,
  'volume-low': Volume1,
  'volume-medium': Volume2,
  'volume-mute': VolumeX,
  'volume-off': VolumeX,
}

// 语义化新增：删除类操作（调用点逐步迁移）
const EXTRA_ICONS: Record<string, LucideIcon> = {
  'delete': Trash2,
}

type IconName = keyof typeof ICON_MAP

interface IconProps extends Omit<ComponentProps<LucideIcon>, 'name' | 'style' | 'size'> {
  style?: StyleProp<TextStyle>
  rawSize?: number
  name: IconName | keyof typeof EXTRA_ICONS
  size?: number
  // 旧字体图标遗留属性，Lucide 为矢量绘制不受字体缩放影响，仅保留 API 兼容
  allowFontScaling?: boolean
}

export const Icon = memo(({ size = 15, rawSize, color, style, name, allowFontScaling: _allowFontScaling, ...props }: IconProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  const newStyle = textShadow ? StyleSheet.compose({
    textShadowColor: theme['c-primary-dark-300-alpha-800'],
    textShadowOffset: { width: 0.2, height: 0.2 },
    textShadowRadius: 2,
  }, style) : style

  const LucideComp = ICON_MAP[name] ?? EXTRA_ICONS[name] ?? Play
  const iconSize = rawSize ?? scaleSizeW(size)
  const iconColor = color ?? theme['c-font']

  return (
    <LucideComp
      size={iconSize}
      color={iconColor}
      strokeWidth={2}
      {...props}
      style={newStyle}
    />
  )
})
