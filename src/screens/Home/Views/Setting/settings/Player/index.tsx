import { memo } from 'react'

import Section from '../../components/Section'
import IsSavePlayTime from './IsSavePlayTime'
import PlayHighQuality from './PlayHighQuality'
import IsHandleAudioFocus from './IsHandleAudioFocus'
import IsEnableAudioOffload from './IsEnableAudioOffload'
import IsAutoCleanPlayedList from './IsAutoCleanPlayedList'
import IsShowBluetoothLyric from './IsShowBluetoothLyric'
import IsShowBluetoothFullLyric from './IsShowBluetoothFullLyric'
import IsShowNotificationImage from './IsShowNotificationImage'
import IsShowLyricTranslation from './IsShowLyricTranslation'
import IsShowLyricRoma from './IsShowLyricRoma'
import IsS2T from './IsS2T'
import MaxCache from './MaxCache'
import { useI18n } from '@/lang'
import Download from '../Download'


/**
 * 播放页拆成听感、歌词、设备与下载，避免一长串开关挤在同一张卡里。
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
        <IsShowBluetoothLyric />
        <IsShowBluetoothFullLyric />
        <IsShowNotificationImage />
      </Section>
      <Section title={t('setting_section_download')}>
        <Download />
      </Section>
    </>
  )
})
