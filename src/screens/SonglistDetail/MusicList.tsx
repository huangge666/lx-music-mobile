import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
import commonState from '@/store/common/state'
import { clearListDetail, getListDetail, setListDetail, setListDetailInfo } from '@/core/songlist'
import songlistState from '@/store/songlist/state'
import { useBgPic, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'

import ScrollTopBtn from '@/components/common/ScrollTopBtn'
import { handlePlay } from './listAction'
import Header, { type HeaderType } from './Header'
import { useListInfo } from './state'

export interface MusicListProps {
  componentId: string
}

export interface MusicListType {
  loadList: (source: LX.OnlineSource, listId: string) => void
}

export default forwardRef<MusicListType, MusicListProps>(({ componentId }, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const headerRef = useRef<HeaderType>(null)
  const isUnmountedRef = useRef(false)
  const info = useListInfo()
  const theme = useTheme()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const hasDynamicBg = useBgPic() != null
  // 头部内部的操作栏会读取列表上下文，不能提前 memo，否则首次渲染会拿到未定义的 info
  const header = <Header ref={headerRef} componentId={componentId} />
  const [showScrollTop, setShowScrollTop] = useState(false)
  const showScrollTopRef = useRef(false)
  const handleScroll = useCallback((offset: number) => {
    const visible = offset > 640
    if (visible == showScrollTopRef.current) return
    showScrollTopRef.current = visible
    setShowScrollTop(visible)
  }, [])
  const handleScrollTop = useCallback(() => {
    listRef.current?.scrollToTop()
  }, [])

  const back = () => {
    void pop(commonState.componentIds.songlistDetail!)
  }

  useImperativeHandle(ref, () => ({
    async loadList(source, id) {
      clearListDetail()
      const listDetailInfo = songlistState.listDetailInfo
      listRef.current?.setList([])
      if (listDetailInfo.id == id && listDetailInfo.source == source && listDetailInfo.list.length) {
        requestAnimationFrame(() => {
          listRef.current?.setList(listDetailInfo.list)
          headerRef.current?.setInfo({
            name: (info?.name || listDetailInfo.info.name) ?? '',
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            desc: listDetailInfo.info.desc || info?.desc || '',
            playCount: (info?.play_count ?? listDetailInfo.info.play_count) ?? '',
            imgUrl: info?.img ?? listDetailInfo.info.img,
            total: listDetailInfo.total,
          })
        })
      } else {
        listRef.current?.setStatus('loading')
        const page = 1
        if (info) setListDetailInfo(info.source, info.id)
        headerRef.current?.setInfo({
          name: (info?.name || listDetailInfo.info.name) ?? '',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          desc: listDetailInfo.info.desc || info?.desc || '',
          playCount: (info?.play_count ?? listDetailInfo.info.play_count) ?? '',
          imgUrl: info?.img ?? listDetailInfo.info.img,
          total: listDetailInfo.total,
        })
        return getListDetail(id, source, page).then((listDetail) => {
          const result = setListDetail(listDetail, id, page)
          if (isUnmountedRef.current) return
          requestAnimationFrame(() => {
            headerRef.current?.setInfo({
              name: (info?.name || listDetailInfo.info.name) ?? '',
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              desc: listDetailInfo.info.desc || info?.desc || '',
              playCount: (info?.play_count ?? listDetailInfo.info.play_count) ?? '',
              imgUrl: info?.img ?? listDetailInfo.info.img,
              total: result.total,
            })
            listRef.current?.setList(result.list)
            listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
          })
        }).catch(() => {
          if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
          listRef.current?.setStatus('error')
        })
      }
    },
  }))

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])


  const handlePlayList: OnlineListProps['onPlayList'] = (index) => {
    const listDetailInfo = songlistState.listDetailInfo
    // console.log(songlistState.listDetailInfo)
    void handlePlay(listDetailInfo.id, listDetailInfo.source, listDetailInfo.list, index)
  }
  const handleRefresh: OnlineListProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    getListDetail(songlistState.listDetailInfo.id, songlistState.listDetailInfo.source, page, true).then((listDetail) => {
      const result = setListDetail(listDetail, songlistState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list)
      listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
      headerRef.current?.setInfo({
        name: (info?.name || result.info.name) ?? '',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        desc: result.info.desc || info?.desc || '',
        playCount: (info?.play_count ?? result.info.play_count) ?? '',
        imgUrl: info?.img ?? result.info.img,
        total: result.total,
      })
    }).catch(() => {
      if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }
  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const page = songlistState.listDetailInfo.list.length ? songlistState.listDetailInfo.page + 1 : 1
    getListDetail(songlistState.listDetailInfo.id, songlistState.listDetailInfo.source, page).then((listDetail) => {
      const result = setListDetail(listDetail, songlistState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list, true)
      listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }

  return (
    <View style={styles.container}>
      <View style={{
        ...styles.nav,
        paddingTop: statusBarHeight + 8,
        backgroundColor: hasDynamicBg ? 'transparent' : theme['c-content-background'],
      }}>
        <TouchableOpacity
          accessibilityLabel={t('back')}
          onPress={back}
          activeOpacity={0.72}
          style={{ ...styles.backBtn, backgroundColor: theme['c-card-background'], borderColor: theme['c-border-background'] }}
        >
          <Icon name="chevron-left" color={theme['c-font']} size={17} />
        </TouchableOpacity>
        <View style={{ ...styles.source, backgroundColor: theme['c-primary-background'], borderColor: theme['c-primary-alpha-700'] }}>
          <View style={{ ...styles.sourceDot, backgroundColor: theme['c-primary'] }} />
          <Text size={11} color={theme['c-primary-font']}>{info?.source?.toUpperCase() ?? ''}</Text>
        </View>
      </View>
      <View style={styles.listArea}>
        <OnlineList
          ref={listRef}
          onPlayList={handlePlayList}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          onScroll={handleScroll}
          ListHeaderComponent={header}
        />
        <View style={styles.fabWrap} pointerEvents="box-none">
          <ScrollTopBtn visible={showScrollTop} onPress={handleScrollTop} />
        </View>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
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
  nav: {
    zIndex: 2,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  source: {
    minHeight: 24,
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
  },
})

