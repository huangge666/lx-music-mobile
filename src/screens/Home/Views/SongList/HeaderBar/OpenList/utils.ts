import { type Source } from '@/store/songlist/state'

/**
 * 各平台歌单链接的域名标识。
 * 匹配规则为「等于该域名或者是其子域名」，例如 y.qq.com 可以覆盖
 * i.y.qq.com、c6.y.qq.com 等短链域名。
 */
const SOURCE_HOSTS: Array<{ source: Source, hosts: string[] }> = [
  { source: 'wy', hosts: ['music.163.com', '163cn.tv'] },
  { source: 'tx', hosts: ['y.qq.com'] },
  { source: 'kg', hosts: ['kugou.com'] },
  { source: 'kw', hosts: ['kuwo.cn'] },
  { source: 'mg', hosts: ['migu.cn'] },
]

// 链接中可能携带的协议与主机名提取正则
const URL_REGEXP = /https?:\/\/([^/?#\s"']+)/i

// 从 App 分享的整段文本中提取链接（允许链接被中文或其他描述文字包裹）
const URL_IN_TEXT_REGEXP = /https?:\/\/[^\s"'<>]+/i

// 分享文本粘贴后，链接尾部常跟有平台附带的标点，需要剔除
const TRAILING_CHARS_REGEXP = /[。，；、？！…\s"'<>（）()【】《》、.,;?!]+$/u

/**
 * 从输入文本中提取第一个有效的 http(s) 链接
 * @param text 原始输入文本（可能是完整分享文案或纯链接）
 */
export const extractLink = (text: string): string | null => {
  const result = URL_IN_TEXT_REGEXP.exec(text)
  if (!result) return null
  return result[0].replace(TRAILING_CHARS_REGEXP, '')
}

/**
 * 根据链接域名识别对应的音源平台
 * @param link 从输入中提取的链接
 */
export const matchSourceByLink = (link: string): Source | null => {
  const host = URL_REGEXP.exec(link)?.[1]?.toLowerCase()
  if (!host) return null
  for (const { source, hosts } of SOURCE_HOSTS) {
    for (const targetHost of hosts) {
      if (host === targetHost || host.endsWith(`.${targetHost}`)) return source
    }
  }
  return null
}

/**
 * 解析打开歌单的输入内容：
 * - 若输入包含可识别的平台链接，则自动返回该平台作为来源，并返回提取后的纯链接
 * - 否则按传入的当前来源解析，原样返回输入（纯歌单 ID、酷狗码或未知链接）
 * @param text 用户输入的原始文本
 * @param fallbackSource 当前选中的歌单来源
 */
export const parseSonglistInput = (text: string, fallbackSource: Source): { source: Source, id: string } => {
  const input = text.trim()
  const link = extractLink(input)
  if (link) {
    const source = matchSourceByLink(link)
    // 识别到平台时传纯链接给 SDK，避免分享文案中的其他文本干扰 SDK 的链接解析正则
    if (source) return { source, id: link }
    return { source: fallbackSource, id: link }
  }
  return { source: fallbackSource, id: input }
}
