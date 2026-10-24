import { hideDesktopLyric } from './desktopLyric'
import { exitApp as utilExitApp } from '@/utils/nativeModules/utils'
import { setPause as pausePlayer } from '@/plugins/player/utils'
import { initSetting as initAppSetting } from '@/config/setting'
import { setLanguage as applyLanguage } from '@/lang/i18n'

import settingActions from '@/store/setting/action'
import settingState from '@/store/setting/state'
import commonActions from '@/store/common/action'
import commonState, { type InitState as CommonStateType } from '@/store/common/state'

import { isMainNavId, normalizeNavId, storageDataPrefix } from '@/config/constant'
import { saveData } from '@/plugins/storage'
import { throttle } from '@/utils/common'
import { getSelectedManagedFolder, saveFontSize, saveViewPrevState, setSelectedManagedFolder } from '@/utils/data'
import { hideDesktopLyricView } from '@/utils/nativeModules/lyricDesktop'
import { flushPendingListInterval } from '@/core/init/player/playProgress'
import { getPersistedUriList, selectManagedFolder } from '@/utils/fs'


const throttleSaveSetting = throttle(() => {
  void saveData(storageDataPrefix.setting, settingState.setting)
})

/**
 * 初始化设置
 */
export const initSetting = async() => {
  const setting = (await initAppSetting()).setting
  settingActions.updateSetting(setting)
  return setting
}

/**
 * 更新设置
 * @param setting 新设置
 */
export const updateSetting = (setting: Partial<LX.AppSetting>) => {
  settingActions.updateSetting(setting)
  throttleSaveSetting()
}

export const setLanguage = (locale: Parameters<typeof applyLanguage>[0]) => {
  updateSetting({ 'common.langId': locale })
  global.state_event.languageChanged(locale)
  requestAnimationFrame(() => {
    applyLanguage(locale)
  })
}


let isDestroying = false
export const exitApp = (reason: string) => {
  console.log('Handle Exit App, Reason: ' + reason)
  if (isDestroying) return
  isDestroying = true

  // 退出前把内存里补齐的时长写回歌单；进程随后会被立刻结束，写不完只丢这次补齐
  void flushPendingListInterval().catch(() => {})

  // 先发暂停和隐藏歌词，但不等待 JS 侧 destroy（缓存释放会卡住数秒）
  void pausePlayer().catch(() => {})
  void hideDesktopLyric().catch(() => {})
  void hideDesktopLyricView().catch(() => {})

  // 原生立刻停止播放服务并结束进程
  utilExitApp()
}

export const setFontSize = (size: number) => {
  commonActions.setFontSize(size)
  void saveFontSize(size)
}

export const setStatusbarHeight = (size: number) => {
  commonActions.setStatusbarHeight(size)
}

export const setComponentId = (name: keyof CommonStateType['componentIds'], id: string) => {
  commonActions.setComponentId(name, id)
}
export const removeComponentId = (name: string) => {
  commonActions.removeComponentId(name)
}

// 下载与设置是覆盖在主页分页上的独立页面，不能作为返回落点；排行榜自 Phase 7 起是主标签。
export const setNavActiveId = (id: Parameters<typeof commonActions.setNavActiveId>['0']) => {
  if (id == commonState.navActiveId) return
  commonActions.setNavActiveId(id)
  if (isMainNavId(id)) {
    commonActions.setLastNavActiveId(id)
    saveViewPrevState({ id })
  }
}

export const backToHomeTab = () => {
  setNavActiveId(normalizeNavId(commonState.lastNavActiveId))
}

/** 打开排行榜主标签 */
export const openLeaderboard = () => {
  setNavActiveId('nav_top')
}

/** 离开排行榜：回到浏览主标签（保留给旧调用方与测试） */
export const closeLeaderboard = () => {
  setNavActiveId('nav_songlist')
}

export const checkStoragePermissions = async() => {
  const selectedManagedFolder = await getSelectedManagedFolder()
  if (selectedManagedFolder) return (await getPersistedUriList()).some(uri => selectedManagedFolder.startsWith(uri))
  return false
}

export const requestStoragePermission = async() => {
  const isGranted = await checkStoragePermissions()
  if (isGranted) return isGranted

  const uri = await selectManagedFolder()
  if (!uri.isDirectory) return false
  await setSelectedManagedFolder(uri.path)
  return true
}

export const setBgPic = (pic: string | null) => {
  commonActions.setBgPic(pic)
}
