import { memo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import {
  SETTING_NAV_DESC,
  SETTING_NAV_GROUPS,
  SETTING_NAV_ICONS,
  type SettingScreenIds,
} from '../Main'
import { useI18n } from '@/lang'
import { BorderRadius } from '@/theme'

/**
 * 横屏目录沿用竖屏的分组卡片，只是行高更紧，方便在窄栏里扫读。
 */
const ListItem = memo(({ id, onPress }: {
  onPress: (item: SettingScreenIds) => void
  id: SettingScreenIds
}) => {
  const theme = useTheme()
  const t = useI18n()

  return (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => { onPress(id) }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t(`setting_${id}`)}
    >
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: theme['c-accent-soft'],
            borderColor: theme['c-glass-border'],
          },
        ]}
      >
        <Icon
          name={SETTING_NAV_ICONS[id]}
          size={16}
          color={theme['c-accent']}
        />
      </View>
      <View style={styles.textWrap}>
        <Text numberOfLines={1} size={15} color={theme['c-font']} style={styles.text}>
          {t(`setting_${id}`)}
        </Text>
        <Text numberOfLines={1} size={11} color={theme['c-font-label']}>
          {t(SETTING_NAV_DESC[id])}
        </Text>
      </View>
      <Icon name="chevron-right" size={15} color={theme['c-font-label']} />
    </TouchableOpacity>
  )
})

export default ({ onChangeId }: {
  onChangeId: (id: SettingScreenIds) => void
}) => {
  const theme = useTheme()
  const t = useI18n()

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
    >
      {SETTING_NAV_GROUPS.map(group => (
        <View key={group.titleKey} style={styles.group}>
          <Text size={12} color={theme['c-font-label']} style={styles.groupTitle}>
            {t(group.titleKey)}
          </Text>
          <View style={[styles.card, {
            backgroundColor: theme['c-glass-background'],
            borderColor: theme['c-glass-border'],
          }]}>
            {group.items.map(id => (
              <ListItem key={id} id={id} onPress={onChangeId} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    flexShrink: 1,
    flexGrow: 1,
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  group: {
    marginBottom: 12,
  },
  groupTitle: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    fontWeight: '600',
  },
  card: {
    borderRadius: BorderRadius.large,
    borderWidth: 0.5,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.medium,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 0.5,
  },
  textWrap: {
    flex: 1,
    paddingRight: 8,
  },
  text: {
    fontWeight: '600',
    marginBottom: 1,
  },
})
