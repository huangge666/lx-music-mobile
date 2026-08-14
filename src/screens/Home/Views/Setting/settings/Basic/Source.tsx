import { memo, useCallback, useMemo, useRef } from 'react'

import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { createStyle } from '@/utils/tools'
import { setApiSource, toggleApiSourceEnabled } from '@/core/apiSource'
import { useI18n } from '@/lang'
import apiSourceInfo from '@/utils/musicSdk/api-source-info'
import { useSettingValue } from '@/store/setting/hook'
import { useStatus, useUserApiList } from '@/store/userApi'
import Button from '../../components/Button'
import UserApiEditModal, { type UserApiEditModalType } from './UserApiEditModal'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
// import { importUserApi, removeUserApi } from '@/core/userApi'

const apiSourceList = apiSourceInfo.map(api => ({
  id: api.id,
  name: api.name,
  disabled: api.disabled,
}))

const useActive = (id: string, multiple = false) => {
  const activeId = useSettingValue('common.apiSource')
  const activeList = useSettingValue('common.apiSourceList')
  return useMemo(() => multiple ? activeList.includes(id) : activeId == id, [activeId, activeList, id, multiple])
}

const Item = ({ id, name, desc, statusLabel, change, multiple = false }: {
  id: string
  name: string
  desc?: string
  statusLabel?: string
  change: (id: string) => void
  multiple?: boolean
}) => {
  const isActive = useActive(id, multiple)
  const theme = useTheme()
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return (
    <CheckBox marginBottom={5} check={isActive} onChange={() => { change(id) }} need={!multiple}>
      <Text style={styles.sourceLabel}>
        {name}
        {
          desc ? <Text style={styles.sourceDesc} color={theme['c-500']} size={13}>  {desc}</Text> : null
        }
        {
          statusLabel ? <Text style={styles.sourceStatus} size={13}>  {statusLabel}</Text> : null
        }
      </Text>
    </CheckBox>
  )
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => apiSourceList.map(s => ({
    // @ts-expect-error
    name: t(`setting_basic_source_${s.id}`) || s.name,
    id: s.id,
  })), [t])
  const setApiSourceId = useCallback((id: string) => {
    setApiSource(id)
  }, [])
  const toggleUserApiSource = useCallback((id: string) => {
    toggleApiSourceEnabled(id)
  }, [])
  const userApiListRaw = useUserApiList()
  const getApiStatus = useStatus()
  const apiSourceListSetting = useSettingValue('common.apiSourceList')
  const userApiList = useMemo(() => {
    return userApiListRaw.map(api => {
      const apiStatus = getApiStatus(api.id)
      let statusLabel = ''
      if (apiSourceListSetting.includes(api.id)) {
        if (apiStatus.status) statusLabel = `[${t('setting_basic_source_status_success')}]`
        else if (apiStatus.message == 'initing') statusLabel = `[${t('setting_basic_source_status_initing')}]`
        else statusLabel = `[${t('setting_basic_source_status_failed')}]`
      }
      return {
        id: api.id,
        name: api.name,
        label: `${api.name}${statusLabel}`,
        desc: [/^\d/.test(api.version) ? `v${api.version}` : api.version].filter(Boolean).join(', '),
        statusLabel,
      }
    })
  }, [userApiListRaw, getApiStatus, apiSourceListSetting, t])

  const modalRef = useRef<UserApiEditModalType>(null)
  const handleShow = () => {
    modalRef.current?.show()
  }

  return (
    <SubTitle title={t('setting_basic_source')}>
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setApiSourceId} />)
        }
        {
          userApiList.map(({ id, name, desc, statusLabel }) => <Item name={name} desc={desc} statusLabel={statusLabel} id={id} key={id} change={toggleUserApiSource} multiple />)
        }
      </View>
      <View style={styles.btn}>
        <Button onPress={handleShow}>{t('setting_basic_source_user_api_btn')}</Button>
      </View>
      <UserApiEditModal ref={modalRef} />
    </SubTitle>
  )
})

const styles = createStyle({
  list: {
    flexGrow: 0,
    flexShrink: 1,
    // flexDirection: 'row',
    // flexWrap: 'wrap',
  },
  btn: {
    marginTop: 10,
    flexDirection: 'row',
  },
  sourceLabel: {

  },
  sourceDesc: {

  },
  sourceStatus: {

  },
})
