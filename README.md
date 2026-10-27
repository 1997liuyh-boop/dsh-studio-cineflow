# 影音工作室

基于 CineFlow 的分类推荐、地区/类别/日期筛选、片名搜索、统一片源管理、播放历史与局域网投屏。

这是独立的工作室插件仓库：只维护 影音工作室，可以独立克隆、构建和发布。

## 来源与感谢

本项目配合 [1997liuyh-boop/deepseek-harness](https://github.com/1997liuyh-boop/deepseek-harness) 使用；该宿主 **fork 自 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)**。感谢 DeepSeek 团队及上游贡献者。当前已验证的适配目标为 **dsh 0.2.1-rc.2（实验性）**，Windows 桌面端优先。

**源码改编**：本工作室基于 [incldue/CineFlow](https://github.com/incldue/CineFlow)。

上游锁定提交：b32fd8a6ba43dcde4494b7487ebf5d949f65a306。

感谢上游作者及贡献者提供的基础。本项目改动采用 MIT；内置或补丁涉及的上游许可与版权保持原文。完整来源见 [第三方声明](THIRD_PARTY_NOTICES.md) 和 [UPSTREAM.json](studios/cineflow/UPSTREAM.json)。另感谢 [debu8ger/CineFlow](https://github.com/debu8ger/CineFlow) 原作者及 [TVboxorg/TVbox](https://github.com/TVboxorg/TVbox) 的配置格式参考。

## 依赖与构建

运行时依赖共享基础库中的 **dsh-worktable ^0.6.0** 和 **dsh-studio-projects ^0.5.0**。先安装容器和运行时，再安装本工作室；停用某个工作室不会删除其他工作室或用户数据。

共享依赖由 [dsh-studio-library](https://github.com/1997liuyh-boop/dsh-studio-library) 独立维护。构建本仓库不需要克隆其他工作室，packages/sdk 已保留固定协议快照。需要 Node.js 22 或更新版本、npm、Git。

```powershell
git clone https://github.com/1997liuyh-boop/dsh-studio-cineflow.git
cd dsh-studio-cineflow
npm ci --ignore-scripts
npm ci --prefix studios/cineflow/app --ignore-scripts
npm run build
npm run check
npm test
npm run pack
```

业务源码、studio.json 和插件 package.json 位于 studios/cineflow。artifacts 生成 dsh-studio-cineflow-0.2.0.tgz 与 SHA256 清单；GitHub Actions 也提供完整安装包产物。使用实际桌面应用自带的 dsh CLI，在容器和共享运行时之后执行 plugin --profile desktop add <tgz绝对路径>，随后重启宿主；网页端使用 web profile。

宿主必须具备工作室桥接适配，兼容声明以 studio.json 为准。卸载和升级不清空用户数据。

## Windows 本机服务

完整 CineFlow 源码在 studios/cineflow/app。构建后运行 pwsh -File scripts/start-cineflow.ps1；可用 -ElectronPath 指定 Electron、-DataDirectory 指定外置数据目录、-Port 指定端口。宿主与服务使用相同的 DSH_STUDIO_CINEFLOW_DATA 目录。TMDB 凭据在应用右上角“TMDB 配置”手动录入，只保存在本机。片源可在管理页导入、去重和测速；外部源可用性会变化。详细功能、搜索行为与片源兼容边界见插件目录 README。

## 开发与更新

参见 [开发规范](CONTRIBUTING.md)、[插件说明](studios/cineflow/README.md) 和 [工作室控制协议](packages/sdk/CONTROL.md)。上游提交固定记录在 UPSTREAM.json；更新时在新检出中重放适配、验证本工作室，再递增插件版本。SDK 快照通过 SDK-SNAPSHOT.json 追踪，宿主更新不代表已验证兼容。
