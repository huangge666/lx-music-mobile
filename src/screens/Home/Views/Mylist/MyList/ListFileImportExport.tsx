import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import { LXM_FILE_EXT_RXP } from '@/config/constant'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { handleExportList, handleImportList } from '@/core/listImportExport'

export interface SelectInfo {
  action: 'import' | 'export'
}
const initSelectInfo = {}

export interface ListImportExportType {
  import: () => void
  export: () => void
}

export default forwardRef<ListImportExportType, {}>((props, ref) => {
  const [visible, setVisible] = useState(false)
  const choosePathRef = useRef<ChoosePathType>(null)
  const selectInfoRef = useRef<SelectInfo>((initSelectInfo as SelectInfo))

  useImperativeHandle(ref, () => ({
    import() {
      selectInfoRef.current.action = 'import'
      if (visible) {
        choosePathRef.current?.show({
          title: global.i18n.t('list_import_part_desc'),
          dirOnly: false,
          filter: LXM_FILE_EXT_RXP,
        })
      } else {
        setVisible(true)
        requestAnimationFrame(() => {
          choosePathRef.current?.show({
            title: global.i18n.t('list_import_part_desc'),
            dirOnly: false,
            filter: LXM_FILE_EXT_RXP,
          })
        })
      }
    },
    export() {
      selectInfoRef.current.action = 'export'
      if (visible) {
        choosePathRef.current?.show({
          title: global.i18n.t('list_export_part_desc'),
          dirOnly: true,
          filter: LXM_FILE_EXT_RXP,
        })
      } else {
        setVisible(true)
        requestAnimationFrame(() => {
          choosePathRef.current?.show({
            title: global.i18n.t('list_export_part_desc'),
            dirOnly: true,
            filter: LXM_FILE_EXT_RXP,
          })
        })
      }
    },
  }))


  const onConfirmPath = (path: string) => {
    switch (selectInfoRef.current.action) {
      case 'import':
        void handleImportList(path)
        break
      case 'export':
        void handleExportList(path)
        break
    }
  }

  return (
    visible
      ? <ChoosePath ref={choosePathRef} onConfirm={onConfirmPath} />
      : null
  )
})
