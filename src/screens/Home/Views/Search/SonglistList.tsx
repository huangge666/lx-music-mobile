import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { search } from '@/core/search/songlist'
import Songlist, { type SonglistType } from '@/screens/Home/Views/SongList/components/Songlist'
import searchSonglistState, { type Source } from '@/store/search/songlist/state'
import PartialSearchNotice from './PartialSearchNotice'

export interface MusicListType {
  loadList: (text: string, source: Source) => void
}

export default forwardRef<MusicListType, {}>((props, ref) => {
  const listRef = useRef<SonglistType>(null)
  const searchInfoRef = useRef<{ text: string, source: Source }>({ text: '', source: 'kw' })
  const isUnmountedRef = useRef(false)
  const requestRef = useRef(0)
  const loadingRef = useRef(false)
  const nextPageRef = useRef(1)
  const failedPageRef = useRef<number | null>(null)
  const [partialFailed, setPartialFailed] = useState(false)

  const loadPage = useCallback(async(page: number, refresh = false, force = false) => {
    const { text, source } = searchInfoRef.current
    const request = ++requestRef.current
    const isCurrent = () => !isUnmountedRef.current && request == requestRef.current
    loadingRef.current = true
    failedPageRef.current = null
    setPartialFailed(false)
    listRef.current?.setStatus(refresh ? 'refreshing' : 'loading')
    try {
      const list = await search(text, page, source, (partial) => {
        if (isCurrent()) listRef.current?.setList(partial, source == 'all')
      }, (count) => {
        if (isCurrent()) setPartialFailed(count > 0)
      }, force)
      if (!isCurrent()) return
      nextPageRef.current = page + 1
      listRef.current?.setList(list, source == 'all')
      // 歌单 store 没有维护 maxPages.all；单源总页数也需从 total/limit 计算。
      const info = searchSonglistState.listInfos[source]!
      const maxPage = source == 'all'
        ? Math.max(0, ...searchSonglistState.sources.filter(id => id != 'all').map(id => searchSonglistState.maxPages[id] ?? 0))
        : Math.ceil(info.total / info.limit)
      listRef.current?.setStatus(maxPage <= page ? 'end' : 'idle')
    } catch {
      if (!isCurrent()) return
      failedPageRef.current = page
      listRef.current?.setStatus('error')
    } finally {
      if (isCurrent()) loadingRef.current = false
    }
  }, [])

  useImperativeHandle(ref, () => ({
    loadList(text, source) {
      searchInfoRef.current = { text, source }
      nextPageRef.current = 1
      listRef.current?.setList([], source == 'all')
      void loadPage(1)
    },
  }), [loadPage])

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
      // 这是请求序号而不是节点引用，卸载必须使当时最新的请求失效。
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestRef.current++
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (loadingRef.current) return
    void loadPage(1, true, true)
  }, [loadPage])
  const handleLoadMore = useCallback(() => {
    if (loadingRef.current) return
    void loadPage(failedPageRef.current ?? nextPageRef.current, false, failedPageRef.current != null)
  }, [loadPage])

  return <>
    {partialFailed && <PartialSearchNotice onRetry={handleRefresh} />}
    <Songlist ref={listRef} onRefresh={handleRefresh} onLoadMore={handleLoadMore} search />
  </>
})
