import { useRef } from 'react'
import { type GestureResponderEvent } from 'react-native'

/**
 * 只绑定面板标题区。原生 Modal 中直接跟踪触摸，不参与菜单 ScrollView 的 responder 竞争。
 * pageY 不受面板自身 translateY 影响，拖动时不会出现坐标反馈抖动。
 */
export const useSheetDrag = (onMove: (distance: number) => void, onEnd: (dismiss: boolean) => void) => {
  const touch = useRef({ x: 0, y: 0, lastY: 0, time: 0, velocity: 0, moved: false })
  return {
    onTouchStart: ({ nativeEvent: e }: GestureResponderEvent) => {
      touch.current = { x: e.pageX, y: e.pageY, lastY: e.pageY, time: e.timestamp, velocity: 0, moved: false }
    },
    onTouchMove: ({ nativeEvent: e }: GestureResponderEvent) => {
      const state = touch.current
      const distance = e.pageY - state.y
      if (!state.moved && (distance <= 8 || Math.abs(distance) <= Math.abs(e.pageX - state.x))) return
      state.moved = true
      state.velocity = (e.pageY - state.lastY) / Math.max(1, e.timestamp - state.time)
      state.lastY = e.pageY
      state.time = e.timestamp
      onMove(Math.max(0, distance))
    },
    onTouchEnd: ({ nativeEvent: e }: GestureResponderEvent) => {
      const state = touch.current
      if (!state.moved) return
      state.moved = false
      const fastSwipe = e.timestamp - state.time < 100 && state.velocity > 1.2
      onEnd(e.pageY - state.y > 100 || fastSwipe)
    },
    onTouchCancel: () => {
      if (!touch.current.moved) return
      touch.current.moved = false
      onEnd(false)
    },
  }
}
