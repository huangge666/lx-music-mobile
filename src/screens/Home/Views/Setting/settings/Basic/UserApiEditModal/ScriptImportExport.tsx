import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import { USER_API_SOURCE_FILE_EXT_RXP } from '@/config/constant'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { handleImportLocalFile } from './action'

export interface ScriptImportExportType {
  import: () => void
}

export default forwardRef<ScriptImportExportType, {}>((props, ref) => {
  const [visible, setVisible] = useState(false)
  const choosePathRef = useRef<ChoosePathType>(null)

  useImperativeHandle(ref, () => ({
    import() {
      if (visible) {
        choosePathRef.current?.show({
          title: global.i18n.t('user_api_import_desc'),
          dirOnly: false,
          filter: USER_API_SOURCE_FILE_EXT_RXP,
        })
      } else {
        setVisible(true)
        requestAnimationFrame(() => {
          choosePathRef.current?.show({
            title: global.i18n.t('user_api_import_desc'),
            dirOnly: false,
            filter: USER_API_SOURCE_FILE_EXT_RXP,
          })
        })
      }
    },
  }))


  const onConfirmPath = (path: string) => {
    void handleImportLocalFile(path)
  }

  return (
    visible
      ? <ChoosePath ref={choosePathRef} onConfirm={onConfirmPath} />
      : null
  )
})
