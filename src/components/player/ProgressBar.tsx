import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, PanResponder } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { useDrag } from '@/utils/hooks'
import { safeProgressRatio } from '@/utils/playTime'

/**
 * Apple Music 风格进度条
 *
 * 视觉特征：
 * — 极细轨道（3.6pt），圆角末端
 * — 已播放部分使用主色填充
 * — 缓冲部分使用主色低透明度填充
 * — 未播放部分使用 separator 色填充
 * — 拖拽手柄使用主色实心圆点，尺寸随轨道自适应（不再大于轨道 4 倍）
 *
 * 行为约定：
 * — `seekable=false`（设置里关掉拖动进度、或总时长未知）时不挂手势层，也不画拖拽手柄，
 *   进度条只做展示，避免出现「看起来能拖、拖了没反应」的状态
 * — 进度/缓冲比例统一走 safeProgressRatio，NaN、Infinity、越界值都不会写进样式，不会出现 NaN%
 */

/** 六位十六进制色追加透明度；其它色值原样返回，避免拼出非法颜色 */
const withAlpha = (color: string, alphaHex: string) => {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alphaHex}` : color
}

const DefaultBar = memo(({ color }: { color?: string }) => {
  const theme = useTheme()
  // 未播放轨道 — 默认可由调用方覆盖（沉浸页用白色半透明）
  return <View style={{ ...styles.progressBar, backgroundColor: color ?? theme['c-border-background'], position: 'absolute', width: '100%', left: 0, top: 0 }}></View>
})

const BufferedBar = memo(({ progress, color }: { progress: number, color?: string }) => {
  const theme = useTheme()
  // 缓冲条 — 默认主题色低透明度，可由调用方覆盖（用于白色强调）
  return <View style={{ ...styles.progressBar, backgroundColor: color ?? theme['c-primary-alpha-400'], position: 'absolute', width: `${progress * 100}%`, left: 0, top: 0 }}></View>
})


const PreassBar = memo(({ onDragState, setDragProgress, onSetProgress }: {
  onDragState: (drag: boolean) => void
  setDragProgress: (progress: number) => void
  onSetProgress: (progress: number) => void
}) => {
  const {
    onLayout,
    onDragStart,
    onDragEnd,
    onDrag,
  } = useDrag(onSetProgress, onDragState, setDragProgress)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
      onPanResponderTerminate: () => {
        onDragEnd()
      },
    }),
  ).current

  return <View onLayout={onLayout} style={[styles.pressBar, { height: PROGRESS_HEIGHT }]} {...panResponder.panHandlers} />
})


const Progress = ({
  progress,
  duration,
  buffered,
  playedColor,
  bufferedColor,
  dotColor,
  trackColor,
  seekable = true,
}: {
  progress: number
  duration: number
  buffered: number
  /** 已播放进度条覆盖色（默认主题主色） */
  playedColor?: string
  /** 缓冲条覆盖色（默认主题主色低透明） */
  bufferedColor?: string
  /** 拖拽手柄覆盖色（默认主题主色） */
  dotColor?: string
  /** 未播放轨道覆盖色（默认 separator） */
  trackColor?: string
  /** 是否允许拖动跳转；false 时只展示进度 */
  seekable?: boolean
}) => {
  const theme = useTheme()
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  // 总时长未知时拖动没有意义，直接按不可拖动处理
  const hasDuration = Number.isFinite(duration) && duration > 0
  const canSeek = seekable && hasDuration
  const ratio = safeProgressRatio(progress)
  const safeBuffered = safeProgressRatio(buffered)
  const dragRatio = safeProgressRatio(dragProgress)
  const progressStr: `${number}%` = `${ratio * 100}%`

  const progressDotStyle = useMemo(() => {
    return {
      width: progressDotSize,
      position: 'absolute',
      right: -progressDotSize / 2,
      top: -(progressDotSize - trackHeight) / 2,
    } as const
  }, [])

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])
  const onSetProgress = useCallback((progress: number) => {
    const target = durationRef.current
    if (!Number.isFinite(target) || target <= 0) return
    if (!Number.isFinite(progress)) return
    global.app_event.setProgress(progress * target)
  }, [])

  // 颜色覆盖：调用方可传入白色等强调色覆盖默认主题色
  const finalDotColor = dotColor ?? theme['c-primary']
  const finalPlayedColor = playedColor ?? theme['c-primary']
  // 拖拽预览色：与 played 同色但稍透明
  const finalDragPreviewColor = playedColor
    ? withAlpha(playedColor, '99')
    : theme['c-primary-alpha-300']
  // 不可拖动时不画手柄，避免误以为可以拖
  const showDot = canSeek

  return (
    <View style={[styles.progress, { height: PROGRESS_HEIGHT, paddingTop: trackPadding, paddingBottom: trackPadding }]}>
      <View>
        <DefaultBar color={trackColor} />
        <BufferedBar progress={safeBuffered} color={bufferedColor} />
        {
          draging && canSeek
            ? (
                <>
                  {/* 拖拽中：实际进度条（半透明强调色） */}
                  <View style={{ ...styles.progressBar, backgroundColor: finalDragPreviewColor, width: progressStr, position: 'absolute', left: 0, top: 0 }} />
                  {/* 拖拽中：拖拽预览条（强调色）+ 手柄 */}
                  <View style={{ ...styles.progressBar, backgroundColor: finalPlayedColor, width: `${dragRatio * 100}%`, position: 'absolute', left: 0, top: 0 }}>
                    <View style={[dotStyle, progressDotStyle, { backgroundColor: finalDotColor }]} />
                  </View>
                </>
              ) : (
                <View style={{ ...styles.progressBar, backgroundColor: finalPlayedColor, width: progressStr, position: 'absolute', left: 0, top: 0 }}>
                  {showDot
                    ? <View style={[dotStyle, progressDotStyle, { backgroundColor: finalDotColor }]} />
                    : null}
                </View>
              )
        }

      </View>
      {canSeek
        ? <PreassBar onDragState={setDraging} setDragProgress={setDragProgress} onSetProgress={onSetProgress} />
        : null}
    </View>
  )
}


const PROGRESS_PADDING = 10
const PROGRESS_TRACK_HEIGHT = 3.6
// 已缩放的实际尺寸：轨道、热区、手柄都在同一套缩放值上计算，避免 createStyle 二次缩放导致对不齐
const trackPadding = scaleSizeH(PROGRESS_PADDING)
const trackHeight = scaleSizeH(PROGRESS_TRACK_HEIGHT)
// 拖拽手柄：与轨道高度等比放大，控制在 11pt 左右，避免在细轨道上显得过大
const progressDotSize = Math.max(scaleSizeW(11), trackHeight * 2.4)

/** 进度条实际占用的布局高度（含拖拽热区），供调用方对齐加载态高度，避免切换时跳动 */
export const PROGRESS_HEIGHT = trackPadding * 2 + trackHeight

const dotStyle = {
  height: progressDotSize,
  borderRadius: progressDotSize / 2,
} as const

const styles = createStyle({
  progress: {
    width: '100%',
    zIndex: 1,
  },
  progressBar: {
    height: PROGRESS_TRACK_HEIGHT,
    borderRadius: 4,
  },
  pressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    zIndex: 6,
  },
})

export default Progress
