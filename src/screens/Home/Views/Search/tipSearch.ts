/** 搜索联想只保留最后一次输入；取消同时使已经发出的请求失效。 */
export const createTipSearch = (fetchTips: (keyword: string, source: LX.OnlineSource) => Promise<string[]>) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let generation = 0
  const cancel = () => {
    generation++
    if (timer) clearTimeout(timer)
    timer = undefined
  }
  const search = (keyword: string, source: LX.OnlineSource, callback: (list: string[]) => void) => {
    cancel()
    if (!keyword) {
      callback([])
      return
    }
    const request = generation
    timer = setTimeout(() => {
      timer = undefined
      void Promise.resolve().then(async() => fetchTips(keyword, source)).then((list) => {
        if (request == generation) callback(list)
      }, () => {
        // 联想失败不打断正式搜索，也不能留下未处理的 Promise rejection。
        if (request == generation) callback([])
      })
    }, 250)
  }
  return Object.assign(search, { cancel })
}
