import { memo } from 'react'

import Theme from './Theme'
import IsFontShadow from './IsFontShadow'

export default memo(() => {
  return (
    <>
      <Theme />
      <IsFontShadow />
    </>
  )
})
