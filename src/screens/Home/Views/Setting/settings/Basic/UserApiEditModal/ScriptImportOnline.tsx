import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { View } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'
import { createStyle, toast } from '@/utils/tools'
import { BorderRadius } from '@/theme'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { httpFetch } from '@/utils/request'
import { handleImportScript } from './action'

interface UrlInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
}

const UrlInput = forwardRef<UrlInputType, { onSubmit: () => void }>((props, ref) => {
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
      <Icon name="share" size={16} color={theme['c-font-label']} />
      <Input
        ref={inputRef}
        placeholder={t('user_api_btn_import_online_input_tip')}
        value={text}
        onChangeText={setText}
        onSubmitEditing={props.onSubmit}
        returnKeyType="go"
        keyboardType="url"
        autoCorrect={false}
        clearBtn
        style={styles.input}
      />
    </View>
  )
})


export interface ScriptImportOnlineType {
  show: () => void
}


export default forwardRef<ScriptImportOnlineType, {}>((props, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const alertRef = useRef<ConfirmAlertType>(null)
  const urlInputRef = useRef<UrlInputType>(null)
  const [visible, setVisible] = useState(false)
  const [btn, setBtn] = useState({ disabled: false, text: t('user_api_btn_import_online_input_confirm') })

  const handleShow = () => {
    alertRef.current?.setVisible(true)
    setBtn({ disabled: false, text: t('user_api_btn_import_online_input_confirm') })
    requestAnimationFrame(() => {
      urlInputRef.current?.setText('')
      setTimeout(() => {
        urlInputRef.current?.focus()
      }, 300)
    })
  }
  useImperativeHandle(ref, () => ({
    show() {
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
  }))

  const importingRef = useRef(false)
  const handleImport = async() => {
    if (importingRef.current) return
    let url = urlInputRef.current?.getText() ?? ''
    if (!/^https?:\/\//.test(url)) {
      url = ''
      urlInputRef.current?.setText('')
    }
    if (!url.length) return
    importingRef.current = true
    setBtn({ disabled: true, text: t('user_api_btn_import_online_input_loading') })
    let script: string
    try {
      script = await httpFetch(url).promise.then(resp => resp.body) as string
    } catch (err: any) {
      toast(t('user_api_import_failed_tip', { message: err.message }), 'long')
      return
    } finally {
      importingRef.current = false
      setBtn({ disabled: false, text: t('user_api_btn_import_online_input_confirm') })
    }
    if (script.length > 9_000_000) {
      toast(t('user_api_import_failed_tip', { message: 'Too large script' }), 'long')
      return
    }
    void handleImportScript(script)

    alertRef.current?.setVisible(false)
  }

  return (
    visible
      ? <ConfirmAlert
          ref={alertRef}
          onConfirm={handleImport}
          disabledConfirm={btn.disabled}
          confirmText={btn.text}
          closeBtn={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={{ ...styles.iconBubble, backgroundColor: theme['c-primary-background'] }}>
                <Icon name="share" size={18} color={theme['c-primary']} />
              </View>
              <View style={styles.headerText}>
                <Text size={17} style={styles.title}>{t('user_api_btn_import_online')}</Text>
                <Text size={12} color={theme['c-font-label']} style={styles.subtitle}>
                  {t('user_api_btn_import_online_desc')}
                </Text>
              </View>
            </View>
            <UrlInput ref={urlInputRef} onSubmit={() => { void handleImport() }} />
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
  subtitle: {
    lineHeight: 17,
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
})
