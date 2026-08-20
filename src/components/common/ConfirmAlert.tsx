import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View, ScrollView } from 'react-native'
import Dialog, { type DialogType } from './Dialog'
import Button from './Button'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang/index'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { BorderRadius } from '@/theme'

const styles = createStyle({
  main: {
    flexShrink: 1,
    marginTop: 16,
    marginHorizontal: 6,
    marginBottom: 18,
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
    gap: 10,
  },
  btnsDirection: {},
  btnsReversedDirection: {
    flexDirection: 'row-reverse',
  },
  btn: {
    flex: 1,
    minHeight: 44,
    paddingTop: 11,
    paddingBottom: 11,
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

  const cancelBg = theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(118, 118, 128, 0.12)'

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
                style={{ ...styles.btn, backgroundColor: theme['c-primary'] }}
                onPress={onConfirm}
                disabled={disabledConfirm}
              >
                <Text style={styles.btnText} color="#fff">{confirmText || t('confirm')}</Text>
              </Button>
            )
          : null}
      </View>
    </Dialog>
  )
})
