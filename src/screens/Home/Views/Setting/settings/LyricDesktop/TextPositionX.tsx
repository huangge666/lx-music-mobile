import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import ChoicePills from '../../components/ChoicePills'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { setDesktopLyricTextPosition } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

type X_TYPE = LX.AppSetting['desktopLyric.textPosition.x']

const X_LIST = [
  'left',
  'center',
  'right',
] as const

export default memo(() => {
  const t = useI18n()
  const x = useSettingValue('desktopLyric.textPosition.x')
  const options = useMemo(() => {
    return X_LIST.map(id => ({ id, name: t(`setting_lyric_desktop_text_x_${id}`) }))
      .map(({ id, name }) => ({ id, label: name }))
  }, [t])

  const setPosition = (id: X_TYPE) => {
    void setDesktopLyricTextPosition(id, null).then(() => {
      updateSetting({ 'desktopLyric.textPosition.x': id })
    })
  }

  return (
    <SubTitle title={t('setting_lyric_desktop_text_x')}>
      <ChoicePills value={x} options={options} onChange={setPosition} />
    </SubTitle>
  )
})
