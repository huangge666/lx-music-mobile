import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { scaleSizeH } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import { useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { BorderWidths } from '@/theme'

const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default memo(({ musicInfo }: {
  musicInfo: LX.Music.MusicInfo
}) => {
  const t = useI18n()
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    void pop(commonState.componentIds.comment!)
  }

  return (
    <View
      style={{
        height: HEADER_HEIGHT + statusBarHeight,
        paddingTop: statusBarHeight,
        backgroundColor: theme['c-glass-background'],
        borderBottomColor: theme['c-glass-border'],
        borderBottomWidth: BorderWidths.hairline,
      }}
    >
      <StatusBar />
      <View style={styles.container}>
        <TouchableOpacity
          onPress={back}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          style={{ ...styles.backButton, backgroundColor: theme['c-primary-background'] }}
        >
          <Icon name="chevron-left" size={19} color={theme['c-primary']} />
        </TouchableOpacity>
        <Text numberOfLines={1} size={16} style={styles.title} color={theme['c-font']}>
          {t('comment_title', { name: musicInfo.name, singer: musicInfo.singer })}
        </Text>
      </View>
    </View>
  )
})


const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
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
    fontWeight: '700',
  },
})
