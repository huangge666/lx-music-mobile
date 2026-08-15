import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import Section from '../../components/Section'
import SettingIcon from '../../components/SettingIcon'
import { settingLayout } from '../../components/style'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import { navigations } from '@/navigation'
import { createStyle } from '@/utils/tools'

/**
 * 设置页中的音源管理入口。
 * 具体的导入、启用与删除操作放到独立页面，避免在设置长列表中展开复杂内容。
 */
export default memo(() => {
  const t = useI18n()
  const theme = useTheme()

  const openSourceManager = () => {
    const componentId = commonState.componentIds.home
    if (!componentId) return
    navigations.pushSourceManagerScreen(componentId)
  }

  return (
    <Section title={t('setting_source_group')}>
      <TouchableOpacity
        onPress={openSourceManager}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('setting_source')}
        style={settingLayout.row}
      >
        <SettingIcon name="setting" />
        <View style={settingLayout.rowBody}>
          <Text size={16} style={settingLayout.rowTitle}>{t('setting_source')}</Text>
          <Text size={12} color={theme['c-font-label']} style={settingLayout.rowSubtitle}>
            {t('setting_source_desc')}
          </Text>
        </View>
        <View style={[styles.chevron, { backgroundColor: theme['c-primary-background'] }]}>
          <Icon name="chevron-right" size={16} color={theme['c-primary']} />
        </View>
      </TouchableOpacity>
    </Section>
  )
})

const styles = createStyle({
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
})
