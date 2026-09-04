import { memo, type ComponentProps } from 'react'
// 按图标深度导入：RN 0.73 / Metro 0.80 不支持 ESM tree-shaking，
// 从包根 barrel 导入会把全部 1700+ 图标打进 JS bundle（约 +1.9MB），
// 因此逐图标从 dist/cjs/icons/* 引入，仅打包实际用到的组件。
// 深度路径的运行时类型通过 src/types/lucide.d.ts 的通配符声明补齐。
import type { LucideIcon } from 'lucide-react-native'
import ArrowLeft from 'lucide-react-native/dist/cjs/icons/arrow-left'
import AudioLines from 'lucide-react-native/dist/cjs/icons/audio-lines'
import Captions from 'lucide-react-native/dist/cjs/icons/captions'
import CaptionsOff from 'lucide-react-native/dist/cjs/icons/captions-off'
import ChevronDown from 'lucide-react-native/dist/cjs/icons/chevron-down'
import ChevronLeft from 'lucide-react-native/dist/cjs/icons/chevron-left'
import ChevronRight from 'lucide-react-native/dist/cjs/icons/chevron-right'
import ChevronsLeft from 'lucide-react-native/dist/cjs/icons/chevrons-left'
import ChevronsRight from 'lucide-react-native/dist/cjs/icons/chevrons-right'
import CircleDot from 'lucide-react-native/dist/cjs/icons/circle-dot'
import CirclePlay from 'lucide-react-native/dist/cjs/icons/circle-play'
import CircleQuestionMark from 'lucide-react-native/dist/cjs/icons/circle-question-mark'
import Clock3 from 'lucide-react-native/dist/cjs/icons/clock-3'
import Disc3 from 'lucide-react-native/dist/cjs/icons/disc-3'
import Download from 'lucide-react-native/dist/cjs/icons/download'
import EllipsisVertical from 'lucide-react-native/dist/cjs/icons/ellipsis-vertical'
import Eraser from 'lucide-react-native/dist/cjs/icons/eraser'
import FolderPlus from 'lucide-react-native/dist/cjs/icons/folder-plus'
import Gauge from 'lucide-react-native/dist/cjs/icons/gauge'
import HardDrive from 'lucide-react-native/dist/cjs/icons/hard-drive'
import Heart from 'lucide-react-native/dist/cjs/icons/heart'
import House from 'lucide-react-native/dist/cjs/icons/house'
import ListMusic from 'lucide-react-native/dist/cjs/icons/list-music'
import ListOrdered from 'lucide-react-native/dist/cjs/icons/list-ordered'
import ListPlus from 'lucide-react-native/dist/cjs/icons/list-plus'
import LogOut from 'lucide-react-native/dist/cjs/icons/log-out'
import Menu from 'lucide-react-native/dist/cjs/icons/menu'
import MessageCircle from 'lucide-react-native/dist/cjs/icons/message-circle'
import Minus from 'lucide-react-native/dist/cjs/icons/minus'
import Music2 from 'lucide-react-native/dist/cjs/icons/music-2'
import Pause from 'lucide-react-native/dist/cjs/icons/pause'
import Play from 'lucide-react-native/dist/cjs/icons/play'
import RefreshCw from 'lucide-react-native/dist/cjs/icons/refresh-cw'
import Repeat from 'lucide-react-native/dist/cjs/icons/repeat'
import Repeat1 from 'lucide-react-native/dist/cjs/icons/repeat-1'
import RotateCcw from 'lucide-react-native/dist/cjs/icons/rotate-ccw'
import Search from 'lucide-react-native/dist/cjs/icons/search'
import Settings from 'lucide-react-native/dist/cjs/icons/settings'
import Share2 from 'lucide-react-native/dist/cjs/icons/share-2'
import Shuffle from 'lucide-react-native/dist/cjs/icons/shuffle'
import SkipBack from 'lucide-react-native/dist/cjs/icons/skip-back'
import SkipForward from 'lucide-react-native/dist/cjs/icons/skip-forward'
import SlidersHorizontal from 'lucide-react-native/dist/cjs/icons/sliders-horizontal'
import Square from 'lucide-react-native/dist/cjs/icons/square'
import SquareCheckBig from 'lucide-react-native/dist/cjs/icons/square-check-big'
import SquareMinus from 'lucide-react-native/dist/cjs/icons/square-minus'
import SquarePlay from 'lucide-react-native/dist/cjs/icons/square-play'
import ThumbsUp from 'lucide-react-native/dist/cjs/icons/thumbs-up'
import Trash2 from 'lucide-react-native/dist/cjs/icons/trash-2'
import Trophy from 'lucide-react-native/dist/cjs/icons/trophy'
import Volume1 from 'lucide-react-native/dist/cjs/icons/volume-1'
import Volume2 from 'lucide-react-native/dist/cjs/icons/volume-2'
import VolumeX from 'lucide-react-native/dist/cjs/icons/volume-x'
import X from 'lucide-react-native/dist/cjs/icons/x'
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
  'retry': RotateCcw,
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
