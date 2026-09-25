import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useMyList } from '@/store/list/hook'
import { handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useListInfo } from './state'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const info = useListInfo()
  const lists = useMyList()
  const listId = info ? `${info.source}__${info.id}` : ''
  const isCollected = !!info && lists.some(list => 'sourceListId' in list && (list.sourceListId == listId || list.sourceListId == info.id))

  const handlePlayAll = () => {
    if (!info || !songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }

  const handleCollection = () => {
    if (!info || !songlistState.listDetailInfo.info.name) return
    void handleCollect(info.id, info.source, songlistState.listDetailInfo.info.name || info.name)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleCollection}
        activeOpacity={0.72}
        style={{ ...styles.secondaryBtn, backgroundColor: theme['c-card-background'], borderColor: theme['c-border-background'] }}
      >
        <Icon name="love" color={theme['c-primary']} size={14} />
        <Text style={styles.secondaryBtnText} color={theme['c-font']} numberOfLines={1}>{t(isCollected ? 'collected_songlist' : 'collect_songlist')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handlePlayAll}
        activeOpacity={0.78}
        style={{ ...styles.primaryBtn, backgroundColor: theme['c-primary'] }}
      >
        <Icon name="play" color="#fff" size={14} />
        <Text style={styles.primaryBtnText} color="#fff" numberOfLines={1}>{t('play_all')}</Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 16,
  },
  primaryBtn: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
})
