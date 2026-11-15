import { useRef } from 'react'
import GlassIconButton from '@/components/common/GlassIconButton'
import { useI18n } from '@/lang'
import Modal, { type ModalType } from './Modal'
import ActionSheet, { type ActionSheetType } from '@/components/common/ActionSheet'
import ListFileImportExport, { type ListImportExportType } from '../ListFileImportExport'

/**
 * 歌单导入统一入口：粘贴在线链接或选择本地歌单文件。
 * 文件导入沿用原有单歌单、全歌单及旧版备份格式，去掉备份页不会切断这个能力。
 */
export default () => {
  const t = useI18n()
  const modalRef = useRef<ModalType>(null)
  const actionSheetRef = useRef<ActionSheetType>(null)
  const fileImportRef = useRef<ListImportExportType>(null)

  const showImport = () => {
    actionSheetRef.current?.show({
      header: { title: t('list_import_songlist'), icon: 'add-music' },
      items: [
        { action: 'link', label: t('list_import_link'), icon: 'add-music' },
        { action: 'file', label: t('list_import_file'), icon: 'sd-card' },
      ],
    })
  }

  return (
    <>
      <GlassIconButton
        name="add-music"
        label={t('list_import_songlist')}
        onPress={showImport}
      />
      <Modal ref={modalRef} />
      <ListFileImportExport ref={fileImportRef} />
      <ActionSheet ref={actionSheetRef} onPress={action => {
        if (action == 'link') modalRef.current?.show()
        else if (action == 'file') fileImportRef.current?.import()
      }} />
    </>
  )
}
