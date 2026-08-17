import { forwardRef, useImperativeHandle, useState } from 'react'
import { TouchableOpacity } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

export interface ActiveListNameProps {
  onShowBound: () => void
}
export interface ActiveListNameType {
  setBound: (id: string, name: string) => void
}

/**
 * 当前榜单选择器 — Chip 风格按钮
 * 以圆角胶囊按钮展示当前榜单名称，左侧带排行榜图标，
 * 右侧 chevron 提示可展开完整榜单列表。
 */
export default forwardRef<ActiveListNameType, ActiveListNameProps>(({ onShowBound }, ref) => {
  const theme = useTheme()
  const [currentListName, setCurrentListName] = useState('')

  useImperativeHandle(ref, () => ({
    setBound(id, name) {
      setCurrentListName(name)
    },
  }), [])

  return (
    <TouchableOpacity
      onPress={onShowBound}
      activeOpacity={0.72}
      style={{
        ...styles.chip,
        backgroundColor: theme['c-card-background'],
        borderColor: theme['c-border-background'],
      }}
    >
      <Icon name="leaderboard" size={14} color={theme['c-primary-font']} style={styles.chipIcon} />
      <Text numberOfLines={1} style={styles.chipText} size={13} color={theme['c-font']}>
        {currentListName}
      </Text>
      <Icon name="chevron-right" size={12} color={theme['c-font-label']} />
    </TouchableOpacity>
  )
})


const styles = createStyle({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 16,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    marginLeft: 12,
    marginRight: 12,
    maxWidth: '70%',
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    flexShrink: 1,
    fontWeight: '600',
    marginRight: 4,
  },
})
