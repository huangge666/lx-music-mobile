import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import ChoicePills from '../../components/ChoicePills'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type SourceNameType = LX.AppSetting['common.sourceNameType']

export default memo(() => {
  const t = useI18n()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const options = useMemo(() => {
    return [
      { id: 'real' as const, label: t('setting_basic_sourcename_real') },
      { id: 'alias' as const, label: t('setting_basic_sourcename_alias') },
    ]
  }, [t])

  return (
    <SubTitle title={t('setting_basic_sourcename')}>
      <ChoicePills
        value={sourceNameType}
        options={options}
        onChange={(id) => { updateSetting({ 'common.sourceNameType': id as SourceNameType }) }}
      />
    </SubTitle>
  )
})
