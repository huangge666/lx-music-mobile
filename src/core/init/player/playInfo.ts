import { getPlayInfo } from '@/utils/data'
import { getListMusics } from '@/core/list'
import { playList, play } from '@/core/player/player'

let pendingStartupAutoPlay = false

// 首页显示后再自动播放，避免启动阶段的在线取链挡住首屏。歌曲和进度已在 playList 中恢复。
export const startPendingAutoPlay = () => {
  if (!pendingStartupAutoPlay) return
  pendingStartupAutoPlay = false
  setTimeout(play)
}

export default async(setting: LX.AppSetting) => {
  const info = await getPlayInfo()
  global.lx.restorePlayInfo = null
  if (!info?.listId || info.index < 0) return

  const list = await getListMusics(info.listId)
  if (!list[info.index]) return
  global.lx.restorePlayInfo = info

  await playList(info.listId, info.index)

  pendingStartupAutoPlay = setting['player.startupAutoPlay']


  // if (!info.list || !info.list[info.index]) {
  //   const info2 = { ...info }
  //   if (info2.list) {
  //     info2.music = info2.list[info2.index]?.name
  //     info2.list = info2.list.length
  //   }
  //   toast('恢复播放数据失败，请去错误日志查看', 'long')
  //   log.warn('Restore Play Info failed: ', JSON.stringify(info2, null, 2))

  //   return
  // }

  // let setting = store.getState().common.setting
  // global.restorePlayInfo = {
  //   info,
  //   startupAutoPlay: setting.startupAutoPlay,
  // }

  // store.dispatch(playerAction.setList({
  //   list: {
  //     list: info.list,
  //     id: info.listId,
  //   },
  //   index: info.index,
  // }))
}
