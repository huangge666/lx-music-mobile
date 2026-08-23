import { memo } from 'react'

import Button, { type BtnProps } from '@/components/common/Button'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { BorderRadius } from '@/theme'

type ButtonProps = BtnProps

export default memo(({ disabled, onPress, children }: ButtonProps) => {
  const theme = useTheme()

  return (
    <Button
      style={{
        ...styles.button,
        backgroundColor: theme['c-button-background'],
        borderWidth: 0.5,
        borderColor: theme['c-glass-border'],
      }}
      onPress={onPress}
      disabled={disabled}
    >
      <Text size={13} color={theme['c-button-font']} style={styles.text}>{children}</Text>
    </Button>
  )
})

const styles = createStyle({
  button: {
    paddingLeft: 18,
    paddingRight: 18,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    borderRadius: BorderRadius.round,
    marginRight: 10,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
})
