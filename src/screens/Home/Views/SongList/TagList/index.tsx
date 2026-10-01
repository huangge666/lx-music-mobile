import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { InteractionManager } from 'react-native'

import songlistState, { type Source } from '@/store/songlist/state'
import List, { type ListProps, type ListType } from './List'


export default memo(() => {
  // 面板是否已挂载。首屏空闲后就会预挂载，点开侧栏时无需再等待渲染
  const [visible, setVisible] = useState(false)
  const listRef = useRef<ListType>(null)

  useEffect(() => {
    let isInited = false
    let isUnmounted = false
    const loadTagList = (source: Source, id: string) => {
      if (isInited) {
        listRef.current?.loadTag(source, id)
        return
      }
      isInited = true
      requestAnimationFrame(() => {
        if (isUnmounted) return
        setVisible(true)
        requestAnimationFrame(() => {
          if (isUnmounted) return
          listRef.current?.loadTag(source, id)
        })
      })
    }
    const handleShow = (source: Source, id: string) => {
      loadTagList(source, id)
    }
    global.app_event.on('showSonglistTagList', handleShow)

    // 预挂载：等首屏渲染与手势都结束之后再渲染标签面板（此时侧栏还在屏外），
    // 这样点开侧栏时只剩原生滑出动画，不会再有一次性挂载上百个标签造成的掉帧
    const task = InteractionManager.runAfterInteractions(() => {
      if (isUnmounted) return
      const { source, tagId } = songlistState.listInfo
      loadTagList(source, tagId)
    })

    return () => {
      isUnmounted = true
      task.cancel()
      global.app_event.off('showSonglistTagList', handleShow)
    }
  }, [])

  // 固定身份，避免外层重渲染时把整份标签分组都带着重排
  const handleTagChange: ListProps['onTagChange'] = useCallback((name, id) => {
    global.app_event.hideSonglistTagList()
    requestAnimationFrame(() => {
      global.app_event.songlistTagInfoChange(name, id)
    })
  }, [])

  return (
    visible
      ? <List ref={listRef} onTagChange={handleTagChange} />
      : null
  )
})
