import { memo, useCallback, useMemo } from 'react'
import { Switch, TouchableOpacity, View } from 'react-native'

import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useStatus, useUserApiList, state as userApiState } from '@/store/userApi'
import { removeUserApi, setUserApiAllowShowUpdateAlert } from '@/core/userApi'
import { toggleApiSourceEnabled, setApiSource, USER_API_SOURCE_LIMIT } from '@/core/apiSource'
import apiSourceInfo from '@/utils/musicSdk/api-source-info'
import settingState from '@/store/setting/state'
import { updateSetting } from '@/core/common'
import { confirmDialog, createStyle, toast } from '@/utils/tools'
import { BorderRadius, BorderWidths } from '@/theme'

/** 在线音源集合，用于把脚本声明的 sources 过滤成有对应文案的平台 */
const ONLINE_SOURCES = ['wy', 'tx', 'kw', 'kg', 'mg'] as const

const formatVersionName = (version: string) => {
  return /^\d/.test(version) ? `v${version}` : version
}

type SourceStatus = 'idle' | 'success' | 'initing' | 'failed'

/** 已启用音源的初始化状态，未启用时不展示 */
const StatusBadge = ({ status }: { status: SourceStatus }) => {
  const theme = useTheme()
  const t = useI18n()
  if (status == 'idle') return null

  const label = status == 'success'
    ? t('setting_basic_source_status_success')
    : status == 'initing'
      ? t('setting_basic_source_status_initing')
      : t('setting_basic_source_status_failed')
  const color = status == 'success' ? theme['c-primary'] : theme['c-font-label']

  return <Text size={11} color={color} style={styles.statusText}>{label}</Text>
}

/** 脚本支持的平台名称，跟随「源名称显示方式」设置切换真实名/别名 */
const useSourceNames = (sources?: LX.UserApi.UserApiSources) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const t = useI18n()

  return useMemo(() => {
    if (!sources) return ''
    return ONLINE_SOURCES
      .filter(source => sources[source])
      .map(source => t(`source_${sourceNameType}_${source}`))
      .join('、')
  }, [sources, sourceNameType, t])
}
/**
 * 单条音源卡片
 * — 右侧 Switch 作为唯一主操作，控制启用/停用
 * — 首选徽标标示当前主源（列表首位），与播放链路的取源顺序一致
 * — 更新提醒、移除作为次级动作放在卡片底部，避免和开关抢占视觉重心
 */
const ListItem = memo(({
  item,
  status,
  isPrimary,
  onToggle,
  onRemove,
  onChangeAllowShowUpdateAlert,
}: {
  item: LX.UserApi.UserApiInfo
  status: SourceStatus
  isPrimary: boolean
  onToggle: (id: string) => void
  onRemove: (id: string, name: string) => void
  onChangeAllowShowUpdateAlert: (id: string, enabled: boolean) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const activeList = useSettingValue('common.apiSourceList')
  const enabled = activeList.includes(item.id)
  const sourceNames = useSourceNames(item.sources)
  const meta = [item.version ? formatVersionName(item.version) : '', item.author].filter(Boolean).join(' · ')
  const subtitle = [sourceNames, meta].filter(Boolean).join('  ')

  return (
    <View style={[
      styles.item,
      {
        backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(118, 118, 128, 0.06)',
        borderColor: enabled ? theme['c-primary-alpha-600'] : theme['c-border-background'],
      },
    ]}>
      <View style={styles.mainRow}>
        <View style={[styles.iconBubble, { backgroundColor: theme['c-primary-background'] }]}>
          <Icon name="music_time" size={18} color={theme['c-primary']} />
        </View>
        <View style={styles.info}>
          <Text size={15} style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.metaRow}>
            {isPrimary ? (
              <View style={styles.primaryBadge}>
                <Icon name="checkbox-marked" size={12} color={theme['c-primary']} />
                <Text size={12} color={theme['c-primary']}>{t('setting_source_primary')}</Text>
              </View>
            ) : null}
            <StatusBadge status={status} />
            {subtitle
              ? <Text size={12} color={theme['c-font-label']} numberOfLines={1} style={styles.metaText}>{subtitle}</Text>
              : null}
          </View>
        </View>
        <Switch
          value={enabled}
          onValueChange={() => { onToggle(item.id) }}
          trackColor={{
            false: theme.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(120, 120, 128, 0.16)',
            true: theme['c-primary-alpha-400'],
          }}
          thumbColor={enabled ? theme['c-primary'] : theme.isDark ? '#d1d1d6' : '#ffffff'}
          ios_backgroundColor={theme.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(120, 120, 128, 0.16)'}
        />
      </View>
      <View style={[styles.footerRow, { borderTopColor: theme['c-border-background'] }]}>
        <TouchableOpacity
          style={styles.footerBtn}
          activeOpacity={0.6}
          onPress={() => { onChangeAllowShowUpdateAlert(item.id, !item.allowShowUpdateAlert) }}
          accessibilityRole="switch"
          accessibilityState={{ checked: item.allowShowUpdateAlert }}
        >
          <Icon
            name={item.allowShowUpdateAlert ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={14}
            color={item.allowShowUpdateAlert ? theme['c-primary'] : theme['c-font-label']}
          />
          <Text size={12} color={item.allowShowUpdateAlert ? theme['c-primary'] : theme['c-font-label']}>
            {t('user_api_allow_show_update_alert')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerBtn}
          activeOpacity={0.6}
          onPress={() => { onRemove(item.id, item.name) }}
          accessibilityRole="button"
        >
          <Icon name="close" size={13} color={theme['c-font-label']} />
          <Text size={12} color={theme['c-font-label']}>{t('list_remove')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})
export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const userApiList = useUserApiList()
  const getApiStatus = useStatus()
  const apiSourceListSetting = useSettingValue('common.apiSourceList')
  // 主源始终是启用列表的首位，和 toggleApiSourceEnabled 的写入顺序保持一致
  const primaryId = apiSourceListSetting[0] ?? ''

  const list = useMemo(() => {
    return userApiList.map(api => {
      let status: SourceStatus = 'idle'
      if (apiSourceListSetting.includes(api.id)) {
        const apiStatus = getApiStatus(api.id)
        if (apiStatus.status) status = 'success'
        else if (apiStatus.message == 'initing') status = 'initing'
        else status = 'failed'
      }
      return { api, status }
    })
  }, [userApiList, getApiStatus, apiSourceListSetting])

  const handleToggle = useCallback((id: string) => {
    const ok = toggleApiSourceEnabled(id)
    if (!ok) {
      toast(t('setting_basic_source_max_tip', { num: USER_API_SOURCE_LIMIT }))
    }
  }, [t])
  const handleRemove = useCallback(async(id: string, name: string) => {
    const confirm = await confirmDialog({
      message: global.i18n.t('user_api_remove_tip', { name }),
      cancelButtonText: global.i18n.t('cancel_button_text_2'),
      confirmButtonText: global.i18n.t('confirm_button_text'),
      bgClose: false,
    })
    if (!confirm) return

    // 先从启用列表中移除，避免残留无效 id
    const nextList = settingState.setting['common.apiSourceList'].filter(item => item != id)
    const nextPrimary = settingState.setting['common.apiSource'] == id
      ? (nextList[0] ?? '')
      : settingState.setting['common.apiSource']
    if (
      nextList.length != settingState.setting['common.apiSourceList'].length ||
      nextPrimary != settingState.setting['common.apiSource']
    ) {
      updateSetting({
        'common.apiSourceList': nextList,
        'common.apiSource': nextPrimary,
      })
    }

    void removeUserApi([id]).finally(() => {
      if (settingState.setting['common.apiSource'] == id || !settingState.setting['common.apiSource']) {
        // 回退顺序：剩余启用源 → 内置可用源 → 任意已导入源
        let backApiId: string | undefined = nextList[0]
        if (!backApiId) backApiId = apiSourceInfo.find(api => !api.disabled)?.id
        if (!backApiId) backApiId = userApiState.list[0]?.id
        if (backApiId) setApiSource(backApiId)
        else updateSetting({ 'common.apiSource': '', 'common.apiSourceList': [] })
      }
    })
  }, [])

  const handleChangeAllowShowUpdateAlert = useCallback((id: string, enabled: boolean) => {
    void setUserApiAllowShowUpdateAlert(id, enabled)
  }, [])

  if (!list.length) {
    return (
      <View style={[styles.emptyCard, { borderColor: theme['c-border-background'] }]}>
        <View style={[styles.emptyIcon, { backgroundColor: theme['c-primary-background'] }]}>
          <Icon name="download-2" size={20} color={theme['c-primary']} />
        </View>
        <Text style={styles.emptyText} color={theme['c-font-label']} size={14}>
          {t('user_api_empty')}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.list}>
      {
        list.map(({ api, status }) => (
          <ListItem
            key={api.id}
            item={api}
            status={status}
            isPrimary={api.id == primaryId}
            onToggle={handleToggle}
            onRemove={handleRemove}
            onChangeAllowShowUpdateAlert={handleChangeAllowShowUpdateAlert}
          />
        ))
      }
    </View>
  )
})
const styles = createStyle({
  list: {
    gap: 12,
  },
  item: {
    borderRadius: BorderRadius.large,
    borderWidth: BorderWidths.thin,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  info: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 10,
    gap: 4,
  },
  name: {
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  metaText: {
    flexShrink: 1,
  },
  statusText: {
    fontWeight: '500',
    flexShrink: 0,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: BorderWidths.hairline,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingRight: 4,
  },
  emptyCard: {
    borderRadius: BorderRadius.large,
    borderWidth: BorderWidths.thin,
    borderStyle: 'dashed',
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
})


