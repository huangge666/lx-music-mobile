import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, PanResponder } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { useDrag } from '@/utils/hooks'

/**
 * Apple Music 风格进度条
 *
 * 视觉特征：
 * — 极细轨道（3.6pt），圆角末端
 * — 已播放部分使用主色填充
 * — 缓冲部分使用主色低透明度填充
 * — 未播放部分使用 separator 色填充
 * — 拖拽手柄使用主色实心圆点，尺寸适中
 *
 * 色彩替换说明：
 * 原代码使用 c-primary-light-* 系列旧色值，
 * 现统一使用 c-primary / c-primary-alpha-* 语义色 + c-border-background 轨道色
 */
const DefaultBar = memo(({ color }: { color?: string }) => {
  const theme = useTheme()
  // 未播放轨道 — 默认可由调用方覆盖（沉浸页用白色半透明）
  return <View style={{ ...styles.progressBar, backgroundColor: color ?? theme['c-border-background'], position: 'absolute', width: '100%', left: 0, top: 0 }}></View>
})

const BufferedBar = memo(({ progress, color }: { progress: number, color?: string }) => {
  const theme = useTheme()
  // 缓冲条 — 默认主题色低透明度，可由调用方覆盖（用于红色强调）
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
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
    }),
  ).current

  return <View onLayout={onLayout} style={styles.pressBar} {...panResponder.panHandlers} />
})


const Progress = ({
  progress,
  duration,
  buffered,
  playedColor,
  bufferedColor,
  dotColor,
  trackColor,
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
}) => {
  const theme = useTheme()
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const progressStr: `${number}%` = `${progress * 100}%`

  const progressDotStyle = useMemo(() => {
    return {
      width: progressDotSize,
      position: 'absolute',
      right: -progressDotSize / 2,
      top: -(progressDotSize - progressHeightSize) / 2,
    } as const
  }, [])

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])
  const onSetProgress = useCallback((progress: number) => {
    global.app_event.setProgress(progress * durationRef.current)
  }, [])

  // 颜色覆盖：调用方可传入红色等强调色覆盖默认主题色
  const finalDotColor = dotColor ?? theme['c-primary']
  const finalPlayedColor = playedColor ?? theme['c-primary']
  // 拖拽预览色：与 played 同色但稍透明（按 0.6 alpha 走）
  const finalDragPreviewColor = playedColor
    ? `${playedColor}99` // 直接拼接 ~60% alpha
    : theme['c-primary-alpha-300']

  return (
    <View style={styles.progress}>
      <View>
        <DefaultBar color={trackColor} />
        <BufferedBar progress={buffered} color={bufferedColor} />
        {
          draging
            ? (
                <>
                  {/* 拖拽中：实际进度条（半透明主色） */}
                  <View style={{ ...styles.progressBar, backgroundColor: finalDragPreviewColor, width: progressStr, position: 'absolute', left: 0, top: 0 }} />
                  {/* 拖拽中：拖拽预览条（主色）+ 手柄 */}
                  <View style={{ ...styles.progressBar, backgroundColor: finalPlayedColor, width: `${dragProgress * 100}%`, position: 'absolute', left: 0, top: 0 }}>
                    <View style={[styles.dot, progressDotStyle, { backgroundColor: finalDotColor }]} />
                  </View>
                </>
              ) : (
                <View style={{ ...styles.progressBar, backgroundColor: finalPlayedColor, width: progressStr, position: 'absolute', left: 0, top: 0 }}>
                  <View style={[styles.dot, progressDotStyle, { backgroundColor: finalDotColor }]} />
                </View>
              )
        }

      </View>
      <PreassBar onDragState={setDraging} setDragProgress={setDragProgress} onSetProgress={onSetProgress} />
    </View>
  )
}


const progressContentPadding = 10
const progressHeight = 3.6
const progressContentHeight = progressContentPadding * 2 + progressHeight
const progressHeightSize = scaleSizeH(progressHeight)
let progressDotSize = scaleSizeW(progressContentHeight * 0.8)

const styles = createStyle({
  progress: {
    width: '100%',
    height: progressContentHeight,
    paddingTop: progressContentPadding,
    paddingBottom: progressContentPadding,
    zIndex: 1,
  },
  progressBar: {
    height: progressHeight,
    borderRadius: 4,
  },
  pressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: progressContentHeight,
    paddingTop: progressContentPadding,
    paddingBottom: progressContentPadding,
    width: '100%',
    zIndex: 6,
  },
  // Apple Music 风格进度手柄 — 纯色圆点（不再使用 Icon）
  dot: {
    height: progressDotSize,
    borderRadius: progressDotSize / 2,
  },
})

export default Progress
