import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import ChoicePills from '../../components/ChoicePills'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { TRY_QUALITYS_LIST } from '@/core/music/utils'

export default memo(() => {
  const quality = useSettingValue('download.quality')
  const options = useMemo(() => {
    return ([...TRY_QUALITYS_LIST, '128k'].reverse() as LX.Quality[]).map((q) => ({
      id: q,
      label: q,
    }))
  }, [])

  return (
    <SubTitle title="下载音质">
      <ChoicePills
        value={quality}
        options={options}
        onChange={(id) => { updateSetting({ 'download.quality': id }) }}
      />
    </SubTitle>
  )
})
