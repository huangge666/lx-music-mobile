import { importUserApi } from '@/core/userApi'
import { readFile } from '@/utils/fs'
import { log } from '@/utils/log'
import { toast } from '@/utils/tools'


export const handleImportScript = async(script: string): Promise<boolean> => {
  try {
    if (typeof script != 'string' || !script.length) throw new Error('Empty script')
    if (script.length > 9_000_000) throw new Error('Too large script')
    await importUserApi(script)
    toast(global.i18n.t('user_api_import_success_tip'))
    return true
  } catch (error: any) {
    log.error(error.stack)
    toast(global.i18n.t('user_api_import_failed_tip', { message: error.message }), 'long')
    return false
  }
}

export const handleImportLocalFile = async(path: string): Promise<boolean> => {
  try {
    const script = await readFile(path)
    if (script == null) throw new Error('Read file failed')
    return await handleImportScript(script)
  } catch (error: any) {
    log.error(error.stack)
    toast(global.i18n.t('user_api_import_failed_tip', { message: error.message }), 'long')
    return false
  }
}

