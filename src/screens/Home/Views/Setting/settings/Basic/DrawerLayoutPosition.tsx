import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import ChoicePills from '../../components/ChoicePills'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

const LIST = [
  {
    position: 'left',
    name: 'setting_basic_drawer_layout_position_left',
  },
  {
    position: 'right',
    name: 'setting_basic_drawer_layout_position_right',
  },
] as const

export default memo(() => {
  const t = useI18n()
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')
  const options = useMemo(() => {
    return LIST.map((item) => ({ id: item.position, label: t(item.name) }))
  }, [t])

  return (
    <SubTitle title={t('setting_basic_drawer_layout_position')}>
      <ChoicePills
        value={drawerLayoutPosition}
        options={options}
        onChange={(id) => { updateSetting({ 'common.drawerLayoutPosition': id }) }}
      />
    </SubTitle>
  )
})
