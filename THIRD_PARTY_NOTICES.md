# 来源与第三方声明

本项目配合 [1997liuyh-boop/deepseek-harness](https://github.com/1997liuyh-boop/deepseek-harness) 使用；该宿主 **fork 自 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)**。感谢 DeepSeek 团队及上游贡献者。当前已验证的适配目标为 **dsh 0.2.1-rc.2（实验性）**，Windows 桌面端优先。

**源码改编**：本工作室基于 [incldue/CineFlow](https://github.com/incldue/CineFlow)。

上游锁定提交：b32fd8a6ba43dcde4494b7487ebf5d949f65a306。

本项目改动采用 MIT；内置或补丁涉及的上游许可与版权保持原文。

CineFlow 原 MIT 许可及 Copyright (c) 2026 debu8ger 保留于 app/LICENSE；另感谢 https://github.com/debu8ger/CineFlow。片源配置格式参考 https://github.com/TVboxorg/TVbox ，当前支持 CMS JSON/XML，不包含 CSP/JAR 引擎。第三方地址收录不表示可用性或媒体内容授权。

共享容器与 SDK 来源于 https://github.com/1997liuyh-boop/dsh-studio-library，其中容器改编自 https://github.com/Aisland-SJL/dsh-worktable 。感谢以上作者和所有开源依赖贡献者。

**v0.3.0 新增**：播放器外壳使用 [ArtPlayer](https://github.com/zhw2590582/ArtPlayer)（MIT，Copyright (c) Harvey Zhao）。采集站聚合搜索、片源健康度、片源订阅（LibreTV-SourceList / TVBox）与直播 IPTV（M3U / XMLTV）参考 [bestZwei/LibreTV-Next](https://github.com/bestZwei/LibreTV-Next) 的功能设计与公开数据格式，代码为独立实现，未复制其 AGPL-3.0 源码与测试。内置采集站地址于 2026-11-13 实测可搜索，收录不表示长期可用或内容授权。
