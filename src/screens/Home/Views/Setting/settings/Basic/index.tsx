import { memo } from 'react'

import Theme from '../Theme'
import Section from '../../components/Section'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsHomePageScroll from './IsHomePageScroll'
import IsAllowProgressBarSeek from './IsAllowProgressBarSeek'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import ResourceCache from './ResourceCache'
import { useI18n } from '@/lang/i18n'

/**
 * 基本设置只保留启动、外观与核心操作；不再暴露已移除模块的开关。
 */
export default memo(() => {
  const t = useI18n()

  return (
    <>
      <Section title={t('setting_section_startup')}>
        <IsStartupAutoPlay />
      </Section>
      <Section title={t('setting_section_appearance')}>
        <Theme />
        <Language />
        <FontSize />
      </Section>
      <Section title={t('setting_section_interaction')}>
        <IsHomePageScroll />
        <IsAllowProgressBarSeek />
        <IsUseSystemFileSelector />
        <SourceName />
      </Section>
      <Section title={t('setting_section_cache')}>
        <ResourceCache />
      </Section>
    </>
  )
})
