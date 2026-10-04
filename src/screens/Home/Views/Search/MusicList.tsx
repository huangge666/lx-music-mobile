import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import OnlineList, { type OnlineListType } from '@/components/OnlineList'
import { search } from '@/core/search/music'
import searchMusicState, { type Source } from '@/store/search/music/state'
import PartialSearchNotice from './PartialSearchNotice'

export interface MusicListType {
  loadList: (text: string, source: Source) => void
}

export default forwardRef<MusicListType, {}>((props, ref) => {
  const listRef = useRef<OnlineListType>(null)
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
        if (isCurrent()) listRef.current?.setList(partial, page > 1, source == 'all')
      }, (count) => {
        if (isCurrent()) setPartialFailed(count > 0)
      }, force)
      if (!isCurrent()) return
      const info = searchMusicState.listInfos[source]!
      nextPageRef.current = page + 1
      listRef.current?.setList(list, page > 1, source == 'all')
      listRef.current?.setStatus(info.maxPage <= page ? 'end' : 'idle')
    } catch {
      if (!isCurrent()) return
      // 增量回包可能已经写入本页数据；失败重试仍应请求本页，而不是跳到下一页。
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
      listRef.current?.setList([], false, source == 'all')
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
    <OnlineList ref={listRef} onRefresh={handleRefresh} onLoadMore={handleLoadMore} checkHomePagerIdle search />
  </>
})
