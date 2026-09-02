### 优化

- 安装包体积优化：arm64-v8a 安装包从约 14MB 缩小到约 12.9MB
- Lucide 图标改为按图标深度导入，避免 Metro 打包时把全部 1700+ 图标打进 JS 包（JS 包从 5.06MB 缩小到 3.39MB）
- 移除已废弃的图标字体文件（MaterialCommunityIcons.ttf、icomoon.ttf，合计约 1.1MB）
- Release 构建启用资源收缩（shrinkResources），并仅保留中英文语言资源
- 移除不再使用的 react-native-vector-icons 依赖

### 其他

- 清理全量 TypeScript 与 ESLint 问题，修复发布脚本 ESM 语法兼容问题
