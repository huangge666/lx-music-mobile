import { memo, useRef, useState } from 'react'
import { TouchableOpacity, FlatList, View, type FlatListProps } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { scaleSizeH } from '@/utils/pixelRatio'
import { SETTING_SCREENS, SETTING_NAV_ICONS, type SettingScreenIds } from '../Main'
import { useI18n } from '@/lang'
import { BorderRadius } from '@/theme'

type FlatListType = FlatListProps<SettingScreenIds>

const ITEM_HEIGHT = scaleSizeH(46)

const ListItem = memo(({ id, activeId, onPress }: {
  onPress: (item: SettingScreenIds) => void
  activeId: string
  id: SettingScreenIds
}) => {
  const theme = useTheme()
  const t = useI18n()

  const active = activeId == id
  const iconName = SETTING_NAV_ICONS[id]

  const handlePress = () => {
    onPress(id)
  }

  return (
    <TouchableOpacity
      style={[
        styles.listItem,
        {
          height: ITEM_HEIGHT,
          backgroundColor: active ? theme['c-primary-background'] : 'transparent',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* 激活指示小条 */}
      <View
        style={[
          styles.activeIndicator,
          {
            backgroundColor: active ? theme['c-primary'] : 'transparent',
          },
        ]}
      />
      {/* 图标微徽章 */}
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: active
              ? (theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)')
              : (theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'),
          },
        ]}
      >
        <Icon
          name={iconName}
          size={16}
          color={active ? theme['c-primary'] : theme['c-font-label']}
        />
      </View>
      <Text
        numberOfLines={1}
        size={14}
        color={active ? theme['c-primary'] : theme['c-font']}
        style={active ? styles.textActive : styles.text}
      >
        {t(`setting_${id}`)}
      </Text>
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
  const flatListRef = useRef<FlatList>(null)
  const [activeId, setActiveId] = useState(global.lx.settingActiveId)

  const handleChangeId = (id: SettingScreenIds) => {
    onChangeId(id)
    setActiveId(id)
    global.lx.settingActiveId = id
  }

  const renderItem: FlatListType['renderItem'] = ({ item }) => (
    <ListItem
      key={item}
      id={item}
      activeId={activeId}
      onPress={handleChangeId}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }

  return (
    <FlatList
      ref={flatListRef}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={SETTING_SCREENS}
      maxToRenderPerBatch={9}
      windowSize={9}
      removeClippedSubviews={true}
      initialNumToRender={18}
      renderItem={renderItem}
      keyExtractor={getkey}
      getItemLayout={getItemLayout}
    />
  )
}


const styles = createStyle({
  container: {
    flexShrink: 1,
    flexGrow: 1,
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: 12,
    paddingLeft: 8,
    borderRadius: BorderRadius.medium,
    position: 'relative',
    overflow: 'hidden',
  },
  activeIndicator: {
    width: 3,
    height: 18,
    borderRadius: 1.5,
    marginRight: 6,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.normal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  text: {
    fontWeight: '500',
    flex: 1,
  },
  textActive: {
    fontWeight: '600',
    flex: 1,
  },
})


