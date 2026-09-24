import { useEffect, useState } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import UpdateAlert from '@/components/common/UpdateAlert'
import { openUrl } from '@/utils/tools'
import { MultipleModeBarHost } from '@/components/common/MultipleModeBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { navigations } from '@/navigation'
import settingState from '@/store/setting/state'


interface Props {
  componentId: string
}


interface UpdateAlertInfo {
  title: string
  log: string
  updateUrl?: string
  confirmText: string
  cancelText: string
}

export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()
  const [updateInfo, setUpdateInfo] = useState<UpdateAlertInfo | null>(null)
  useEffect(() => {
    setComponentId(COMPONENT_IDS.home, componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps

    if (settingState.setting['player.startupPushPlayDetailScreen']) {
      navigations.pushPlayDetailScreen(componentId, true)
    }
    const showUpdate = (info: UpdateAlertInfo) => {
      setUpdateInfo(info)
    }
    global.app_event.on('showUserApiUpdate', showUpdate)
    return () => {
      global.app_event.off('showUserApiUpdate', showUpdate)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openUpdateUrl = () => {
    const url = updateInfo?.updateUrl
    if (!url) return
    setTimeout(() => {
      void openUrl(url)
    }, 300)
  }

  return (
    <PageContent>
      <MultipleModeBarHost>
        {
          isHorizontalMode
            ? <Horizontal />
            : <Vertical />
        }
      </MultipleModeBarHost>
      <UpdateAlert
        visible={updateInfo != null}
        title={updateInfo?.title ?? ''}
        log={updateInfo?.log ?? ''}
        confirmText={updateInfo?.confirmText}
        cancelText={updateInfo?.cancelText}
        onConfirm={openUpdateUrl}
        onHide={() => { setUpdateInfo(null) }}
      />
    </PageContent>
  )
}
