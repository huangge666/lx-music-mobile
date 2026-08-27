import { Navigation } from 'react-native-navigation'

let launched = false
const handlers: Array<() => void> = []


const emitLaunched = () => {
  launched = true
  setImmediate(() => {
    for (const handler of handlers) handler()
  })
}

export const listenLaunchEvent = () => {
  Navigation.events().registerAppLaunchedListener(() => {
    // console.log('Register app launched listener', launched)
    emitLaunched()
  })
  // Metro 调试时 JS 加载晚于原生 AppLaunched，事件不会再发一次，这里补触发以免一直白屏
  setTimeout(() => {
    if (launched) return
    emitLaunched()
  }, 2000)
}

export const onAppLaunched = (handler: () => void) => {
  handlers.push(handler)
  if (launched) {
    setImmediate(() => {
      handler()
    })
  }
}
