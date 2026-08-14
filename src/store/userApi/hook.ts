import { useEffect, useState } from 'react'
import { state } from './state'
import { event } from './event'

export const useStatus = () => {
  const [statusMap, update] = useState(state.status)

  useEffect(() => {
    // 必须将监听器引用保存下来，否则 off 时传入新的空函数
    // 无法正确移除监听器，会导致重复监听与内存泄漏。
    const handleStatusChange = ({ apiId, status, message }: { apiId: string, status: boolean, message?: string }) => {
      update(oldStatusMap => ({ ...oldStatusMap, [apiId]: { status, message } }))
    }
    event.on('status_changed', handleStatusChange)
    return () => {
      event.off('status_changed', handleStatusChange)
    }
  }, [])

  return (apiId: string) => statusMap[apiId] ?? { status: false, message: 'initing' }
}

export const useUserApiList = () => {
  const [value, update] = useState(state.list)

  useEffect(() => {
    event.on('list_changed', update)
    return () => {
      event.off('list_changed', update)
    }
  }, [])

  return value
}
