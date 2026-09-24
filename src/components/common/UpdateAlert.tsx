import { useEffect, useRef } from 'react'
import { View } from 'react-native'

import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export interface UpdateAlertProps {
  visible: boolean
  title: string
  log: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onHide: () => void
}

/**
 * 自定义源更新提示。
 * 更新日志按行拆开，避免系统弹窗把版本和说明挤成一段。
 */
export default ({
  visible,
  title,
  log,
  confirmText,
  cancelText,
  onConfirm,
  onHide,
}: UpdateAlertProps) => {
  const theme = useTheme()
  const alertRef = useRef<ConfirmAlertType>(null)
  const lines = log.split(/\r?\n/).map(line => line.trim()).filter(Boolean)

  useEffect(() => {
    if (visible) alertRef.current?.setVisible(true)
  }, [visible])

  if (!visible) return null

  return (
    <ConfirmAlert
      ref={alertRef}
      title={title}
      confirmText={confirmText}
      cancelText={cancelText}
      showConfirm={Boolean(confirmText)}
      onConfirm={onConfirm}
      onHide={onHide}
      closeBtn={false}
    >
      <View style={styles.content}>
        {lines.map((line, index) => (
          <Text key={`${index}-${line}`} size={14} color={theme['c-font']} style={styles.line}>
            {line}
          </Text>
        ))}
      </View>
    </ConfirmAlert>
  )
}

const styles = createStyle({
  content: {
    gap: 8,
  },
  line: {
    lineHeight: 22,
  },
})
