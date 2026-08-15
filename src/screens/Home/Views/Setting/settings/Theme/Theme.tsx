import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity, StyleSheet, type ImageSourcePropType } from 'react-native'
import { setTheme } from '@/core/theme'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'

import SubTitle from '../../components/SubTitle'
import { BG_IMAGES, getAllThemes, type LocalTheme } from '@/theme/themes'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'
import ImageBackground from '@/components/common/ImageBackground'

const useActive = (id: string) => {
  const activeThemeId = useSettingValue('theme.id')
  const isActive = useMemo(() => activeThemeId == id, [activeThemeId, id])
  return isActive
}

const ThemeItem = ({ id, name, color, image, setTheme, showAll }: {
  id: string
  name: string
  color: string
  showAll: boolean
  image?: ImageSourcePropType
  setTheme: (id: string) => void
}) => {
  const theme = useTheme()
  const isActive = useActive(id)

  return (
    showAll || isActive ? (
      <TouchableOpacity style={styles.item} activeOpacity={0.5} onPress={() => { setTheme(id) }}>
        <View style={{
          ...styles.colorContent,
          backgroundColor: color,
          borderColor: isActive ? theme['c-primary'] : theme['c-border-background'],
          borderWidth: isActive ? 3 : 1,
        }}>
          {
            image
              ? <ImageBackground style={styles.imageContent} imageStyle={styles.imageInner} source={image} />
              : null
          }
          {isActive ? <Icon name="checkbox-marked" size={16} color="#ffffff" /> : null}
        </View>
        <Text style={styles.name} size={11} color={isActive ? theme['c-primary'] : theme['c-font-label']} numberOfLines={1}>{name}</Text>
      </TouchableOpacity>
    ) : null
  )
}

const MoreBtn = ({ showAll, setShowAll }: {
  showAll: boolean
  setShowAll: (showAll: boolean) => void
}) => {
  const theme = useTheme()
  const t = useI18n()

  return (
    showAll ? null
      : (
          <TouchableOpacity style={styles.moreBtn} activeOpacity={0.5} onPress={() => { setShowAll(!showAll) }}>
            <Text size={14} color={theme['c-primary-font']} numberOfLines={1}>{t('setting_basic_theme_more_btn_show')}</Text>
            <Icon name="chevron-right" size={12} color={theme['c-primary-font']} />
          </TouchableOpacity>
        )

  )
}

interface ThemeInfo {
  themes: Readonly<LocalTheme[]>
  userThemes: LX.Theme[]
  dataPath: string
}
const initInfo: ThemeInfo = { themes: [], userThemes: [], dataPath: '' }
export default memo(() => {
  const [showAll, setShowAll] = useState(false)
  const t = useI18n()
  const [themeInfo, setThemeInfo] = useState(initInfo)
  const setThemeId = useCallback((id: string) => {
    requestAnimationFrame(() => {
      setTheme(id)
    })
  }, [])

  useEffect(() => {
    void getAllThemes().then(setThemeInfo)
  }, [])

  return (
    <SubTitle title={t('setting_basic_theme')}>
      <View style={styles.list}>
        {
          themeInfo.themes.map(({ id, config }) => {
            return <ThemeItem
              key={id}
              color={config.themeColors['c-theme']}
              image={config.extInfo['bg-image'] ? BG_IMAGES[config.extInfo['bg-image']] : undefined}
              showAll={showAll}
              id={id}
              name={t(`theme_${id}`)}
              setTheme={setThemeId} />
          })
        }
        {
          themeInfo.userThemes.map(({ id, name, config }) => {
            return <ThemeItem
              key={id}
              color={config.themeColors['c-theme']}
              // image={undefined}
              showAll={showAll}
              id={id}
              name={name}
              setTheme={setThemeId} />
          })
        }
        <MoreBtn showAll={showAll} setShowAll={setShowAll} />
      </View>
    </SubTitle>
  )
})

const styles = createStyle({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
    alignItems: 'center',
  },
  item: {
    width: 52,
    alignItems: 'center',
  },
  colorContent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContent: {
    ...StyleSheet.absoluteFillObject,
  },
  imageInner: {
    borderRadius: 20,
  },
  name: {
    marginTop: 4,
  },
  moreBtn: {
    marginLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
})
