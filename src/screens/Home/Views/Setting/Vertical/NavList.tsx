import { memo, useCallback, useState } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import { useI18n } from '@/lang'
import { BorderRadius } from '@/theme'


/**
 * Apple Music 风格设置页分段导航
 *
 * 视觉特征：
 * — 水平滚动标签
 * — 选中态：主色文字 + 底部短下划线
 * — 默认态：次要色文字
 * — 无边框、无背景色（极简）
 */
const ListItem = memo(({ id, activeId, onPress }: {
  onPress: (item: SettingScreenIds) => void
  activeId: string
  id: SettingScreenIds
}) => {
  const theme = useTheme()
  const t = useI18n()

  const active = activeId == id

  const handlePress = () => {
    onPress(id)
  }

  return (
    <TouchableOpacity style={styles.listItem} onPress={handlePress} activeOpacity={0.6}>
      <Text
        numberOfLines={1}
        size={15}
        color={active ? theme['c-primary'] : theme['c-font-label']}
        style={active ? styles.textActive : styles.text}
      >
        {t(`setting_${id}`)}
      </Text>
      {/* Apple Music 风格选中指示器 — 短下划线 */}
      {active ? <View style={{ ...styles.indicator, backgroundColor: theme['c-primary'] }} /> : null}
    </TouchableOpacity>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.id === nextProps.id &&
    prevProps.activeId != nextProps.id &&
    nextProps.activeId != nextProps.id
  )
})


export default ({ onChangeId }: {
  onChangeId: (id: SettingScreenIds) => void
}) => {
  const [activeId, setActiveId] = useState(global.lx.settingActiveId)
  const theme = useTheme()

  const handleChangeId = useCallback((id: SettingScreenIds) => {
    onChangeId(id)
    setActiveId(id)
    global.lx.settingActiveId = id
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ScrollView
      horizontal
      style={{ ...styles.container, borderBottomColor: theme['c-border-background'] }}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps={'always'}
      showsHorizontalScrollIndicator={false}
    >
      {
        SETTING_SCREENS.map(id => <ListItem key={id} id={id} activeId={activeId} onPress={handleChangeId} />)
      }
    </ScrollView>
  )
}


const styles = createStyle({
  container: {
    height: 44,
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  listItem: {
    height: 44,
    paddingLeft: 14,
    paddingRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '400',
  },
  textActive: {
    fontWeight: '600',
  },
  // Apple Music 风格选中下划线 — 主色、短宽、圆角
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    borderRadius: BorderRadius.small,
    backgroundColor: undefined, // 动态设置在组件内
  },
})
