import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import ChoicePills from '../../components/ChoicePills'
import type { I18n } from '@/lang'
import { useI18n, langList } from '@/lang'
import { setLanguage } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

export default memo(() => {
  const t = useI18n()
  const activeLangId = useSettingValue('common.langId')
  const options = useMemo(() => {
    return langList.map(({ locale, name }) => ({ id: locale as string, label: name }))
  }, [])

  return (
    <SubTitle title={t('setting_basic_lang')}>
      <ChoicePills
        value={activeLangId ?? ''}
        options={options}
        onChange={(id) => { setLanguage(id as I18n['locale']) }}
      />
    </SubTitle>
  )
})
