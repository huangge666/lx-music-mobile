import { useRef } from 'react'
import { TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Modal, { type ModalType } from './Modal'

/**
 * 资料库页头的导入歌单入口。
 *
 * Phase 7 起与 iOS 页头一致：圆形图标按钮（list-plus），
 * 名称由无障碍标签提供，不再用「图标 + 文字」的灰色胶囊。
 * 交互不变：识别链接平台后直接把歌单导入为「我的列表」。
 */
export default () => {
  const t = useI18n()
  const theme = useTheme()
  const modalRef = useRef<ModalType>(null)

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme['c-primary-input-background'] }]}
        onPress={() => modalRef.current?.show()}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={t('list_import_songlist')}
      >
        <Icon name="add-music" size={18} color={theme['c-font']} />
      </TouchableOpacity>
      <Modal ref={modalRef} />
    </>
  )
}

const styles = createStyle({
  button: {
    width: 32,
    height: 32,
    marginLeft: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
