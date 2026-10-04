import { useRef, useState, useEffect, forwardRef, useImperativeHandle, type Ref } from 'react'
import { StyleSheet, View, Animated } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useReduceMotion } from '@/utils/hooks/useReduceMotion'
import List, { type ItemT, type ListProps, type ListType } from './List'

export interface SearchTipListProps<T> extends ListProps<T> {
  onPressBg?: () => void
}
export interface SearchTipListType<T> {
  setList: (list: T[]) => void
  setHeight: (height: number) => void
}

const noop = () => {}

const Component = <T extends ItemT<T>>({ onPressBg = noop, ...props }: SearchTipListProps<T>, ref: Ref<SearchTipListType<T>>) => {
  const theme = useTheme()
  const reduceMotion = useReduceMotion()
  const progress = useRef(new Animated.Value(0)).current
  const [visible, setVisible] = useState(false)
  const listRef = useRef<ListType<T>>(null)
  const heightRef = useRef(0)
  const requestRef = useRef(0)
  const frameRef = useRef<number>()
  const animationRef = useRef<Animated.CompositeAnimation>()

  useEffect(() => () => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    animationRef.current?.stop()
  }, [])

  useImperativeHandle(ref, () => ({
    setList(list) {
      const request = ++requestRef.current
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
      animationRef.current?.stop()
      if (list.length && heightRef.current > 0) {
        setVisible(true)
        frameRef.current = requestAnimationFrame(() => {
          if (request != requestRef.current) return
          listRef.current?.setList(list)
          animationRef.current = Animated.timing(progress, { toValue: 1, duration: reduceMotion ? 0 : 160, useNativeDriver: true })
          animationRef.current.start()
        })
      } else {
        listRef.current?.setList([])
        animationRef.current = Animated.timing(progress, { toValue: 0, duration: reduceMotion ? 0 : 120, useNativeDriver: true })
        animationRef.current.start(({ finished }) => {
          // 新联想可在退场动画结束前返回，旧动画绝不能把新面板再次隐藏。
          if (finished && request == requestRef.current) setVisible(false)
        })
      }
    },
    setHeight(height) {
      heightRef.current = height
    },
  }))

  if (!visible) return null
  return (
    <Animated.View style={[styles.anima, {
      opacity: progress,
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 0 : -8, 0] }) }],
    }]}>
      <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
        <List ref={listRef} {...props} />
      </View>
      <View style={styles.blank} onTouchStart={onPressBg} />
    </Animated.View>
  )
}

export default forwardRef(Component) as
  <T,>(p: SearchTipListProps<T> & { ref?: Ref<SearchTipListType<T>> }) => JSX.Element | null

const styles = StyleSheet.create({
  anima: { position: 'absolute', left: 0, top: 0, height: '100%', width: '100%', zIndex: 10 },
  container: { flex: 0, elevation: 2, maxHeight: '80%' },
  blank: { flex: 1 },
})
