import { useState, useRef, useEffect } from 'react'
import { View } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { confirmDialog, createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import { createUserList } from '@/core/list'
import listState from '@/store/list/state'
import { BorderRadius } from '@/theme'
import { useTheme } from '@/store/theme/hook'

export default ({ isEdit, onHide }: {
  isEdit: boolean
  onHide: () => void
}) => {
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)
  const t = useI18n()
  const theme = useTheme()

  useEffect(() => {
    if (isEdit) {
      setText('')
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [isEdit])

  const handleSubmitEditing = async() => {
    onHide()
    const name = text.trim()
    if (!name.length || (listState.userList.some(l => l.name == name) && !(await confirmDialog({
      message: global.i18n.t('list_duplicate_tip'),
    })))) return
    void createUserList(listState.userList.length, [{ id: `userlist_${Date.now()}`, name, locationUpdateTime: null }])
  }

  return isEdit
    ? (
      <View style={[styles.imputContainer, { backgroundColor: theme['c-card-background'] }]}>
        <Input
          placeholder={t('list_create_input_placeholder')}
          value={text}
          onChangeText={setText}
          ref={inputRef}
          onBlur={handleSubmitEditing}
          onSubmitEditing={handleSubmitEditing}
          style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
        />
      </View>
      )
    : null
}

const styles = createStyle({
  imputContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    borderRadius: BorderRadius.small,
    textAlign: 'center',
    height: 36,
  },
})
