import { memo } from 'react'
import { toast } from '@/utils/tools'
import { MUSIC_TOGGLE_MODE_LIST, MUSIC_TOGGLE_MODE } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import Btn from './Btn'

const MODES = {
  [MUSIC_TOGGLE_MODE.listLoop]: { icon: 'list-loop', label: 'play_list_loop' },
  [MUSIC_TOGGLE_MODE.random]: { icon: 'list-random', label: 'play_list_random' },
  [MUSIC_TOGGLE_MODE.list]: { icon: 'list-order', label: 'play_list_order' },
  [MUSIC_TOGGLE_MODE.singleLoop]: { icon: 'single-loop', label: 'play_single_loop' },
  [MUSIC_TOGGLE_MODE.none]: { icon: 'single', label: 'play_single' },
} as const

export default memo(() => {
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const t = useI18n()

  const toggleNextPlayMode = () => {
    let index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    if (++index >= MUSIC_TOGGLE_MODE_LIST.length) index = 0
    const mode = MUSIC_TOGGLE_MODE_LIST[index]
    updateSetting({ 'player.togglePlayMethod': mode })
    toast(t(MODES[mode].label))
  }

  const mode = MODES[togglePlayMethod]
  return <Btn icon={mode.icon} label={t(mode.label)} onPress={toggleNextPlayMode} />
})
