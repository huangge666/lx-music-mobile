import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import ChoicePills from '../../components/ChoicePills'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const addMusicLocationType = useSettingValue('list.addMusicLocationType')
  const options = useMemo(() => {
    return [
      { id: 'top' as const, label: t('setting_list_add_music_location_type_top') },
      { id: 'bottom' as const, label: t('setting_list_add_music_location_type_bottom') },
    ]
  }, [t])

  return (
    <SubTitle title={t('setting_list_add_music_location_type')}>
      <ChoicePills
        value={addMusicLocationType}
        options={options}
        onChange={(id) => { updateSetting({ 'list.addMusicLocationType': id }) }}
      />
    </SubTitle>
  )
})
