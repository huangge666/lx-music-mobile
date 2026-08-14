import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { TextInput, View, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { setSpText } from '@/utils/pixelRatio'
import { BorderRadius } from '@/theme'

/**
 * Apple Music 风格 Input 组件
 *
 * 特征：
 * — 浅灰填充背景 (c-primary-input-background)
 * — 圆角 10pt
 * — 清除按钮带圆角背景
 * — 选中色为主色
 */
const styles = createStyle({
  content: {
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
  },
  input: {
    borderRadius: BorderRadius.small,
    paddingTop: 0,
    paddingBottom: 0,
    height: 36,
    paddingLeft: 12,
    paddingRight: 4,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 15,
  },
  clearBtnContent: {
    flexGrow: 0,
    flexShrink: 0,
  },
  /**
   * Apple Music 风格清除按钮
   * — 圆形背景 + × 图标
   */
  clearBtn: {
    width: 20,
    height: 20,
    marginRight: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export interface InputProps extends TextInputProps {
  onChangeText?: (value: string) => void
  onClearText?: () => void
  clearBtn?: boolean
  size?: number
}


export interface InputType {
  blur: () => void
  focus: () => void
  clear: () => void
  isFocused: () => boolean
}

export default forwardRef<InputType, InputProps>(({ onChangeText, onClearText, clearBtn, style, size = 15, ...props }, ref) => {
  const inputRef = useRef<TextInput>(null)
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    blur() {
      inputRef.current?.blur()
    },
    focus() {
      inputRef.current?.focus()
    },
    clear() {
      inputRef.current?.clear()
    },
    isFocused() {
      return inputRef.current?.isFocused() ?? false
    },
  }))

  const clearText = useCallback(() => {
    inputRef.current?.clear()
    onChangeText?.('')
    onClearText?.()
  }, [onChangeText, onClearText])

  const changeText = useCallback((text: string) => {
    onChangeText?.(text)
  }, [onChangeText])

  return (
    <View style={styles.content}>
      <TextInput
        autoCapitalize="none"
        onChangeText={changeText}
        autoComplete="off"
        style={StyleSheet.compose({ ...styles.input, color: theme['c-font'], fontSize: setSpText(size) }, style)}
        placeholderTextColor={theme['c-font-label']}
        selectionColor={theme['c-primary']}
        ref={inputRef} {...props} />
      {clearBtn
        ? <View style={styles.clearBtnContent}>
            <TouchableOpacity style={{ ...styles.clearBtn, backgroundColor: theme['c-font-label'] }} onPress={clearText} activeOpacity={0.6}>
              <Icon name="remove" color={theme.isDark ? '#000' : '#fff'} size={10} />
            </TouchableOpacity>
          </View>
        : null
      }
    </View>
  )
})
