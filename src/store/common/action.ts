import state, { type InitState } from './state'
import { isMainNavId, type COMPONENT_IDS } from '@/config/constant'


export default {
  setFontSize(size: number) {
    state.fontSize = size
    // Pixel scaling reads the runtime value directly; keep it in sync before rerendering rows.
    global.lx.fontSize = size
    global.state_event.fontSizeUpdated(size)
  },
  setStatusbarHeight(size: number) {
    if (state.statusbarHeight == size) return
    state.statusbarHeight = size
    global.state_event.statusbarHeightUpdated(size)
  },
  setComponentId(name: COMPONENT_IDS, id: string) {
    state.componentIds[name] = id
    global.state_event.componentIdsUpdated({ ...state.componentIds })
  },
  removeComponentId(id: string) {
    const name = (Object.entries(state.componentIds) as Array<[COMPONENT_IDS, string]>).find(kv => kv[1] == id)?.[0]
    if (!name) return
    delete state.componentIds[name]
    global.state_event.componentIdsUpdated({ ...state.componentIds })
  },
  setNavActiveId(id: InitState['navActiveId']) {
    state.navActiveId = id
    // 只有主标签才是返回落点，排行榜/下载/设置等覆盖页不能覆盖它
    if (isMainNavId(id)) state.lastNavActiveId = id
    global.state_event.navActiveIdUpdated(id)
  },
  setLastNavActiveId(id: InitState['navActiveId']) {
    state.lastNavActiveId = id
  },
  setBgPic(pic: string | null) {
    state.bgPic = pic
    global.state_event.bgPicUpdated(pic)
  },
  setSourceNames(names: InitState['sourceNames']) {
    state.sourceNames = names
    global.state_event.sourceNamesUpdated(names)
  },
}
