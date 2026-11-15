import { LIST_IDS } from '@/config/constant'
import { createList, getListMusics, overwriteList, overwriteListFull, overwriteListMusics } from '@/core/list'
import { filterMusicList, fixNewMusicInfoQuality, toNewMusicInfo } from '@/utils'
import { log } from '@/utils/log'
import { confirmDialog, handleReadFile, handleSaveFile, showImportTip, toast } from '@/utils/tools'
import listState from '@/store/list/state'


const getAllLists = async() => {
  const lists = []
  lists.push(await getListMusics(listState.defaultList.id).then(musics => ({ ...listState.defaultList, list: musics })))
  lists.push(await getListMusics(listState.loveList.id).then(musics => ({ ...listState.loveList, list: musics })))

  for await (const list of listState.userList) {
    lists.push(await getListMusics(list.id).then(musics => ({ ...list, list: musics })))
  }

  return lists
}
const normalizeMusics = (data: unknown, legacy = false): LX.Music.MusicInfo[] => {
  if (!Array.isArray(data)) throw new Error('Invalid playlist songs')
  // 旧音质修复会改写嵌套字段；先复制，避免改动调用方或尚未落盘的原数据。
  const copied = JSON.parse(JSON.stringify(data)) as LX.Music.MusicInfo[]
  const musics = legacy ? copied.map(m => toNewMusicInfo(m)) : copied
  for (const music of musics) {
    if (!music || typeof music.id != 'string' || !music.id || typeof music.name != 'string' || !music.name ||
      typeof music.source != 'string' || !music.source || !music.meta || typeof music.meta != 'object') {
      throw new Error('Invalid playlist song')
    }
  }
  return filterMusicList(musics).map(m => fixNewMusicInfoQuality(m))
}

const normalizeList = (data: unknown, legacy = false): LX.ConfigFile.MyListInfoPart['data'] => {
  if (!data || typeof data != 'object') throw new Error('Invalid playlist')
  const list = data as LX.List.UserListInfoFull
  if (typeof list.id != 'string' || !list.id || typeof list.name != 'string') throw new Error('Invalid playlist metadata')
  return { ...list, list: normalizeMusics(list.list, legacy), locationUpdateTime: list.locationUpdateTime ?? null }
}

const importListData = async(data: unknown, legacy = false) => {
  if (!Array.isArray(data)) throw new Error('Invalid playlists')
  // 全部解析成功再提交，损坏的后续歌单不能让前面的歌单被部分覆盖。
  const lists = data.map(list => normalizeList(list, legacy))
  const allLists = await getAllLists()
  for (const list of lists) {
    const targetList = allLists.find(l => l.id == list.id)
    if (targetList) targetList.list = list.list
    else allLists.push(list)
  }
  const defaultList = allLists.shift()!.list
  const loveList = allLists.shift()!.list
  await overwriteListFull({ defaultList, loveList, userList: allLists as LX.List.UserListInfoFull[] })
}

/**
 * 导入单个列表
 * @param listData
 * @param position
 * @returns
 */
export const handleImportListPart = async(listData: LX.ConfigFile.MyListInfoPart['data'], position: number = listState.userList.length) => {
  listData = normalizeList(listData)
  const targetList = listState.allList.find(l => l.id === listData.id)
  if (targetList) {
    const confirm = await confirmDialog({
      message: global.i18n.t('list_import_part_confirm', { importName: listData.name, localName: targetList.name }),
      cancelButtonText: global.i18n.t('list_import_part_button_cancel'),
      confirmButtonText: global.i18n.t('list_import_part_button_confirm'),
      bgClose: false,
    })
    if (confirm) {
      const replacement: LX.List.UserListInfoFull = {
        ...listData,
        name: targetList.name,
        locationUpdateTime: 'locationUpdateTime' in listData ? listData.locationUpdateTime : null,
      }
      await overwriteList(replacement)
      toast(global.i18n.t('setting_backup_part_import_list_tip_success'))
      return
    }
    listData = { ...listData, id: `${listData.id}__${Date.now()}`, locationUpdateTime: null }
  }
  const userList = listData as LX.List.UserListInfoFull
  await createList({
    name: userList.name,
    id: userList.id,
    list: userList.list,
    source: userList.source,
    sourceListId: userList.sourceListId,
    position: Math.max(position, -1),
  })
  toast(global.i18n.t('setting_backup_part_import_list_tip_success'))
}

const showConfirm = async() => {
  return confirmDialog({
    message: global.i18n.t('list_import_part_confirm_tip'),
    cancelButtonText: global.i18n.t('dialog_cancel'),
    confirmButtonText: global.i18n.t('confirm_button_text'),
    bgClose: false,
  })
}
const importPlayList = async(path: string) => {
  const configData = await handleReadFile<{
    type: string
    data?: unknown
    defaultList?: { list: unknown }
    playList?: unknown
  }>(path)
  if (!configData || typeof configData != 'object' || typeof configData.type != 'string') throw new Error('Invalid playlist file')

  switch (configData.type) {
    case 'defautlList': // 兼容0.6.2及以前版本的列表数据
      if (!await showConfirm()) return true
      await overwriteListMusics(LIST_IDS.DEFAULT, normalizeMusics((configData.data as { list: unknown }).list, true))
      break
    case 'playList':
      if (!await showConfirm()) return true
      await importListData(configData.data, true)
      break
    case 'playList_v2':
      if (!await showConfirm()) return true
      await importListData(configData.data)
      break
    case 'allData':
      if (!await showConfirm()) return true
      // 兼容0.6.2及以前版本的列表数据
      if (configData.defaultList) await overwriteListMusics(LIST_IDS.DEFAULT, normalizeMusics(configData.defaultList.list, true))
      else await importListData(configData.playList, true)
      break
    case 'allData_v2':
      if (!await showConfirm()) return true
      await importListData(configData.playList)
      break
    case 'playListPart':
      await handleImportListPart(normalizeList(configData.data, true))
      return true
    case 'playListPart_v2':
      await handleImportListPart(normalizeList(configData.data))
      return true
    default:
      showImportTip(configData.type)
      return true
  }
}

export const handleImportList = async(path: string) => {
  toast(global.i18n.t('setting_backup_part_import_list_tip_unzip'))
  return importPlayList(path).then((skipTip) => {
    if (skipTip) return
    toast(global.i18n.t('setting_backup_part_import_list_tip_success'))
  }).catch((err) => {
    log.error(err)
    toast(global.i18n.t('setting_backup_part_import_list_tip_error'))
  })
}


const exportAllList = async(path: string) => {
  const data = JSON.parse(JSON.stringify({
    type: 'playList_v2',
    data: await getAllLists(),
  }))

  try {
    await handleSaveFile(path + '/lx_list.lxmc', data)
  } catch (error: any) {
    log.error(error.stack)
    throw error
  }
}
export const handleExportList = async(path: string) => {
  toast(global.i18n.t('setting_backup_part_export_list_tip_zip'))
  return exportAllList(path).then(() => {
    toast(global.i18n.t('setting_backup_part_export_list_tip_success'))
  }).catch((err: any) => {
    log.error(err.message)
    toast(global.i18n.t('setting_backup_part_export_list_tip_failed') + ': ' + (err.message as string))
  })
}
