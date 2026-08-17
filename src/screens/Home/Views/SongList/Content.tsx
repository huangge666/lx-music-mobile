import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

import HeaderBar, { type HeaderBarProps, type HeaderBarType } from './HeaderBar'
import Tag, { type TagProps, type TagType } from './HeaderBar/Tag'
import List, { type ListType } from './List'
import songlistState, { type InitState, type SortInfo } from '@/store/songlist/state'
import { getSongListSetting, saveSongListSetting } from '@/utils/data'

interface SonglistInfo {
  source: InitState['sources'][number]
  sortId: SortInfo['id']
  tagId: string
}

export default () => {
  const headerBarRef = useRef<HeaderBarType>(null)
  const tagRef = useRef<TagType>(null)
  const listRef = useRef<ListType>(null)
  const songlistInfo = useRef<SonglistInfo>({ source: 'kw', sortId: '5', tagId: '' })

  useEffect(() => {
    void getSongListSetting().then(info => {
      songlistInfo.current.source = info.source
      songlistInfo.current.sortId = info.sortId
      songlistInfo.current.tagId = info.tagId
      headerBarRef.current?.setSource(info.source, info.sortId)
      tagRef.current?.setSelectedTagInfo(info.source, info.tagName, info.tagId)
      listRef.current?.loadList(info.source, info.sortId, info.tagId)
    })
  }, [])

  const handleSortChange: HeaderBarProps['onSortChange'] = (id) => {
    songlistInfo.current.sortId = id
    void saveSongListSetting({ sortId: id })
    listRef.current?.loadList(songlistInfo.current.source, id, songlistInfo.current.tagId)
  }

  const handleTagChange: TagProps['onTagChange'] = (name, id) => {
    songlistInfo.current.tagId = id
    void saveSongListSetting({ tagName: name, tagId: id })
    listRef.current?.loadList(songlistInfo.current.source, songlistInfo.current.sortId, id)
  }

  const handleSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    songlistInfo.current.source = source
    songlistInfo.current.tagId = ''
    songlistInfo.current.sortId = songlistState.sortList[source]![0].id
    void saveSongListSetting({ sortId: songlistInfo.current.sortId, source, tagId: '', tagName: '' })
    headerBarRef.current?.setSource(source, songlistInfo.current.sortId)
    tagRef.current?.setSelectedTagInfo(source, '', songlistInfo.current.tagId)
    listRef.current?.loadList(source, songlistInfo.current.sortId, songlistInfo.current.tagId)
  }

  return (
    <View style={styles.container}>
      <HeaderBar
        ref={headerBarRef}
        onSortChange={handleSortChange}
        onSourceChange={handleSourceChange}
      />
      <View style={styles.listArea}>
        <List ref={listRef} />
        <View style={styles.fabWrap} pointerEvents="box-none">
          <Tag ref={tagRef} onTagChange={handleTagChange} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  listArea: {
    flex: 1,
    position: 'relative',
  },
  fabWrap: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    zIndex: 8,
  },
})
