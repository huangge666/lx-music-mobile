import { useEffect, memo } from 'react'
import { ScrollView, View, TouchableOpacity } from 'react-native'

import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import SourceManager from '@/screens/Home/Views/Setting/settings/Source/Manager'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { useBgPic, useStatusbarHeight } from '@/store/common/hook'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { pop } from '@/navigation'
import { BorderWidths } from '@/theme'
import { scaleSizeH } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'

const HEADER_HEIGHT = scaleSizeH(56)

const Header = memo(({ componentId, transparent }: { componentId: string, transparent: boolean }) => {
  const t = useI18n()
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    void pop(componentId)
  }

  return (
    <View
      style={[
        styles.headerWrap,
        {
          height: HEADER_HEIGHT + statusBarHeight,
          paddingTop: statusBarHeight,
          backgroundColor: transparent ? theme['c-glass-background'] : theme['c-content-background'],
          borderBottomColor: theme['c-border-background'],
        },
      ]}
    >
      <StatusBar />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={back}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          style={[styles.backButton, { backgroundColor: theme['c-primary-background'] }]}
        >
          <Icon name="chevron-left" size={19} color={theme['c-primary']} />
        </TouchableOpacity>
        <Text numberOfLines={1} size={22} style={styles.title}>{t('setting_source')}</Text>
      </View>
    </View>
  )
})

/**
 * 音源管理独立页面。
 * 页面注册在 React Native Navigation 栈中，返回行为与播放详情、评论页保持一致。
 */
export default ({ componentId }: { componentId: string }) => {
  const theme = useTheme()
  const hasDynamicBg = useBgPic() != null

  useEffect(() => {
    setComponentId(COMPONENT_IDS.sourceManager, componentId)
  }, [componentId])

  return (
    <PageContent>
      <Header componentId={componentId} transparent={hasDynamicBg} />
      <ScrollView
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        style={[styles.scroll, { backgroundColor: hasDynamicBg ? 'transparent' : theme['c-card-background'] }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.contentInner}>
          <SourceManager />
        </View>
      </ScrollView>
    </PageContent>
  )
}

const styles = createStyle({
  headerWrap: {
    borderBottomWidth: BorderWidths.hairline,
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    paddingHorizontal: 12,
    textAlign: 'left',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  contentInner: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
})
