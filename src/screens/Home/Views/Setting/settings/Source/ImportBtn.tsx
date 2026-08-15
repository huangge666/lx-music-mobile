import { useRef } from 'react'
import { TouchableOpacity, View } from 'react-native'

import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { state } from '@/store/userApi'
import { tipDialog, createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { BorderRadius, BorderWidths } from '@/theme'
import ScriptImportExport, { type ScriptImportExportType } from '../Basic/UserApiEditModal/ScriptImportExport'
import ScriptImportOnline, { type ScriptImportOnlineType } from '../Basic/UserApiEditModal/ScriptImportOnline'

/**
 * 两个高频导入动作直接展开，减少一次菜单操作，也更贴近移动端设置页的单手使用场景。
 */
export default () => {
  const t = useI18n()
  const theme = useTheme()
  const scriptImportExportRef = useRef<ScriptImportExportType>(null)
  const scriptImportOnlineRef = useRef<ScriptImportOnlineType>(null)

  const canImport = () => {
    if (state.list.length > 20) {
      void tipDialog({
        message: t('user_api_max_tip'),
        btnText: t('ok'),
      })
      return false
    }
    return true
  }

  const importLocal = () => {
    if (!canImport()) return
    scriptImportExportRef.current?.import()
  }

  const importOnline = () => {
    if (!canImport()) return
    scriptImportOnlineRef.current?.show()
  }

  return (
    <>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: theme['c-button-background'] }]}
          onPress={importLocal}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={t('user_api_btn_import_local')}
        >
          <Icon name="download-2" size={17} color={theme['c-button-font']} />
          <Text size={14} color={theme['c-button-font']} style={styles.buttonText}>
            {t('user_api_btn_import_local')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: theme['c-primary'] }]}
          onPress={importOnline}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={t('user_api_btn_import_online')}
        >
          <Icon name="share" size={17} color={theme['c-primary']} />
          <Text size={14} color={theme['c-primary']} style={styles.buttonText}>
            {t('user_api_btn_import_online')}
          </Text>
        </TouchableOpacity>
      </View>
      <ScriptImportExport ref={scriptImportExportRef} />
      <ScriptImportOnline ref={scriptImportOnlineRef} />
    </>
  )
}

const styles = createStyle({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 54,
    borderRadius: BorderRadius.round,
    borderWidth: BorderWidths.thin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  primaryButton: {
    borderColor: 'transparent',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontWeight: '600',
  },
})
