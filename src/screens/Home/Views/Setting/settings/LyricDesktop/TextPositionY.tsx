import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import ChoicePills from '../../components/ChoicePills'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { setDesktopLyricTextPosition } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

type Y_TYPE = LX.AppSetting['desktopLyric.textPosition.y']

const Y_LIST = [
  'top',
  'center',
  'bottom',
] as const

export default memo(() => {
  const t = useI18n()
  const y = useSettingValue('desktopLyric.textPosition.y')
  const options = useMemo(() => {
    return Y_LIST.map(id => ({ id, label: t(`setting_lyric_desktop_text_y_${id}`) }))
  }, [t])

  const setPosition = (id: Y_TYPE) => {
    void setDesktopLyricTextPosition(null, id).then(() => {
      updateSetting({ 'desktopLyric.textPosition.y': id })
    })
  }

  return (
    <SubTitle title={t('setting_lyric_desktop_text_y')}>
      <ChoicePills value={y} options={options} onChange={setPosition} />
    </SubTitle>
  )
})
