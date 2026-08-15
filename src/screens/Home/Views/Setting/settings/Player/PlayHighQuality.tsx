import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import ChoicePills from '../../components/ChoicePills'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { TRY_QUALITYS_LIST } from '@/core/music/utils'

export default memo(() => {
  const t = useI18n()
  const playQuality = useSettingValue('player.playQuality')
  const options = useMemo(() => {
    return ([...TRY_QUALITYS_LIST, '128k'].reverse() as LX.Quality[]).map((q) => ({
      id: q,
      label: q,
    }))
  }, [])

  return (
    <SubTitle title={t('setting_play_play_quality')}>
      <ChoicePills
        value={playQuality}
        options={options}
        onChange={(id) => { updateSetting({ 'player.playQuality': id }) }}
      />
    </SubTitle>
  )
})
