# dsh-studio-cineflow

[English](README.md)

**仓库名称：** `dsh-studio-cineflow`

**仓库描述：**CineFlow 影音工作室，提供电影和节目发现、片源管理、播放续播与局域网投屏。

`dsh-studio-cineflow` 将 [CineFlow](https://github.com/incldue/CineFlow) 适配为独立安装的 DSH 工作室。本插件负责嵌入式 CineFlow 页面和桥接接入；DSH 工作台负责工作室容器，外部 CineFlow 服务及其数据仍独立管理。

## 功能与特性

- 浏览电影、剧集和动漫的推荐与分类片库。
- 顶部搜索并发查询全部采集站（每站最多 5 页），同名作品跨来源合并为一张卡片，剧集的各篇章 / 季单独列出，解说与预告折叠显示。
- 作品面板对每个来源测速并排序，列出全部线路与剧集；配置 TMDB 后补充评分、简介与高清海报。
- 按地区、类型、日期范围、热度、评分和上映顺序筛选 TMDB 片库。
- ArtPlayer 播放器：上一集 / 下一集、自动连播、片头片尾标记与跳过、播放中换源（保留集数与进度），播放失败时自动弹出换源。
- 片源健康度：搜索时连续失败的片源按 30 分钟、24 小时、长期阶梯自动停用，可单个或全部恢复。
- 片源订阅：支持 LibreTV 源列表 JSON 与 TVBox 配置，定期静默更新，自动跳过成人内容；首次启动内置 3 个实测可用的公开订阅（可删除，删除后不再补回）；可导出当前片源；仍可导入、测速和删除自定义片源。
- 直播 IPTV：M3U 直播源、分组与搜索、收藏与最近观看、XMLTV 节目单、测活排序，频道在应用内播放器中切换。
- 保存播放历史，采集站来源直接断点续播。
- 将播放投送到同一局域网内的兼容设备。
- 依据真实状态显示服务、片源和播放错误，不用示例数据替代失败状态。
- 窄窗口下保留可用布局，片单、详情和设置使用内部滚动。

## 安装

本仓库在 `package.json` 的 `dsh.bundle.patch` 中声明 DSH 插件包。请使用 DSH Desktop 插件管理器，先添加控制包，再添加以下固定版本来源：

```text
github:1997liuyh-boop/dsh-studio-library#v0.1.3
github:1997liuyh-boop/dsh-studio-cineflow#v0.3.0
```

确认插件管理器显示 `dsh-studio-cineflow` 版本 `0.3.0`，然后打开 CineFlow。本插件要求兼容的 `dsh-worktable ^0.6.0` 和 `dsh-studio-projects ^0.5.0`，由控制包提供。

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

应用源码来自 [incldue/CineFlow](https://github.com/incldue/CineFlow)，固定提交为 `b32fd8a6ba43dcde4494b7487ebf5d949f65a306`，版本 `3.4.4`，采用 MIT 许可。聚合搜索、片源健康度、订阅与直播功能参考 [LibreTV-Next](https://github.com/bestZwei/LibreTV-Next) 的设计与公开数据格式，代码为独立实现，未包含其 AGPL-3.0 代码。适配记录和锁定信息见 [UPSTREAM.json](UPSTREAM.json)，第三方声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。本 DSH 适配代码采用 MIT 许可，详见 [LICENSE](LICENSE)。
