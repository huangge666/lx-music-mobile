import { memo, useCallback, useMemo } from 'react'
import { Switch, TouchableOpacity, View } from 'react-native'

import { type CheckBoxProps } from '@/components/common/CheckBox'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { tipDialog } from '@/utils/tools'
import SettingIcon from './SettingIcon'
import { settingLayout } from './style'

export interface CheckBoxItemProps extends CheckBoxProps {
  icon?: string
  subtitle?: string
}

/**
 * 设置页开关行：图标 + 标题/说明 + Switch
 */
export default memo(({
  check,
  label,
  children,
  onChange,
  disabled = false,
  need = false,
  helpTitle,
  helpDesc,
  icon,
  subtitle,
}: CheckBoxItemProps) => {
  const theme = useTheme()
  const lockedOn = need && check
  const isDisabled = disabled || lockedOn
  const desc = subtitle ?? helpDesc

  const handleChange = useCallback((value: boolean) => {
    if (isDisabled) return
    onChange?.(value)
  }, [isDisabled, onChange])

  const handleToggle = useCallback(() => {
    handleChange(!check)
  }, [check, handleChange])

  const handleShowHelp = useCallback(() => {
    void tipDialog({
      title: helpTitle ?? label ?? '',
      message: helpDesc,
      btnText: global.i18n.t('understand'),
    })
  }, [helpDesc, helpTitle, label])

  const helpBtn = useMemo(() => {
    if (!(helpTitle ?? helpDesc)) return null
    return (
      <TouchableOpacity style={styles.helpBtn} onPress={handleShowHelp} hitSlop={8}>
        <Icon size={15} name="help" color={theme['c-font-label']} />
      </TouchableOpacity>
    )
  }, [handleShowHelp, helpDesc, helpTitle, theme])

  return (
    <View style={[settingLayout.row, isDisabled ? styles.disabled : null]}>
      {icon ? <SettingIcon name={icon} /> : null}
      <TouchableOpacity
        style={settingLayout.rowBody}
        activeOpacity={isDisabled ? 1 : 0.6}
        onPress={isDisabled ? undefined : handleToggle}
        disabled={isDisabled}
      >
        {label
          ? <Text style={settingLayout.rowTitle} size={15} color={theme['c-font']} numberOfLines={2}>{label}</Text>
          : children}
        {desc
          ? <Text style={settingLayout.rowSubtitle} size={12} color={theme['c-font-label']} numberOfLines={2}>{desc}</Text>
          : null}
      </TouchableOpacity>
      {helpBtn}
      <Switch
        value={check}
        onValueChange={handleChange}
        disabled={isDisabled}
        trackColor={{
          false: theme.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(120, 120, 128, 0.16)',
          true: theme['c-primary-alpha-400'],
        }}
        thumbColor={check ? theme['c-primary'] : theme.isDark ? '#d1d1d6' : '#ffffff'}
        ios_backgroundColor={theme.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(120, 120, 128, 0.16)'}
      />
    </View>
  )
})

const styles = {
  disabled: {
    opacity: 0.45,
  },
  helpBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    marginRight: 2,
  },
}
