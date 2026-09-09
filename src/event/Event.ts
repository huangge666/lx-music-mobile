// import mitt from 'mitt'
// import type { Emitter } from 'mitt'
import BackgroundTimer from 'react-native-background-timer'

export default class Event {
  listeners: Map<string, Array<(...args: any[]) => any>>
  constructor() {
    this.listeners = new Map()
  }

  on(eventName: string, listener: (...args: any[]) => any) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) this.listeners.set(eventName, targetListeners = [])
    targetListeners.push(listener)
  }

  off(eventName: string, listener: (...args: any[]) => any) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) return
    const index = targetListeners.indexOf(listener)
    if (index < 0) return
    targetListeners.splice(index, 1)
  }

  emit(eventName: string, ...args: any[]) {
    // 锁屏/后台时 RN 的 setImmediate 会被冻结，playerEnded、loadstart 等发不出去，
    // 表现为播完下一首一直停在加载。BackgroundTimer 走原生 Handler，前台播放服务存活期间仍能触发。
    BackgroundTimer.setTimeout(() => {
      let targetListeners = this.listeners.get(eventName)
      if (!targetListeners) return
      for (const listener of targetListeners) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        listener(...args)
      }
    }, 0)
  }

  offAll(eventName: string) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) return
    this.listeners.delete(eventName)
  }
}

// export class App_EVENT {
//   listeners: Map<string, Array<() => void>>
//   constructor() {
//     this.listeners = new Map()
//   }

//   on(eventName: string, listener: () => void) {
//     let targetListeners = this.listeners.get(eventName)
//     if (targetListeners) this.listeners.set(eventName, targetListeners = [])
//     targetListeners!.push(listener)
//   }

//   off(eventName: string, listener: () => void) {

//   }
// }

