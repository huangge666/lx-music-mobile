import { memo } from 'react'

import Section from '../../components/Section'
import IsSavePlayTime from './IsSavePlayTime'
import PlayHighQuality from './PlayHighQuality'
import IsHandleAudioFocus from './IsHandleAudioFocus'
import IsEnableAudioOffload from './IsEnableAudioOffload'
import IsAutoCleanPlayedList from './IsAutoCleanPlayedList'
import IsShowNotificationImage from './IsShowNotificationImage'
import IsShowLyricTranslation from './IsShowLyricTranslation'
import IsShowLyricRoma from './IsShowLyricRoma'
import IsS2T from './IsS2T'
import MaxCache from './MaxCache'
import { useI18n } from '@/lang'


/**
 * 播放设置只管理听感、页内歌词与后台媒体控制；下载有自己的设置页。
 */
export default memo(() => {
  const t = useI18n()

  return (
    <>
      <Section title={t('setting_section_listen')}>
        <IsSavePlayTime />
        <IsAutoCleanPlayedList />
        <PlayHighQuality />
        <MaxCache />
      </Section>
      <Section title={t('setting_section_lyric')}>
        <IsShowLyricTranslation />
        <IsShowLyricRoma />
        <IsS2T />
      </Section>
      <Section title={t('setting_section_device')}>
        <IsHandleAudioFocus />
        <IsEnableAudioOffload />
        <IsShowNotificationImage />
      </Section>
    </>
  )
})
