# dsh-studio-cineflow

[English](README.md)

**仓库名称：** `dsh-studio-cineflow`

**仓库描述：**CineFlow 影音工作室，提供电影和节目发现、片源管理、播放续播与局域网投屏。

`dsh-studio-cineflow` 将 [CineFlow](https://github.com/incldue/CineFlow) 适配为独立安装的 DSH 工作室。本插件负责嵌入式 CineFlow 页面和桥接接入；DSH 工作台负责工作室容器，外部 CineFlow 服务及其数据仍独立管理。

## 功能与特性

- 浏览电影、剧集和动漫的推荐与分类片库。
- 按片名、地区、类型、日期范围、热度、评分和上映顺序搜索筛选。
- 导入、去重、测速、启用和删除片源，同时保留线路元数据。
- 保存播放历史、断点续播，并在片源支持时选择字幕和清晰度。
- 将播放投送到同一局域网内的兼容设备。
- 依据真实状态显示服务、片源和播放错误，不用示例数据替代失败状态。
- 窄窗口下保留可用布局，片单、详情和设置使用内部滚动。

## 安装

本仓库在 `package.json` 的 `dsh.bundle.patch` 中声明 DSH 插件包。请使用 DSH Desktop 插件管理器，先添加控制包，再添加以下固定版本来源：

```text
github:1997liuyh-boop/dsh-studio-library#v0.1.3
github:1997liuyh-boop/dsh-studio-cineflow#v0.2.7
```

确认插件管理器显示 `dsh-studio-cineflow` 版本 `0.2.2`，然后打开 CineFlow。本插件要求兼容的 `dsh-worktable ^0.6.0` 和 `dsh-studio-projects ^0.5.0`，由控制包提供。

Windows 本地开发和服务检查需要 Node.js 22 与 npm：

```sh
npm install --include=dev --legacy-peer-deps
npm run build
npm run check
```

Windows 服务启动脚本是 `scripts/start.ps1`，需要 PowerShell 7.4+。插件不捆绑 Electron，请使用 `-ElectronPath` 或 `DSH_STUDIO_ELECTRON` 指定本机 Electron。共享工作库可以通过 `node scripts/build.mjs cineflow` 构建本仓库。

## 要求与限制

TMDB 凭据、片源凭据、外部媒体服务和投屏设备由用户自行配置。没有 TMDB 凭据时使用公开片单模式，不伪造推荐结果。片源可能失效或要求认证；投屏要求兼容设备与本机处于同一网络。本插件不包含推流密钥，不自动开播，也不会安装外部 Electron 服务和数据库。

## 来源与许可

应用源码来自 [incldue/CineFlow](https://github.com/incldue/CineFlow)，固定提交为 `b32fd8a6ba43dcde4494b7487ebf5d949f65a306`，版本 `3.4.4`，采用 MIT 许可。适配记录和锁定信息见 [UPSTREAM.json](UPSTREAM.json)，第三方声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。本 DSH 适配代码采用 MIT 许可，详见 [LICENSE](LICENSE)。
