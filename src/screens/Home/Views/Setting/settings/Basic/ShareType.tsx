import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import ChoicePills from '../../components/ChoicePills'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type ShareType = LX.AppSetting['common.shareType']

export default memo(() => {
  const t = useI18n()
  const shareType = useSettingValue('common.shareType')
  const options = useMemo(() => {
    return [
      { id: 'system' as const, label: t('setting_basic_share_type_system') },
      { id: 'clipboard' as const, label: t('setting_basic_share_type_clipboard') },
    ]
  }, [t])

  return (
    <SubTitle title={t('setting_basic_share_type')}>
      <ChoicePills
        value={shareType}
        options={options}
        onChange={(id) => { updateSetting({ 'common.shareType': id as ShareType }) }}
      />
    </SubTitle>
  )
})
