import { forwardRef, memo, useEffect, useImperativeHandle, useState } from 'react'

import PlaylistHero from '@/components/common/PlaylistHero'
import { AnimatedText } from '@/components/common/Text'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useI18n } from '@/lang'
import { useNavigationComponentDidAppear } from '@/navigation'
import { useAnimateOnecNumber } from '@/utils/hooks/useAnimateNumber'
import { createStyle } from '@/utils/tools'
import { useListInfo } from './state'
import { usePlaylistActions } from './usePlaylistActions'

/** 接口简介里的换行标签按真实换行展示，避免页面直接露出 br 标签。 */
const formatDescription = (desc: string) => desc
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
  .replace(/<\/?p[^>]*>/gi, '')
  .replace(/&nbsp;/gi, ' ')
  .trim()

const CountText = memo(({ count }: { count: string }) => {
  const [animFade] = useAnimateOnecNumber(0, 1, 250, false)
  const [animTranslateY] = useAnimateOnecNumber(10, 0, 250, false)
  return (
    <AnimatedText style={{
      ...styles.playCount,
      opacity: animFade,
      transform: [
        { translateY: animTranslateY },
      ],
    }} numberOfLines={ 1 }>{count}</AnimatedText>
  )
}, (prevProps, nextProps) => {
  return true
})

export interface HeaderProps {
  componentId: string
  /** 加载失败时重试：沿用列表的刷新逻辑，不在头部另造请求 */
  onRetry?: () => void
}

export type HeaderStatus = 'idle' | 'loading' | 'error'

export interface HeaderType {
  setInfo: (info: DetailInfo) => void
  /** 列表状态同步给主视觉：加载中显示占位，失败时可点击重试 */
  setStatus: (status: HeaderStatus) => void
}

export interface DetailInfo {
  name: string
  desc: string
  playCount: string
  imgUrl?: string
  total?: number
}

/**
 * 在线歌单详情的主视觉。
 *
 * 这里只做数据适配：把接口里的名称/简介/播放量/总数与统计、播放、收藏动作交给 PlaylistHero，
 * 排版与占位由共享组件负责，两种歌单详情保持一致。
 */
export default forwardRef<HeaderType, HeaderProps>(({ componentId, onRetry }, ref) => {
  const t = useI18n()
  const info = useListInfo()
  const actions = usePlaylistActions(info)
  const [detailInfo, setDetailInfo] = useState<DetailInfo>({ name: '', desc: '', playCount: '', imgUrl: info?.img, total: 0 })
  const [status, setStatus] = useState<HeaderStatus>('idle')
  const [appeared, setAppeared] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | undefined>(detailInfo.imgUrl ?? info?.img)

  useNavigationComponentDidAppear(componentId, () => {
    setAppeared(true)
  })

  useImperativeHandle(ref, () => ({
    setInfo(nextInfo) {
      setDetailInfo(nextInfo)
    },
    setStatus(nextStatus) {
      setStatus(nextStatus)
    },
  }), [])

  // 共享元素转场结束后才替换封面地址，避免动画过程中换图闪动
  const nextCoverUrl = detailInfo.imgUrl ?? info?.img
  useEffect(() => {
    if (appeared) setCoverUrl(nextCoverUrl)
  }, [appeared, nextCoverUrl])

  // 0 / 空串表示接口没给值，需要回退到另一份数据，这里保留逻辑或语义
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const songCount = detailInfo.total || Number(info?.total) || 0
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const description = formatDescription(detailInfo.desc || info?.desc || '')
  const meta = [
    songCount > 0 ? t('list_music_count', { num: songCount }) : null,
    info?.author,
    info?.source ? info.source.toUpperCase() : null,
  ].filter(Boolean).join(' · ')

  return (
    <PlaylistHero
      title={detailInfo.name || info?.name || ''}
      coverUrl={coverUrl}
      coverNativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info?.id ?? ''}`}
      titleNativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}
      placeholderSeed={info?.id ?? detailInfo.name}
      meta={meta || null}
      description={description || null}
      expandText={t('expand')}
      collapseText={t('collapse')}
      status={status}
      statusText={status == 'error' ? t('list_error') : undefined}
      onRetry={onRetry}
      coverBadge={detailInfo.playCount && appeared ? <CountText count={detailInfo.playCount} /> : null}
      shuffleActive={actions.shuffleActive}
      busy={actions.busy}
      isCollected={actions.isCollected}
      playLabel={t('play_all')}
      shuffleLabel={t('play_list_random')}
      collectLabel={t(actions.isCollected ? 'collected_songlist' : 'collect_songlist')}
      onPlay={actions.play}
      onShuffle={actions.shuffle}
      onCollect={actions.collect}
    />
  )
})

const styles = createStyle({
  playCount: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(8, 8, 10, 0.66)',
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
})
