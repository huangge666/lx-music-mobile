import { useImperativeHandle, forwardRef, useMemo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Modal, { type ModalType } from './Modal'
import { Icon } from '@/components/common/Icon'
import { useKeyboard } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { BorderRadius } from '@/theme'

/**
 * Apple Music 风格 Dialog 弹窗
 *
 * 视觉特征：
 * — 连续大圆角 + 轻阴影，贴近 iOS sheet
 * — 无标题时不渲染空顶栏，关闭按钮改为右上角浮层
 * — 有标题时使用 48pt 标题栏
 */
const CLOSE_SIZE = 32
const HEADER_HEIGHT = 48
const styles = createStyle({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  modalView: {
    width: '100%',
    maxWidth: 420,
    minWidth: 280,
    maxHeight: '78%',
    borderRadius: BorderRadius.xlarge,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
  },
  header: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: BorderRadius.xlarge,
    borderTopRightRadius: BorderRadius.xlarge,
    minHeight: HEADER_HEIGHT,
    paddingLeft: 18,
    paddingRight: CLOSE_SIZE + 16,
  },
  title: {
    flexGrow: 1,
    flexShrink: 1,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
  },
  bodyWithClose: {
    paddingTop: 36,
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
  const hasTitle = Boolean(title)

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      modalRef.current?.setVisible(visible)
    },
  }))

  const closeBtnComponent = useMemo(() => {
    return closeBtn
      ? (
          <TouchableOpacity
            style={{
              ...styles.closeBtn,
              top: hasTitle ? (HEADER_HEIGHT - CLOSE_SIZE) / 2 : 10,
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(118, 118, 128, 0.12)',
            }}
            activeOpacity={0.7}
            onPress={() => modalRef.current?.setVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="close"
          >
            <Icon name="close" color={theme['c-font-label']} size={12} />
          </TouchableOpacity>
        )
      : null
  }, [closeBtn, hasTitle, theme])

  return (
    <Modal onHide={onHide} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(0,0,0,.46)" ref={modalRef}>
      <View style={{ ...styles.centeredView, paddingBottom: keyboardShown ? keyboardHeight : 0 }}>
        <View style={{ ...styles.modalView, height, backgroundColor: theme['c-content-background'] }} onStartShouldSetResponder={() => true}>
          {hasTitle
            ? (
                <View style={{ ...styles.header, backgroundColor: theme['c-card-background'] }}>
                  <Text style={styles.title} size={16} color={theme['c-font']} numberOfLines={1}>{title}</Text>
                </View>
              )
            : null}
          {closeBtnComponent}
          <View style={!hasTitle && closeBtn ? { ...styles.body, ...styles.bodyWithClose } : styles.body}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  )
})
