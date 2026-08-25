import { memo } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useBgPic } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Section from '../components/Section'
import SettingIcon from '../components/SettingIcon'
import { settingLayout } from '../components/style'
import {
  SETTING_NAV_GROUPS,
  SETTING_NAV_ICONS,
  type SettingScreenIds,
} from '../Main'

const NavRow = memo(({
  id,
  showDivider,
  onPress,
}: {
  id: SettingScreenIds
  showDivider: boolean
  onPress: (id: SettingScreenIds) => void
}) => {
  const theme = useTheme()
  const t = useI18n()

  return (
    <View>
      <TouchableOpacity
        onPress={() => { onPress(id) }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t(`setting_${id}`)}
        style={settingLayout.row}
      >
        <SettingIcon name={SETTING_NAV_ICONS[id]} />
        <View style={settingLayout.rowBody}>
          <Text size={16} style={settingLayout.rowTitle} numberOfLines={1}>
            {t(`setting_${id}`)}
          </Text>
          {id == 'source'
            ? (
                <Text size={12} color={theme['c-font-label']} style={settingLayout.rowSubtitle} numberOfLines={1}>
                  {t('setting_source_desc')}
                </Text>
              )
            : null}
        </View>
        <View style={[styles.chevron, { backgroundColor: theme['c-primary-background'] }]}>
          <Icon name="chevron-right" size={16} color={theme['c-primary']} />
        </View>
      </TouchableOpacity>
      {showDivider
        ? (
            <View
              style={[
                styles.divider,
                { backgroundColor: theme['c-border-background'] },
              ]}
            />
          )
        : null}
    </View>
  )
})

export default ({ onChangeId }: {
  onChangeId: (id: SettingScreenIds) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const hasDynamicBg = useBgPic() != null

  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      style={{
        flex: 1,
        backgroundColor: hasDynamicBg ? 'transparent' : theme['c-card-background'],
      }}
      contentContainerStyle={styles.content}
    >
      {SETTING_NAV_GROUPS.map((group) => (
        <View key={group.titleKey}>
          <Text
            size={13}
            color={theme['c-font-label']}
            style={styles.groupTitle}
          >
            {t(group.titleKey)}
          </Text>
          <Section style={styles.groupCard}>
            {group.items.map((id, index) => (
              <NavRow
                key={id}
                id={id}
                showDivider={index < group.items.length - 1}
                onPress={onChangeId}
              />
            ))}
          </Section>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = createStyle({
  content: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 88,
  },
  groupTitle: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  groupCard: {
    marginBottom: 10,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
})
