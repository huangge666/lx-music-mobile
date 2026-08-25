import { useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useMyList, useMusicExistsList } from '@/store/list/hook'
import CreateUserList from './CreateUserList'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle, toast } from '@/utils/tools'
import { BorderRadius, BorderWidths } from '@/theme'
import { LIST_IDS } from '@/config/constant'

const getPlaylistIcon = (id?: string) => {
  switch (id) {
    case LIST_IDS.LOVE:
      return 'love'
    case LIST_IDS.DEFAULT:
      return 'play-outline'
    default:
      return 'album'
  }
}

const RowContent = ({
  listInfo,
  disabled,
  onPress,
}: {
  listInfo: LX.List.MyListInfo
  disabled?: boolean
  onPress: () => void
}) => {
  const theme = useTheme()

  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.rowDisabled]}
      activeOpacity={disabled ? 1 : 0.6}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: theme['c-primary-background'] }]}>
        <Icon name={getPlaylistIcon(listInfo.id)} size={16} color={theme['c-primary']} />
      </View>
      <Text style={styles.rowText} size={15} color={theme['c-font']} numberOfLines={1}>
        {listInfo.name}
      </Text>
      <Icon name="chevron-right" size={12} color={theme['c-font-label']} style={styles.chevron} />
    </TouchableOpacity>
  )
}

const ExistsRow = ({
  listInfo,
  musicInfo,
  onPress,
}: {
  listInfo: LX.List.MyListInfo
  musicInfo: LX.Music.MusicInfo
  onPress: (listInfo: LX.List.MyListInfo) => void
}) => {
  const isExists = useMusicExistsList(listInfo, musicInfo)

  const handlePress = () => {
    if (isExists) {
      toast(global.i18n.t('list_add_tip_exists'))
      return
    }
    onPress(listInfo)
  }

  return <RowContent listInfo={listInfo} disabled={isExists} onPress={handlePress} />
}

const CreateRow = () => {
  const [isEdit, setEdit] = useState(false)
  const theme = useTheme()
  const t = useI18n()

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.createBtn}
        activeOpacity={0.6}
        onPress={() => { setEdit(true) }}
      >
        <View style={[styles.iconBox, { backgroundColor: theme['c-primary-background'] }]}>
          <Icon name="add_folder" size={16} color={theme['c-primary']} />
        </View>
        <Text style={[styles.rowText, { opacity: isEdit ? 0 : 1 }]} size={15} color={theme['c-font']} numberOfLines={1}>
          {t('list_create')}
        </Text>
      </TouchableOpacity>
      {
        isEdit
          ? <CreateUserList isEdit={isEdit} onHide={() => { setEdit(false) }} />
          : null
      }
    </View>
  )
}

export default ({ musicInfo, excludeListId, onPress }: {
  musicInfo?: LX.Music.MusicInfo
  excludeListId?: string
  onPress: (listInfo: LX.List.MyListInfo) => void
}) => {
  const theme = useTheme()
  const allList = useMyList().filter(l => l.id != excludeListId)

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.group, { backgroundColor: theme['c-card-background'] }]} onStartShouldSetResponder={() => true}>
        {allList.map((info) => (
          <View
            key={info.id}
            style={[styles.rowWrap, { borderBottomColor: theme['c-border-background'] }]}
          >
            {
              musicInfo
                ? <ExistsRow listInfo={info} musicInfo={musicInfo} onPress={onPress} />
                : <RowContent listInfo={info} onPress={() => { onPress(info) }} />
            }
          </View>
        ))}
        <CreateRow />
      </View>
    </ScrollView>
  )
}

const styles = createStyle({
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  group: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  rowWrap: {
    borderBottomWidth: BorderWidths.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 14,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowText: {
    flex: 1,
    fontWeight: '500',
  },
  chevron: {
    opacity: 0.6,
  },
})
