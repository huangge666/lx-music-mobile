import { memo } from 'react'

import Button, { type BtnProps } from '@/components/common/Button'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { BorderRadius } from '@/theme'

export interface ButtonProps extends BtnProps {
  size?: number
}

export default memo(({ disabled, size = 14, onPress, children }: ButtonProps) => {
  const theme = useTheme()

  return (
    <Button style={{ ...styles.button, backgroundColor: theme['c-accent'], borderWidth: 0.5, borderColor: theme['c-glass-border'] }} onPress={onPress} disabled={disabled}>
      <Text size={size} color={theme.isDark ? 'rgb(18, 16, 14)' : 'rgb(255, 255, 255)'}>{children}</Text>
    </Button>
  )
})

const styles = createStyle({
  button: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.medium,
    marginRight: 10,
  },
})
