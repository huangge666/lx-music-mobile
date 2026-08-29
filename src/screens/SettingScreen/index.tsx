import { memo, useEffect } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { useBgPic, useStatusbarHeight } from '@/store/common/hook'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { BorderWidths } from '@/theme'
import { scaleSizeH } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'
import { pop } from '@/navigation'
import { SettingScreen, type SettingScreenIds } from '@/screens/Home/Views/Setting/Main'

const HEADER_HEIGHT = scaleSizeH(56)

const Header = memo(({ componentId, title, transparent }: { componentId: string, title: string, transparent: boolean }) => {
  const t = useI18n()
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()

  return (
    <View style={[styles.headerWrap, {
      height: HEADER_HEIGHT + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: transparent ? theme['c-glass-background'] : theme['c-content-background'],
      borderBottomColor: theme['c-border-background'],
    }]}>
      <StatusBar />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { void pop(componentId) }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          style={[styles.backButton, { backgroundColor: theme['c-primary-background'] }]}
        >
          <Icon name="chevron-left" size={19} color={theme['c-primary']} />
        </TouchableOpacity>
        <Text numberOfLines={1} size={22} style={styles.title}>{title}</Text>
      </View>
    </View>
  )
})

/** 独立设置子页，与音源管理使用同一页面壳，避免设置内容依赖主页头部状态。 */
export default ({ componentId, settingScreenId }: { componentId: string, settingScreenId: SettingScreenIds }) => {
  const theme = useTheme()
  const t = useI18n()
  const hasDynamicBg = useBgPic() != null

  useEffect(() => {
    setComponentId(COMPONENT_IDS.setting, componentId)
  }, [componentId])

  return (
    <PageContent>
      <Header componentId={componentId} title={t(`setting_${settingScreenId}`)} transparent={hasDynamicBg} />
      <ScrollView
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        style={[styles.scroll, { backgroundColor: hasDynamicBg ? 'transparent' : theme['c-card-background'] }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.contentInner}>
          <SettingScreen id={settingScreenId} />
        </View>
      </ScrollView>
    </PageContent>
  )
}

const styles = createStyle({
  headerWrap: { borderBottomWidth: BorderWidths.hairline },
  header: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, paddingHorizontal: 12, textAlign: 'left', fontWeight: '700', letterSpacing: 0.2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 80 },
  contentInner: { width: '100%', maxWidth: 720, alignSelf: 'center' },
})
