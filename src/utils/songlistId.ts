import musicSdk from '@/utils/musicSdk'

/** 复用 SDK 的直链规则；不把酷狗分享码、专辑或波点收藏当成普通歌单 ID。 */
export const normalizeSonglistId = (id: string, source: LX.OnlineSource): string => {
  const input = id.trim()
  const rules = musicSdk[source]?.songList.regExps
  if (!rules) return input
  if (source == 'kw') {
    if (input.includes('/bodian/')) return input
    if (input.startsWith('digest-8__')) return input.slice('digest-8__'.length)
  }
  if (source == 'kg') {
    if (!input.includes('special/single/')) return input
    const specialId = rules.listDetailLink.exec(input)?.[1]
    return specialId ? `id_${specialId}` : input
  }
  if (source == 'mg') {
    const queryId = /(?:playlistId|id)=(\d+)/.exec(input)?.[1]
    if (queryId && /\/playlist[/?]/.test(input)) return queryId
  }
  // 网易私人歌单的 ### 授权后缀仍交给 SDK，不能在统一身份时丢失其刷新条件。
  const [link, ...authorization] = source == 'wy' ? input.split('###') : [input]
  const alternateId = 'listDetailLink2' in rules ? rules.listDetailLink2.exec(link)?.[1] : undefined
  const canonical = rules.listDetailLink.exec(link)?.[1] ?? alternateId ?? link
  return authorization.length ? `${canonical}###${authorization.join('###')}` : canonical
}

export const getSonglistId = (id: string, source: LX.OnlineSource) => `${source}__${normalizeSonglistId(id, source)}`

/** 旧版存纯 ID 或完整链接；新旧格式都按平台比对，不改写已有用户数据。 */
export const isImportedSonglist = (
  list: Pick<LX.List.UserListInfo, 'source' | 'sourceListId'>,
  id: string,
  source: LX.OnlineSource,
): boolean => {
  if (!list.sourceListId) return false
  const prefix = `${source}__`
  if (list.sourceListId.startsWith(prefix)) return getSonglistId(list.sourceListId.slice(prefix.length), source) == getSonglistId(id, source)
  return list.source == source && getSonglistId(list.sourceListId, source) == getSonglistId(id, source)
}
