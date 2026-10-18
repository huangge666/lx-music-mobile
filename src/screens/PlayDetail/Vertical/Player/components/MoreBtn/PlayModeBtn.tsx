import { memo, useMemo } from 'react'
import { toast } from '@/utils/tools'
import { MUSIC_TOGGLE_MODE_LIST, MUSIC_TOGGLE_MODE } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import Btn from './Btn'
import { Immersive } from '../../../../macOS'


type ModeName = 'play_list_loop' | 'play_list_random' | 'play_list_order' | 'play_single_loop' | 'play_single'

/** 播放模式 → 图标 + 文案，图标与读屏文字共用同一份映射，避免两者对不上 */
const MODE_INFO: Record<string, { icon: string, label: ModeName }> = {
  [MUSIC_TOGGLE_MODE.listLoop]: { icon: 'list-loop', label: 'play_list_loop' },
  [MUSIC_TOGGLE_MODE.random]: { icon: 'list-random', label: 'play_list_random' },
  [MUSIC_TOGGLE_MODE.list]: { icon: 'list-order', label: 'play_list_order' },
  [MUSIC_TOGGLE_MODE.singleLoop]: { icon: 'single-loop', label: 'play_single_loop' },
  [MUSIC_TOGGLE_MODE.none]: { icon: 'single', label: 'play_single' },
}

export default memo(() => {
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const t = useI18n()

  const currentMode = useMemo(() => MODE_INFO[togglePlayMethod] ?? MODE_INFO[MUSIC_TOGGLE_MODE.listLoop], [togglePlayMethod])

  const toggleNextPlayMode = () => {
    let index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    if (++index >= MUSIC_TOGGLE_MODE_LIST.length) index = 0
    const mode = MUSIC_TOGGLE_MODE_LIST[index]
    updateSetting({ 'player.togglePlayMethod': mode })
    toast(t((MODE_INFO[mode] ?? currentMode).label))
  }

  return <Btn icon={currentMode.icon} color={Immersive.text} label={t(currentMode.label)} onPress={toggleNextPlayMode} />
})
