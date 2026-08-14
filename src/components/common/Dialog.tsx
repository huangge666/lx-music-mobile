import { useImperativeHandle, forwardRef, useMemo, useRef } from 'react'
import { View, TouchableHighlight } from 'react-native'

import Modal, { type ModalType } from './Modal'
import { Icon } from '@/components/common/Icon'
import { useKeyboard } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { BorderRadius } from '@/theme'

/**
 * Apple Music 风格 Dialog 弹窗
 *
 * 视觉特征：
 * — 圆角 14pt（Apple modal 标准圆角）
 * — 内容背景使用 c-content-background
 * — 标题栏使用 c-card-background 次级背景
 * — 关闭按钮使用主色
 */
const HEADER_HEIGHT = 20
const styles = createStyle({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    maxWidth: '90%',
    minWidth: '60%',
    maxHeight: '78%',
    borderRadius: BorderRadius.normal,
    elevation: 3,
  },
  header: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    borderTopLeftRadius: BorderRadius.normal,
    borderTopRightRadius: BorderRadius.normal,
    height: HEADER_HEIGHT,
  },
  title: {
    paddingLeft: 5,
    paddingRight: 25,
    lineHeight: HEADER_HEIGHT,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    borderTopRightRadius: BorderRadius.normal,
    flexGrow: 0,
    flexShrink: 0,
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export interface DialogProps {
  onHide?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  title?: string
  children: React.ReactNode | React.ReactNode[]
  height?: number | `${number}%`
}

export interface DialogType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<DialogType, DialogProps>(({
  onHide,
  keyHide = true,
  bgHide = true,
  closeBtn = true,
  title = '',
  children,
  height,
}: DialogProps, ref) => {
  const theme = useTheme()
  const { keyboardShown, keyboardHeight } = useKeyboard()
  const modalRef = useRef<ModalType>(null)

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      modalRef.current?.setVisible(visible)
    },
  }))

  const closeBtnComponent = useMemo(() => {
    return closeBtn
      ? <TouchableHighlight style={{ ...styles.closeBtn, width: scaleSizeH(HEADER_HEIGHT) }} underlayColor={theme['c-primary-background-active']} onPress={() => modalRef.current?.setVisible(false)}>
          <Icon name="close" color={theme['c-font-label']} size={10} />
        </TouchableHighlight>
      : null
  }, [closeBtn, theme])

  return (
    <Modal onHide={onHide} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(50,50,50,.3)" ref={modalRef}>
      <View style={{ ...styles.centeredView, paddingBottom: keyboardShown ? keyboardHeight : 0 }}>
        <View style={{ ...styles.modalView, height, backgroundColor: theme['c-content-background'] }} onStartShouldSetResponder={() => true}>
          <View style={{ ...styles.header, backgroundColor: theme['c-card-background'] }}>
            <Text style={styles.title} size={13} color={theme['c-font']} numberOfLines={1}>{title}</Text>
            {closeBtnComponent}
          </View>
          {children}
        </View>
      </View>
    </Modal>
  )
})
