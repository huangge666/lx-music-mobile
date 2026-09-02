/**
 * lucide-react-native 深度导入的类型声明。
 *
 * 背景：Metro 0.80（RN 0.73）不支持 ESM tree-shaking，也不解析 package.json 的
 * exports 字段，从包根 barrel 导入会把全部 1700+ 图标打进 JS bundle（约 +1.9MB）。
 * 因此 src/components/common/Icon.tsx 改为逐图标从 dist/cjs/icons/<name> 深度导入。
 *
 * 该路径不在 lucide 的 exports 映射内，TypeScript 无法自动解析其类型，
 * 故用通配符环境模块声明补齐：默认导出即 Lucide 图标组件。
 *
 * 新增图标时无需修改本文件，直接
 * `import Xxx from 'lucide-react-native/dist/cjs/icons/xxx'` 即可。
 */
declare module 'lucide-react-native/dist/cjs/icons/*' {
  import type { LucideIcon } from 'lucide-react-native'

  const IconComponent: LucideIcon
  export default IconComponent
}
