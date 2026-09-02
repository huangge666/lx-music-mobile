import { useRef } from 'react'

import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Modal, { type ModalType } from './Modal'

/**
 * “我的”页头部的导入歌单入口
 * — 交互复制自歌单页的“打开歌单”，确认后不进入歌单详情，
 *   而是自动识别链接平台并直接把歌单导入为“我的列表”
 * — 样式与头部 SearchTypeSelector 的选中胶囊保持一致（主色底 + 图标 + 文字）
 */
export default () => {
  const t = useI18n()
  const theme = useTheme()
  const modalRef = useRef<ModalType>(null)

  return (
    <>
      <Button
        style={{ ...styles.button, backgroundColor: theme['c-primary-background'], borderColor: theme['c-primary-alpha-700'] }}
        onPress={() => modalRef.current?.show()}
      >
        <Icon name="album" size={15} color={theme['c-primary-font']} />
        <Text size={13} style={styles.buttonText} color={theme['c-primary-font']}>{t('list_import_songlist')}</Text>
      </Button>
      <Modal ref={modalRef} />
    </>
  )
}

const styles = createStyle({
  button: {
    height: 30,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  buttonText: {
    fontWeight: '600',
  },
})
