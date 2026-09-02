import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

import Popup, { type PopupType } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Loading from '@/components/common/Loading'
import { useTheme } from '@/store/theme/hook'
import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'
import { updateSetting } from '@/core/common'
import { setMusicUrl } from '@/core/player/player'
import { getPlayQuality } from '@/core/music/utils'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useI18n } from '@/lang'
import { createStyle, toast } from '@/utils/tools'

export interface QualitySwitchPopupType {
  show: () => void
}

/** 音质选项从高到低的展示顺序 */
const QUALITY_ORDER: LX.Quality[] = ['flac24bit', 'flac', 'ape', 'wav', '320k', '192k', '128k']

/**
 * 获取当前播放歌曲可用的音质列表（高 → 低）
 * 仅在线歌曲 / 下载歌曲支持，本地歌曲返回空列表
 */
const getAvailableQualitys = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem | null): LX.Quality[] => {
  if (!musicInfo) return []
  // 下载列表项的原始歌曲信息存放在 metadata.musicInfo 中
  const onlineInfo = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
  if (!onlineInfo || onlineInfo.source == 'local') return []
  const qualitys = onlineInfo.meta._qualitys
  return QUALITY_ORDER.filter(q => qualitys?.[q])
}

/**
 * 音质标签文案（与 PlayDetail 进度区显示保持一致）
 */
const useQualityLabel = () => {
  const t = useI18n()
  return useMemo(() => (q: LX.Quality) => {
    switch (q) {
      case 'flac24bit':
        return t('quality_lossless_24bit')
      case 'flac':
      case 'ape':
      case 'wav':
        return t('quality_lossless')
      case '320k':
        return t('quality_high_quality')
      case '192k':
      case '128k':
        return q.toUpperCase()
      default:
        return String(q)
    }
  }, [t])
}

/**
 * 根据取链接失败的异常信息归类失败原因，返回对应的 i18n key
 */
const getFailReasonKey = (err: any): 'quality_switch_failed_timeout' | 'quality_switch_failed_api' => {
  const msg = String(err?.message ?? '')
  if (/timeout/i.test(msg)) return 'quality_switch_failed_timeout'
  if (/source init failed|no api source|aborted|toggle source/i.test(msg)) return 'quality_switch_failed_api'
  return 'quality_switch_failed_api'
}

/**
 * 播放详情 - 音质切换弹窗
 *
 * 点击音质标签弹出，列出当前歌曲支持的音质；
 * 选择后写入全局默认播放音质设置，并重新获取当前歌曲的播放链接。
 */
const QualitySwitchPopup = forwardRef<QualitySwitchPopupType>((_, ref) => {
  const [visible, setVisible] = useState(false)
  // 正在切换中的音质（用于行内 loading 动画与禁用其它选项），null 表示空闲
  const [switchingQuality, setSwitchingQuality] = useState<LX.Quality | null>(null)
  // 切换超时定时器：超时未收到结果则按失败处理，避免一直转圈
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const popupRef = useRef<PopupType>(null)
  const playerMusicInfo = usePlayerMusicInfo()
  const getLabel = useQualityLabel()
  const t = useI18n()
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) popupRef.current?.setVisible(true)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          popupRef.current?.setVisible(true)
        })
      }
    },
  }))

  // 组件卸载时清理未触发的切换超时定时器
  useEffect(() => () => {
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current)
  }, [])

  // 当前实际生效的音质，用于标记选中项：
  // 优先使用播放器取到链接后记录的真实音质（playerState.musicInfo.quality），
  // 尚未取得时按 getPlayQuality 从当前默认音质逐级回落推算
  const currentQuality = useMemo(() => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return null
    const onlineInfo = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
    if (!onlineInfo || onlineInfo.source == 'local') return null
    return playerMusicInfo.quality ?? getPlayQuality(settingState.setting['player.playQuality'], onlineInfo)
  }, [playerMusicInfo.quality])

  const qualitys = useMemo(() => {
    return visible ? getAvailableQualitys(playerState.playMusicInfo.musicInfo) : []
    // playerMusicInfo.id 是“歌曲已切换”的代理依赖（playerState 为可变单例，musicInfo 无法直接进依赖数组）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, playerMusicInfo.id])

  const handleChange = (quality: LX.Quality) => {
    // 切换进行中忽略其它点击，避免并发取链接
    if (switchingQuality) return
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    const onlineInfo = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
    if (!onlineInfo || onlineInfo.source == 'local') return
    // 当前音源不支持所选音质时直接提示，不发起请求
    if (!getAvailableQualitys(musicInfo).includes(quality)) {
      toast(t('quality_switch_failed_unsupported', { quality: getLabel(quality) }), 'long')
      return
    }
    if (quality === currentQuality) {
      popupRef.current?.setVisible(false)
      return
    }
    // 保持弹窗打开以便展示行内切换动画，结束后再关闭
    // 写入全局默认播放音质，后续歌曲按此音质播放
    updateSetting({ 'player.playQuality': quality })
    // 显示行内切换动画，并启动超时保护（取链接流程可能长时间无响应或静默失败）
    setSwitchingQuality(quality)
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current)
    let settled = false
    // 统一的结束处理：清理定时器、复位状态并关闭弹窗
    const finishSwitch = () => {
      if (settled) return
      settled = true
      if (switchTimerRef.current) {
        clearTimeout(switchTimerRef.current)
        switchTimerRef.current = null
      }
      setSwitchingQuality(null)
      popupRef.current?.setVisible(false)
    }
    switchTimerRef.current = setTimeout(() => {
      if (settled) return
      finishSwitch()
      toast(t('quality_switch_failed_timeout'), 'long')
    }, 20000)
    // 当前歌曲立即以新音质重新获取播放地址，并反馈切换结果
    setMusicUrl(musicInfo, true, {
      quality,
      onSuccess: () => {
        finishSwitch()
        toast(t('quality_switch_success', { quality: getLabel(quality) }))
      },
      onError: (err: any) => {
        finishSwitch()
        // 切歌/停止导致的中止不提示失败
        if (/aborted/i.test(String(err?.message ?? ''))) return
        // 按失败原因给出针对性提示
        toast(t(getFailReasonKey(err)), 'long')
      },
    })
  }

  return (
    visible
      ? (
          <Popup ref={popupRef} title={t('quality_switch_title')}>
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              <View onStartShouldSetResponder={() => true}>
                {qualitys.map(q => {
                  const isActive = q === currentQuality
                  // 正在切换的行显示 loading 动画，其余行在切换期间禁用点击
                  const isSwitching = switchingQuality === q
                  const disabled = switchingQuality != null && !isSwitching
                  return (
                    <TouchableOpacity
                      key={q}
                      style={styles.item}
                      onPress={() => { handleChange(q) }}
                      activeOpacity={0.75}
                      disabled={disabled}
                    >
                      <Text style={[isActive ? styles.itemActive : styles.itemText, disabled && styles.itemDisabled]}>{getLabel(q)}</Text>
                      {isSwitching
                        ? (
                            // 切换中：右侧显示旋转 loading 指示器
                            <View style={styles.itemRight}>
                              <Loading size={14} color={theme['c-primary']} />
                            </View>
                          )
                        : isActive
                          ? (
                              <View style={styles.itemRight}>
                                <Text size={12}>{q.toUpperCase()}</Text>
                                {/* 勾选图标标识当前正在播放的音质 */}
                                <Icon name="checkbox-marked" size={13} color={theme['c-primary']} style={styles.itemIcon} />
                              </View>
                            )
                          : <Text size={12} color={'#999'}>{q.toUpperCase()}</Text>}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>
          </Popup>
        )
      : null
  )
})

const styles = createStyle({
  list: {
    maxHeight: 320,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  itemText: {
    opacity: 0.85,
  },
  itemActive: {
    fontWeight: '600',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginLeft: 6,
  },
  itemDisabled: {
    opacity: 0.4,
  },
})

export default QualitySwitchPopup
