import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { openUrl, createStyle } from '@/utils/tools'
import { USER_API_SOURCE_LIMIT } from '@/core/apiSource'
import ImportBtn from './ImportBtn'
import SourceList from './SourceList'

/**
 * 音源管理页的内容区：导入动作、启用计数和音源列表保持同一条视觉路径。
 * 业务操作仍由 ImportBtn/SourceList 负责，便于设置页入口与独立页面共用。
 */
export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const activeSourceList = useSettingValue('common.apiSourceList')

  const openFAQPage = () => {
    void openUrl('https://lyswhut.github.io/lx-music-doc/mobile/custom-source')
  }

  return (
    <View style={styles.container}>
      <ImportBtn />

      <View style={styles.sectionHeader}>
        <Text size={16} style={styles.sectionTitle}>{t('setting_source_list')}</Text>
        <Text size={13} color={theme['c-font-label']}>
          {t('setting_source_enabled_count', { enabled: activeSourceList.length, total: USER_API_SOURCE_LIMIT })}
        </Text>
      </View>

      <SourceList />

      <View style={styles.notes}>
        <View style={styles.readmeRow}>
          <Text size={12} color={theme['c-font-label']}>{t('user_api_readme')}</Text>
          <TouchableOpacity onPress={openFAQPage} activeOpacity={0.6}>
            <Text size={12} color={theme['c-primary']} style={styles.link}>FAQ</Text>
          </TouchableOpacity>
        </View>
        <Text size={12} color={theme['c-font-label']} style={styles.note}>
          {t('user_api_note')}
        </Text>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  notes: {
    marginTop: 18,
    gap: 8,
  },
  readmeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  note: {
    lineHeight: 18,
  },
})
