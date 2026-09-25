import { useI18n } from '@/lang'
import { memo } from 'react'

import Section from '../../components/Section'
import Part from './Part'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_section_backup_list')}>
      <Part />
    </Section>
  )
})
