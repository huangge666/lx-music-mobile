import { forwardRef, type Ref, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import ActionSheet, { type ActionSheetType } from '@/components/common/ActionSheet'
import Button from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'

import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

type Sources = Readonly<Array<LX.OnlineSource | 'all'>>

export interface SourceSelectorProps<S extends Sources> {
  fontSize?: number
  center?: boolean
  onSourceChange: (source: S[number]) => void
}

export interface SourceSelectorType<S extends Sources> {
  setSourceList: (list: S, activeSource: S[number]) => void
}

const getSourceIcon = (source: string) => source == 'all' ? 'search-2' : 'album'

export const useSourceListI18n = (list: Sources) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const t = useI18n()
  return useMemo(() => {
    return list.map(s => ({ label: t(`source_${sourceNameType}_${s}`), action: s }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, sourceNameType, t])
}

const Component = <S extends Sources>({ fontSize = 15, center, onSourceChange }: SourceSelectorProps<S>, ref: Ref<SourceSelectorType<S>>) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const [list, setList] = useState([] as unknown as S)
  const [source, setSource] = useState<S[number]>('kw')
  const t = useI18n()
  const theme = useTheme()
  const actionSheetRef = useRef<ActionSheetType>(null)

  useImperativeHandle(ref, () => ({
    setSourceList(list, activeSource) {
      setList(list)
      setSource(activeSource)
    },
  }), [])

  const sourceList_t = useSourceListI18n(list)

  const handleShowSheet = () => {
    if (!sourceList_t.length) return
    actionSheetRef.current?.show({
      header: {
        title: t('source_select'),
        subtitle: t(`source_${sourceNameType}_${source}`),
        icon: getSourceIcon(source),
        iconBg: theme['c-primary-background'],
        iconColor: theme['c-primary'],
      },
      items: sourceList_t.map(item => ({
        action: item.action,
        label: item.label,
        icon: getSourceIcon(item.action),
        selected: item.action == source,
      })),
    })
  }

  const handleChangeSource = (action: string) => {
    const nextSource = action as S[number]
    onSourceChange(nextSource)
    setSource(nextSource)
  }

  return (
    <>
      <Button onPress={handleShowSheet}>
        <View style={styles.sourceMenu}>
          <Text style={{ textAlign: center ? 'center' : 'left' }} numberOfLines={1} size={fontSize}>
            {t(`source_${sourceNameType}_${source}`)}
          </Text>
          <Icon name="chevron-right" size={10} color={theme['c-font-label']} style={styles.chevron} />
        </View>
      </Button>
      <ActionSheet ref={actionSheetRef} onPress={handleChangeSource} />
    </>
  )
}

export default forwardRef(Component) as <S extends Sources>(p: SourceSelectorProps<S> & { ref?: Ref<SourceSelectorType<S>> }) => JSX.Element | null


const styles = createStyle({
  sourceMenu: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 15,
    paddingRight: 10,
  },
  chevron: {
    marginLeft: 2,
    opacity: 0.7,
  },
})
