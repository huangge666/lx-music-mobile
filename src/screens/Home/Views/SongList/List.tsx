import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import Songlist, { type SonglistProps, type SonglistType } from './components/Songlist'
import { clearList, getList, setList, setListInfo } from '@/core/songlist'
import songlistState from '@/store/songlist/state'
import { type Source } from '@/store/songlist/state'


export interface ListType {
  loadList: (source: Source, sortId: string, tagId: string) => void
}

export default forwardRef<ListType, {}>((props, ref) => {
  const listRef = useRef<SonglistType>(null)
  const isUnmountedRef = useRef(false)
  const generation = useRef(0)

  /** 请求持有自己的筛选快照；平台、标签或刷新变化后旧结果不再写入全局和当前页面。 */
  const loadPage = async(source: Source, sortId: string, tagId: string, page: number, refresh = false) => {
    const request = ++generation.current
    const isCurrent = () => !isUnmountedRef.current && request == generation.current
    try {
      const info = await getList(source, tagId, sortId, page, refresh)
      if (!isCurrent()) return
      const result = setList(info, tagId, sortId, page)
      requestAnimationFrame(() => {
        if (!isCurrent()) return
        listRef.current?.setList(result.list)
        listRef.current?.setStatus(result.maxPage <= page ? 'end' : 'idle')
      })
    } catch {
      if (!isCurrent()) return
      if (page == 1) clearList()
      listRef.current?.setStatus('error')
    }
  }

  useImperativeHandle(ref, () => ({
    async loadList(source, sortId, tagId) {
      const listInfo = songlistState.listInfo
      listRef.current?.setList([])
      if (listInfo.tagId == tagId && listInfo.sortId == sortId && listInfo.source == source && listInfo.list.length) {
        const request = ++generation.current
        requestAnimationFrame(() => {
          if (isUnmountedRef.current || request != generation.current) return
          listRef.current?.setList(listInfo.list)
          listRef.current?.setStatus(listInfo.maxPage <= listInfo.page ? 'end' : 'idle')
        })
      } else {
        listRef.current?.setStatus('loading')
        setListInfo(source, tagId, sortId)
        return loadPage(source, sortId, tagId, 1)
      }
    },
  }), [])

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])


  const handleRefresh: SonglistProps['onRefresh'] = () => {
    listRef.current?.setStatus('refreshing')
    const { source, tagId, sortId } = songlistState.listInfo
    void loadPage(source, sortId, tagId, 1, true)
  }
  const handleLoadMore: SonglistProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const { source, tagId, sortId, list, page } = songlistState.listInfo
    void loadPage(source, sortId, tagId, list.length ? page + 1 : 1)
  }

  return <Songlist
    ref={listRef}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
   />
})

