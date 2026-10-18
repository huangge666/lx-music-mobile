import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View, ScrollView } from 'react-native'
import Dialog, { type DialogType } from './Dialog'
import Button from './Button'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang/index'
import { useTheme } from '@/store/theme/hook'
import { getOnAccentColor } from '@/theme/themes/palette'
import Text from './Text'
import { BorderRadius } from '@/theme'

const styles = createStyle({
  main: {
    flexShrink: 1,
    marginTop: 8,
    marginHorizontal: 6,
    marginBottom: 16,
  },
  content: {
    flexGrow: 0,
    paddingHorizontal: 14,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  btnsDirection: {},
  btnsReversedDirection: {
    flexDirection: 'row-reverse',
  },
  btn: {
    flex: 1,
    minHeight: 46,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.round,
  },
  btnText: {
    fontWeight: '600',
  },
})

export interface ConfirmAlertProps {
  onCancel?: () => void
  onHide?: () => void
  onConfirm?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  title?: string
  text?: string
  cancelText?: string
  confirmText?: string
  showConfirm?: boolean
  disabledConfirm?: boolean
  /** 危险动作（删除/清空）：确认键改用危险色柔光底 + 危险色文字 */
  confirmDanger?: boolean
  reverseBtn?: boolean
  children?: React.ReactNode | React.ReactNode[]
}

export interface ConfirmAlertType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<ConfirmAlertType, ConfirmAlertProps>(({
  onHide,
  onCancel,
  onConfirm = () => {},
  keyHide,
  bgHide,
  closeBtn,
  title = '',
  text = '',
  cancelText = '',
  confirmText = '',
  showConfirm = true,
  disabledConfirm = false,
  confirmDanger = false,
  children,
  reverseBtn = false,
}: ConfirmAlertProps, ref) => {
  const theme = useTheme()
  const t = useI18n()

  const dialogRef = useRef<DialogType>(null)

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      dialogRef.current?.setVisible(visible)
    },
  }))

  const handleCancel = () => {
    onCancel?.()
    dialogRef.current?.setVisible(false)
  }

  // 取消键用中性填充底：这是弹层里的控件，不用玻璃色也不算危险动作
  const cancelBg = theme['c-primary-input-background']
  const confirmColor = getOnAccentColor(theme.isDark)

  const confirmStyle = confirmDanger
    ? { ...styles.btn, backgroundColor: theme['c-danger-soft'] }
    : { ...styles.btn, backgroundColor: theme['c-accent'] }
  const confirmTextColor = confirmDanger ? theme['c-danger'] : confirmColor

  return (
    <Dialog onHide={onHide} keyHide={keyHide} bgHide={bgHide} closeBtn={closeBtn} title={title} ref={dialogRef}>
      <View style={styles.main}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}>
          {children ?? <Text>{text}</Text>}
        </ScrollView>
      </View>
      <View style={{ ...styles.btns, ...(reverseBtn ? styles.btnsReversedDirection : styles.btnsDirection) }}>
        <Button style={{ ...styles.btn, backgroundColor: cancelBg }} onPress={handleCancel}>
          <Text style={styles.btnText} color={theme['c-font']}>{cancelText || t('cancel')}</Text>
        </Button>
        {showConfirm
          ? (
              <Button
                style={confirmStyle}
                onPress={onConfirm}
                disabled={disabledConfirm}
              >
                <Text style={styles.btnText} color={confirmTextColor}>{confirmText || t('confirm')}</Text>
              </Button>
            )
          : null}
      </View>
    </Dialog>
  )
})
