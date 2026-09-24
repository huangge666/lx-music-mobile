import { memo, useCallback } from 'react'
import { View } from 'react-native'

import { applyTheme } from '@/core/theme'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { getTheme } from '@/theme/themes'
import { createStyle } from '@/utils/tools'

import SubTitle from '../../components/SubTitle'
import ChoicePills from '../../components/ChoicePills'

type Appearance = 'light' | 'dark' | 'system'

/**
 * 外观只有三档：浅色白玻璃、深色黑玻璃、跟随系统。
 * 先写入设置，再读取实际主题，保证跟随系统能拿到最新的深浅状态。
 */
export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const themeId = useSettingValue('theme.id')
  const isAutoTheme = useSettingValue('common.isAutoTheme')
  const appearance: Appearance = isAutoTheme ? 'system' : (themeId == 'black' ? 'dark' : 'light')

  const setAppearance = useCallback((next: Appearance) => {
    if (next == 'system') {
      updateSetting({ 'common.isAutoTheme': true })
    } else {
      updateSetting({
        'common.isAutoTheme': false,
        'theme.id': next == 'dark' ? 'black' : 'green',
      })
    }
    void getTheme().then(applyTheme)
  }, [])

  return (
    <SubTitle title={t('setting_basic_theme')}>
      <View style={styles.preview}>
        <View style={[styles.orb, { backgroundColor: theme['c-glass-highlight'] }]} />
        <View style={[styles.orbSoft, { backgroundColor: theme['c-accent-soft'] }]} />
      </View>
      <ChoicePills
        value={appearance}
        options={[
          { id: 'light', label: t('theme_green') },
          { id: 'dark', label: t('theme_black') },
          { id: 'system', label: t('setting_basic_theme_auto_theme') },
        ]}
        onChange={setAppearance}
      />
    </SubTitle>
  )
})

const styles = createStyle({
  preview: {
    height: 8,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  orb: {
    flex: 1,
  },
  orbSoft: {
    width: 72,
  },
})
