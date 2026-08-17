import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

import { createStyle } from '@/utils/tools'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import { handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useListInfo } from './state'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const info = useListInfo()

  const back = () => {
    void pop(commonState.componentIds.songlistDetail!)
  }

  const handlePlayAll = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }

  const handleCollection = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handleCollect(info.id, info.source, songlistState.listDetailInfo.info.name || info.name)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePlayAll}
        activeOpacity={0.78}
        style={{ ...styles.primaryBtn, backgroundColor: theme['c-primary'] }}
      >
        <Icon name="play" color="#fff" size={15} />
        <Text style={styles.primaryBtnText} color="#fff">{t('play_all')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleCollection}
        activeOpacity={0.72}
        style={{ ...styles.secondaryBtn, backgroundColor: theme['c-card-background'], borderColor: theme['c-border-background'] }}
      >
        <Icon name="love" color={theme['c-primary']} size={15} />
        <Text style={styles.secondaryBtnText} color={theme['c-font']}>{t('collect_songlist')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel={t('back')}
        onPress={back}
        activeOpacity={0.72}
        style={{ ...styles.backBtn, backgroundColor: theme['c-card-background'], borderColor: theme['c-border-background'] }}
      >
        <Icon name="chevron-left" color={theme['c-font']} size={17} />
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    paddingTop: 16,
    gap: 10,
  },
  primaryBtn: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 23,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

