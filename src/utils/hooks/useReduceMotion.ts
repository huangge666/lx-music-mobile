import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

/** 读取系统偏好前先禁用非必要动效，避免首次打开就触发不适。 */
export const useReduceMotion = () => {
  const [reduceMotion, setReduceMotion] = useState(true)
  useEffect(() => {
    let active = true
    let changed = false
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      changed = true
      if (active) setReduceMotion(enabled)
    })
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active && !changed) setReduceMotion(enabled)
    }).catch(() => {})
    return () => {
      active = false
      subscription.remove()
    }
  }, [])
  return reduceMotion
}
