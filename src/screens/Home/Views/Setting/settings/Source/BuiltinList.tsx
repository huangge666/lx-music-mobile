import { memo, useCallback, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import CheckBox from '@/components/common/CheckBox'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { useUserApiList, state as userApiState } from '@/store/userApi'
import { tipDialog, toast, createStyle } from '@/utils/tools'
import { BorderRadius, BorderWidths } from '@/theme'
import {
  BUILTIN_USER_APIS,
  USER_API_IMPORT_LIMIT,
  findImportedBuiltinUserApi,
  importBuiltinUserApi,
  type BuiltinUserApiId,
} from '@/core/init/userApi/builtinSource'

/**
 * 内置源入口：点击后弹出可选列表，用户勾选后再逐个导入。
 */
export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const userApiList = useUserApiList()
  const alertRef = useRef<ConfirmAlertType>(null)
  const [visible, setVisible] = useState(false)
  const [selected, setSelected] = useState<BuiltinUserApiId[]>([])
  const [importing, setImporting] = useState(false)

  const importedCount = BUILTIN_USER_APIS.filter(source => {
    return userApiList.some(api => api.homepage == source.url)
  }).length

  const openPicker = useCallback(() => {
    setSelected([])
    if (visible) alertRef.current?.setVisible(true)
    else {
      setVisible(true)
      requestAnimationFrame(() => {
        alertRef.current?.setVisible(true)
      })
    }
  }, [visible])

  const toggleSelected = useCallback((id: BuiltinUserApiId) => {
    setSelected(current => {
      return current.includes(id)
        ? current.filter(item => item != id)
        : [...current, id]
    })
  }, [])

  const handleImport = useCallback(async() => {
    if (importing || !selected.length) return
    const sources = BUILTIN_USER_APIS.filter(source => selected.includes(source.id))
    const pending = sources.filter(source => !findImportedBuiltinUserApi(source))
    if (!pending.length) {
      alertRef.current?.setVisible(false)
      return
    }
    if (userApiState.list.length + pending.length > USER_API_IMPORT_LIMIT) {
      void tipDialog({
        message: t('user_api_max_tip'),
        btnText: t('ok'),
      })
      return
    }

    setImporting(true)
    const failed: string[] = []
    for (const source of pending) {
      try {
        await importBuiltinUserApi(source)
      } catch (err: any) {
        failed.push(`${t(source.nameKey)}: ${err?.message ?? ''}`)
      }
    }
    setImporting(false)
    if (failed.length) {
      toast(t('user_api_import_failed_tip', { message: failed.join('\n') }), 'long')
      return
    }
    toast(t('user_api_import_success_tip'))
    alertRef.current?.setVisible(false)
  }, [importing, selected, t])

  return (
    <>
      <TouchableOpacity
        style={[styles.entry, {
          backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(118, 118, 128, 0.06)',
          borderColor: theme['c-border-background'],
        }]}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={t('setting_source_builtin')}
        onPress={openPicker}
      >
        <View style={[styles.iconBubble, { backgroundColor: theme['c-primary-background'] }]}>
          <Icon name="album" size={18} color={theme['c-primary']} />
        </View>
        <View style={styles.info}>
          <Text size={15} style={styles.name} numberOfLines={1}>{t('setting_source_builtin')}</Text>
          <Text size={12} color={theme['c-font-label']} numberOfLines={1}>
            {t('setting_source_builtin_count', { imported: importedCount, total: BUILTIN_USER_APIS.length })}
          </Text>
        </View>
        <Icon name="chevron-right" size={16} color={theme['c-font-label']} />
      </TouchableOpacity>

      {visible
        ? (
            <ConfirmAlert
              ref={alertRef}
              title={t('setting_source_builtin')}
              confirmText={importing
                ? t('user_api_btn_import_online_input_loading')
                : t('setting_source_builtin_import')}
              disabledConfirm={!selected.length || importing}
              closeBtn={false}
              bgHide={!importing}
              onConfirm={() => { void handleImport() }}
            >
              <View style={styles.picker}>
                <Text size={13} color={theme['c-font-label']} style={styles.pickerDesc}>
                  {t('setting_source_builtin_picker_desc')}
                </Text>
                {BUILTIN_USER_APIS.map(source => {
                  const imported = userApiList.some(api => api.homepage == source.url)
                  const checked = imported || selected.includes(source.id)
                  return (
                    <View
                      key={source.id}
                      style={[styles.option, {
                        backgroundColor: checked ? theme['c-primary-background'] : 'transparent',
                        borderColor: checked ? theme['c-primary-alpha-600'] : theme['c-border-background'],
                      }]}
                    >
                      <CheckBox
                        check={checked}
                        label={t(source.nameKey)}
                        disabled={imported || importing}
                        onChange={() => { toggleSelected(source.id) }}
                      />
                      {imported
                        ? <Text size={12} color={theme['c-primary']}>{t('setting_source_builtin_imported')}</Text>
                        : null}
                    </View>
                  )
                })}
              </View>
            </ConfirmAlert>
          )
        : null}
    </>
  )
})

const styles = createStyle({
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.large,
    borderWidth: BorderWidths.thin,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flexGrow: 1,
    flexShrink: 1,
  },
  name: {
    fontWeight: '600',
    marginBottom: 2,
  },
  picker: {
    gap: 10,
    paddingBottom: 8,
  },
  pickerDesc: {
    lineHeight: 18,
    marginBottom: 2,
  },
  option: {
    minHeight: 52,
    borderRadius: BorderRadius.medium,
    borderWidth: BorderWidths.thin,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
