import { memo } from 'react'

import Section from '../../components/Section'
import IsShowLyric from './IsShowLyric'
import IsLockLyric from './IsLockLyric'
import IsShowToggleAnima from './IsShowToggleAnima'
import IsSingleLine from './IsSingleLine'
import TextSize from './TextSize'
import ViewWidth from './ViewWidth'
import MaxLineNum from './MaxLineNum'
import TextOpacity from './TextOpacity'
import TextPositionX from './TextPositionX'
import TextPositionY from './TextPositionY'
import { useI18n } from '@/lang'
import Theme from './Theme'

export default memo(() => {
  const t = useI18n()

  return (
    <>
      <Section title={t('setting_section_lyric_show')}>
        <IsShowLyric />
        <IsLockLyric />
        <IsShowToggleAnima />
        <IsSingleLine />
      </Section>
      <Section title={t('setting_section_lyric_look')}>
        <Theme />
        <TextSize />
        <TextOpacity />
        <MaxLineNum />
      </Section>
      <Section title={t('setting_section_lyric_layout')}>
        <ViewWidth />
        <TextPositionX />
        <TextPositionY />
      </Section>
    </>
  )
})
