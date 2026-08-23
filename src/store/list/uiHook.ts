import { useEffect, useMemo, useState } from 'react'
import state, { type InitState } from './state'
import { LIST_IDS } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { allMusicList } from '@/utils/listManage'
import { getListMusics as getListMusicsFromStore } from '@/utils/data'

export const useActiveListId = () => {
  const [id, setId] = useState(state.activeListId)

  useEffect(() => {
    global.state_event.on('mylistToggled', setId)
    return () => {
      global.state_event.off('mylistToggled', setId)
    }
  }, [])

  return id
}

export const useActiveListName = () => {
  const currentListId = useActiveListId()
  const langId = useSettingValue('common.langId')
  return useMemo(() => {
    switch (currentListId) {
      case LIST_IDS.TEMP:
        return global.i18n?.t('list_name_temp') ?? ''
      case LIST_IDS.DEFAULT:
        return global.i18n?.t('list_name_default') ?? ''
      case LIST_IDS.LOVE:
        return global.i18n?.t('list_name_love') ?? ''
      default:
        return state.allList.find(l => l.id === currentListId)?.name ?? ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentListId, langId])
}

const listMusicCountCache = new Map<string, number>()

const readCachedCount = (listId: string): number | undefined => {
  const musics = allMusicList.get(listId)
  if (musics) {
    listMusicCountCache.set(listId, musics.length)
    return musics.length
  }
  return listMusicCountCache.get(listId)
}

export const useListMusicCount = (listId: string) => {
  const [count, setCount] = useState<number | null>(() => readCachedCount(listId) ?? null)

  useEffect(() => {
    let cancelled = false

    const applyCount = (value: number) => {
      listMusicCountCache.set(listId, value)
      if (!cancelled) setCount(value)
    }

    const load = async() => {
      const cached = readCachedCount(listId)
      if (cached != null) {
        applyCount(cached)
        return
      }
      const list = await getListMusicsFromStore(listId)
      applyCount(list.length)
    }
    void load()

    const handleUpdate = (ids: string[]) => {
      if (!ids.includes(listId)) return
      const musics = allMusicList.get(listId)
      if (musics) {
        applyCount(musics.length)
        return
      }
      void getListMusicsFromStore(listId).then(list => { applyCount(list.length) })
    }
    global.app_event.on('myListMusicUpdate', handleUpdate)
    return () => {
      cancelled = true
      global.app_event.off('myListMusicUpdate', handleUpdate)
    }
  }, [listId])

  return count
}

export const useMylistPlaylistsVisible = () => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const handleVisible = (visibleList: boolean) => {
      setVisible(visibleList)
    }
    global.app_event.on('changeLoveListVisible', handleVisible)
    return () => {
      global.app_event.off('changeLoveListVisible', handleVisible)
    }
  }, [])

  return visible
}

export const useListFetching = (listId: string) => {
  const [fetching, setFetching] = useState(!!state.fetchingListStatus[listId])

  useEffect(() => {
    let prevStatus = state.fetchingListStatus[listId]
    const handleUpdate = (status: InitState['fetchingListStatus']) => {
      let currentStatus = status[listId]
      if (currentStatus == null || prevStatus == status[listId]) return
      setFetching(prevStatus = currentStatus)
    }
    global.state_event.on('fetchingListStatusUpdated', handleUpdate)
    return () => {
      global.state_event.off('fetchingListStatusUpdated', handleUpdate)
    }
  }, [listId])

  return fetching
}
