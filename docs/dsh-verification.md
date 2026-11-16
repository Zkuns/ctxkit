# DSH MVP 验证记录

日期：2026-11-16。交付插件 `ctxkit-dsh@0.1.1`；目标安装：DSH `0.2.2-rc.3`，Node `26.0.0`。最终 **56/56 项插件测试、27/27 项原有 Python 测试通过**，无 skipped。五个 legacy skills 和 29 份 Markdown 的链接校验通过。本轮不使用真实会话内容、凭据或模型完成整理。

## 已执行

- 插件 JavaScript 语法检查。
- 核心临时库测试：capture → checkpoint/session → 多主题、文档、关系、惰性 skill 草稿；来源校验、去重、无信息跳过、CAS 冲突、部分 journal 恢复、暂停和权限撤销。
- 适配器合成测试：新增回合事件、bounded first-request + recent-results source、显式模型路由、无 tools、scope/read-only/暂停/卸载、恢复范围、按需召回、分页与工具输出总预算。
- 原生后端集成：从 `DSH_INSTALL_DIR` 解析真实 `SandboxedFileSystem` 和 Cordis，虚构 session 的完整核心流程经原生 CAS 写入；拒绝新建覆盖和 read-only 写入。没有创建 profile 或真实会话。
- 原生注册器集成：真实 Cordis、Tools、Skills、SystemPrompt 注册、发现和读取 `ctxkit-recall`、合成回合触发 capture、显式 retry/status，以及卸载移除注册。模型流为固定虚构输出，不调用 API。
- 原有 27 项 Python installer/records 测试与五个 legacy skills、Markdown 链接校验。
- npm tarball 文件清单检查：仅 runtime、说明、双语元数据、原创 SVG 图标与许可证，无测试夹具、真实库或凭据。
- `plugin_manager install_bundle` 最终 tarball 安装返回版本 `0.1.1`、`application: applied`、无插件管理器 warnings；先前 live row 检查 `include:ctxkit` 为 active。安装后的 manifest、双语 locale、SVG 与默认 patch 已回读确认。插件自身配置仍为 `enabled: false`，未配置采集范围或模型，不会采集其他 session。包管理器输出有其他既存插件的 peer dependency 警告，本轮未变更这些包。

## 审查与修复

已进行独立核心测试审查和用户体验审查，修复：暂停/卸载时自持锁清理、状态区分“配置完成”与“允许采集”、当前 session retry 入口、元数据与正文整体输出预算、长回合优先保留首个用户任务与近期成果。原生注册器测试额外发现并修正 `skills.registerProvider` 必须接收 factory 的接口差异。

最终发布路径同时传递插件生命周期和当前 session 的取消信号，避免在 native writer 的异步操作期间取消失效。可选 session persistence 通过 `ctx.get` 发现，不依赖未声明的直接 Service 访问。

## 明确未验证

- 未选择、调用真实整理模型；不能据此宣称自动提取/主题归属的真实准确率。
- 未配置或启用用户真实库，未进行生产会话试用或全历史导入。
- 当前 agent 浏览器停在 DSH 公网地址的 Cloudflare Access 登录页；未完成插件管理页图标、双语显示和渲染验收，不以代码/安装成功替代视觉验收。
- 首版不提供设置向导或额外管理页面。启用需明确库目录、允许的工作区和 provider/model；这仍是首次使用的人工配置步骤。
- 不能保证未结束长回合或突然退出前保存；超过采集、文件和队列上限会报告限制。

后续应使用隔离的真实试用库，以一次正常开发 session 检查：是否遗漏重要成果、是否误建主题、是否正确保留未验证状态，以及下一次 session 能否按需接手。对真实案例观察到的问题修改提示和契约，而不是先扩展数据库或 UI。
