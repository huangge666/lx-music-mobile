import { useEffect, useState } from 'react'
import state from './state'
import { getListMusics } from '@/core/list'

export {
  useActiveListId,
  useActiveListName,
  useMylistPlaylistsVisible,
  useListFetching,
  useListMusicCount,
} from './uiHook'

export const useMyList = () => {
  const [lists, setList] = useState(state.allList)
  if (global.i18n) {
    lists[0].name = global.i18n.t('list_name_default')
    lists[1].name = global.i18n.t('list_name_love')
  }

  useEffect(() => {
    const handleConfigUpdate = (keys: Array<keyof LX.AppSetting>) => {
      if (!keys.includes('common.langId')) return
      setList((lists) => {
        lists[0].name = global.i18n.t('list_name_default')
        lists[1].name = global.i18n.t('list_name_love')
        return [...lists]
      })
    }
    global.state_event.on('mylistUpdated', setList)
    global.state_event.on('configUpdated', handleConfigUpdate)
    return () => {
      global.state_event.off('mylistUpdated', setList)
      global.state_event.off('configUpdated', handleConfigUpdate)
    }
  }, [])

  return lists
}

export const useMusicList = () => {
  const [list, setList] = useState<LX.List.ListMusics>([])

  useEffect(() => {
    const handleToggle = (activeListId: string) => {
      void getListMusics(activeListId).then((list) => {
        setList([...list])
      })
    }
    const handleChange = (ids: string[]) => {
      if (!ids.includes(state.activeListId)) return
      void getListMusics(state.activeListId).then((list) => {
        setList([...list])
      })
    }
    global.state_event.on('mylistToggled', handleToggle)
    global.app_event.on('myListMusicUpdate', handleChange)

    handleToggle(state.activeListId)

    return () => {
      global.state_event.off('mylistToggled', handleToggle)
      global.app_event.off('myListMusicUpdate', handleChange)
    }
  }, [])

  return list
}

export const useMusicExistsList = (list: LX.List.MyListInfo, musicInfo: LX.Music.MusicInfo) => {
  const [isExists, setExists] = useState(false)

  useEffect(() => {
    void getListMusics(list.id).then((musics) => {
      setExists(musics.some(s => s.id == musicInfo.id))
    })
  }, [list.id, musicInfo.id])

  return isExists
}


