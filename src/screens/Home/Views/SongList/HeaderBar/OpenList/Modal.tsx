import { useRef, useImperativeHandle, forwardRef, useMemo, useState } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { View } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { BorderRadius } from '@/theme'
import { type Source } from '@/store/songlist/state'
import { parseSonglistInput } from './utils'

interface IdInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
}
const IdInput = forwardRef<IdInputType, { onSubmit: () => void }>((props, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  return (
    <View style={{ ...styles.inputWrap, backgroundColor: theme['c-primary-input-background'] }}>
      <Icon name="search-2" size={16} color={theme['c-font-label']} />
      <Input
        ref={inputRef}
        placeholder={t('songlist_open_input_placeholder')}
        value={text}
        onChangeText={setText}
        onSubmitEditing={props.onSubmit}
        returnKeyType="go"
        autoCorrect={false}
        clearBtn
        style={styles.input}
      />
    </View>
  )
})

const TipList = ({ text }: { text: string }) => {
  const theme = useTheme()
  const tips = useMemo(() => {
    return text
      .split('\n')
      .map(item => item.replace(/^\d+[.\u3001]\s*/, '').trim())
      .filter(Boolean)
  }, [text])

  return (
    <View style={styles.tips}>
      {tips.map((tip, index) => (
        <View key={tip} style={styles.tipRow}>
          <View style={{ ...styles.tipIndex, backgroundColor: theme['c-primary-background'] }}>
            <Text size={11} color={theme['c-primary']} style={styles.tipIndexText}>{index + 1}</Text>
          </View>
          <Text size={12} color={theme['c-font-label']} style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  )
}


export interface ModalProps {
  onOpenId: (info: { id: string, source: Source }) => void
}
export interface ModalType {
  show: (source: Source) => void
}

export default forwardRef<ModalType, ModalProps>(({ onOpenId }, ref) => {
  const alertRef = useRef<ConfirmAlertType>(null)
  const inputRef = useRef<IdInputType>(null)
  const [visible, setVisible] = useState(false)
  const [source, setSource] = useState<Source>('kw')
  const theme = useTheme()
  const t = useI18n()

  const handleShow = () => {
    alertRef.current?.setVisible(true)
    requestAnimationFrame(() => {
      inputRef.current?.setText('')
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    })
  }
  useImperativeHandle(ref, () => ({
    show(source) {
      setSource(source)
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
  }))

  const handleConfirm = () => {
    let id = inputRef.current?.getText() ?? ''
    if (!id.length) return
    if (id.length > 500) id = id.substring(0, 500)
    // 链接来源优先于页面当前 Tab，纯 ID 等非链接输入仍沿用用户选择的平台。
    const parsed = parseSonglistInput(id, source)
    alertRef.current?.setVisible(false)
    onOpenId(parsed)
  }

  return (
    visible
      ? <ConfirmAlert
          ref={alertRef}
          onConfirm={handleConfirm}
          closeBtn={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={{ ...styles.iconBubble, backgroundColor: theme['c-primary-background'] }}>
                <Icon name="album" size={18} color={theme['c-primary']} />
              </View>
              <View style={styles.headerText}>
                <Text size={17} style={styles.title}>{t('songlist_open_title')}</Text>
              </View>
            </View>
            <IdInput ref={inputRef} onSubmit={handleConfirm} />
            <TipList text={t('songlist_open_input_tip')} />
          </View>
        </ConfirmAlert>
      : null
  )
})


const styles = createStyle({
  content: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    flexGrow: 1,
    flexShrink: 1,
    gap: 4,
  },
  title: {
    fontWeight: '700',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingLeft: 14,
    borderRadius: BorderRadius.large,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    height: 48,
    backgroundColor: 'transparent',
    paddingLeft: 8,
  },
  tips: {
    gap: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  tipIndexText: {
    fontWeight: '700',
  },
  tipText: {
    flexGrow: 1,
    flexShrink: 1,
    lineHeight: 18,
  },
})
