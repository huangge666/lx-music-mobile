import GlassIconButton from '@/components/common/GlassIconButton'
import { useI18n } from '@/lang'
import { setNavActiveId } from '@/core/common'
import commonState from '@/store/common/state'
import { navigations } from '@/navigation'

/**
 * 设置直接打开，不再为一个辅助入口保留整套抽屉导航。
 */
export const MoreButton = () => {
  const t = useI18n()

  return (
    <GlassIconButton
      name="setting"
      label={t('nav_setting')}
      onPress={() => { setNavActiveId('nav_setting') }}
    />
  )
}

/** 音源始终从页头一键可达，不必逐层进入设置。 */
export const SourceButton = () => {
  const t = useI18n()
  return (
    <GlassIconButton
      name="slider"
      label={t('setting_source')}
      onPress={() => {
        const componentId = commonState.componentIds.home
        if (componentId) navigations.pushSourceManagerScreen(componentId)
      }}
    />
  )
}
