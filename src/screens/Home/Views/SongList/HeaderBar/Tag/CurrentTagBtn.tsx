import { forwardRef, useImperativeHandle, useState } from 'react'
import { Platform, TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export interface CurrentTagBtnProps {
  onShowList: () => void
}

export interface CurrentTagBtnType {
  setCurrentTagInfo: (name: string) => void
}

/**
 * 右下角扩展悬浮按钮。展示当前分类名，点击后打开侧栏分类列表。
 */
export default forwardRef<CurrentTagBtnType, CurrentTagBtnProps>(({ onShowList }, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const [name, setName] = useState(t('songlist_tag_default'))

  useImperativeHandle(ref, () => ({
    setCurrentTagInfo(nextName) {
      setName(nextName || t('songlist_tag_default'))
    },
  }))

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onShowList}
      style={{
        ...styles.btn,
        backgroundColor: theme['c-primary'],
        borderColor: theme['c-primary-alpha-700'],
      }}
    >
      <Icon name="slider" size={15} color="#fff" />
      <Text style={styles.label} size={13} color="#fff" numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  )
})

const styles = createStyle({
  btn: {
    maxWidth: 168,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  label: {
    fontWeight: '700',
    flexShrink: 1,
  },
})
