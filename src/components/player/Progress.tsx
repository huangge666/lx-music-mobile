import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, PanResponder } from 'react-native'
import { useDrag } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
// import { scaleSizeW } from '@/utils/pixelRatio'
// import { AppColors } from '@/theme'

// 常驻圆点尺寸 — 跟随轨道高度自适应，保持视觉一致
const DOT_BASE = 8


const DefaultBar = memo(() => {
  const theme = useTheme()
  // 未播放轨道 — Apple separator 色
  return <View style={{
    ...styles.progressBar,
    backgroundColor: theme['c-border-background'],
    position: 'absolute',
    width: '100%',
    left: 0,
    top: 0,
  }}></View>
})

const BufferedBar = memo(({ progress }: { progress: number }) => {
  // console.log(bufferedProgress)
  const theme = useTheme()
  // 缓冲条 — 主色低透明度
  return <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-alpha-400'], position: 'absolute', width: `${progress * 100}%`, left: 0, top: 0 }}></View>
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
  // const handlePress = useCallback((event: GestureResponderEvent) => {
  //   onPress(event.nativeEvent.locationX)
  // }, [onPress])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      // onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        // console.log(evt.nativeEvent.locationX, gestureState)
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
      // onPanResponderTerminate: (evt, gestureState) => {
      //   onDragEnd()
      // },
    }),
  ).current

  return <View onLayout={onLayout} style={styles.pressBar} {...panResponder.panHandlers} />
})


export const ProgressPlain = ({ progress, duration, buffered, paddingTop, trackHeight }: {
  progress: number
  duration: number
  buffered: number
  paddingTop?: number
  /** 自定义轨道可视高度（pt）；未传则保持 flex:1 行为（兼容旧调用） */
  trackHeight?: number
}) => {
  // const { progress } = usePlayTimeBuffer()
  const theme = useTheme()
  // console.log(progress)
  const progressStr: `${number}%` = `${progress * 100}%`

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  // 轨道可视高度：自定义 > flex:1（保持原有调用兼容）
  const trackStyle = trackHeight !== undefined
    ? { height: trackHeight }
    : { flex: 1 }

  return (
    <View style={{ ...styles.progress, paddingTop }}>
      <View style={trackStyle}>
        <DefaultBar />
        <BufferedBar progress={buffered} />
        <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-alpha-700'], width: progressStr, position: 'absolute', left: 0, top: 0 }} />
      </View>
      <View style={styles.pressBar} />
    </View>
  )
}

const Progress = ({ progress, duration, buffered, paddingTop, trackHeight, showDot }: {
  progress: number
  duration: number
  buffered: number
  paddingTop?: number
  /** 自定义轨道可视高度（pt）；未传则保持 flex:1 行为（兼容旧调用） */
  trackHeight?: number
  /** 常驻显示主色圆点（拖动点） */
  showDot?: boolean
}) => {
  // const { progress } = usePlayTimeBuffer()
  const theme = useTheme()
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  // console.log(progress)
  const progressStr: `${number}%` = `${progress * 100}%`

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])
  const onSetProgress = useCallback((progress: number) => {
    global.app_event.setProgress(progress * durationRef.current)
  }, [])

  // 轨道可视高度：自定义 > flex:1（保持原有调用兼容）
  const trackStyle = trackHeight !== undefined
    ? { height: trackHeight }
    : { flex: 1 }

  // 常驻圆点样式 — 实心主色
  const dotStyle = useMemo(() => ({
    width: DOT_BASE,
    height: DOT_BASE,
    borderRadius: DOT_BASE / 2,
    backgroundColor: theme['c-primary'],
  }), [theme])

  return (
    <View style={{ ...styles.progress, paddingTop }}>
      <View style={trackStyle}>
        <DefaultBar />
        <BufferedBar progress={buffered} />
        {
          draging
            ? (
                <>
                  {/* 拖拽中：实际进度条（主色稍透明） */}
                  <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-alpha-300'], width: progressStr, position: 'absolute', left: 0, top: 0 }} />
                  {/* 拖拽中：拖拽预览条（主色） */}
                  <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary'], width: `${dragProgress * 100}%`, position: 'absolute', left: 0, top: 0 }} />
                </>
              ) : (
                /* 正常状态：已播放进度条（主色） */
                <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary'], width: progressStr, position: 'absolute', left: 0, top: 0 }} />
              )
        }
        {/* 常驻拖动圆点（主色） — 网易云式视觉 */}
        {
          showDot && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: `${progress * 100}%`,
                marginLeft: -DOT_BASE / 2,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
              }}
            >
              <View style={dotStyle} />
            </View>
          )
        }
      </View>
      <PreassBar onDragState={setDraging} setDragProgress={setDragProgress} onSetProgress={onSetProgress} />
    </View>
  )
}


// const progressContentPadding = 9
// const progressHeight = 3
const styles = createStyle({
  progress: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 1,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  pressBar: {
    position: 'absolute',
    // backgroundColor: 'rgba(0,0,0,0.5)',
    left: 0,
    top: 0,
    // height: progressContentPadding * 2 + progressHeight,
    height: '100%',
    width: '100%',
  },
})

export default Progress
