import { memo } from 'react'

import Theme from '../Theme'
import Section from '../../components/Section'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import ShareType from './ShareType'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsStartupPushPlayDetailScreen from './IsStartupPushPlayDetailScreen'
import IsAutoHidePlayBar from './IsAutoHidePlayBar'
import IsHomePageScroll from './IsHomePageScroll'
import IsAllowProgressBarSeek from './IsAllowProgressBarSeek'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import IsAlwaysKeepStatusbarHeight from './IsAlwaysKeepStatusbarHeight'
import IsShowBackBtn from './IsShowBackBtn'
import IsShowExitBtn from './IsShowExitBtn'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import { useI18n } from '@/lang/i18n'

/**
 * 基本设置按「启动 / 外观 / 操作 / 显示」拆开。
 * 页面标题已在导航里，卡片只保留分组名，避免重复。
 */
export default memo(() => {
  const t = useI18n()

  return (
    <>
      <Section title={t('setting_section_startup')}>
        <IsStartupAutoPlay />
        <IsStartupPushPlayDetailScreen />
      </Section>
      <Section title={t('setting_section_appearance')}>
        <Theme />
        <Language />
        <FontSize />
      </Section>
      <Section title={t('setting_section_interaction')}>
        <DrawerLayoutPosition />
        <IsHomePageScroll />
        <IsAllowProgressBarSeek />
        <IsAutoHidePlayBar />
        <IsUseSystemFileSelector />
        <ShareType />
      </Section>
      <Section title={t('setting_section_display')}>
        <IsAlwaysKeepStatusbarHeight />
        <IsShowBackBtn />
        <IsShowExitBtn />
        <SourceName />
      </Section>
    </>
  )
})
