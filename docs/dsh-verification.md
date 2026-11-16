# DSH MVP 验证记录

## 0.3：存储位置设置

日期：2026-11-16；目标 DSH `0.2.2-rc.3`。**101/101 项插件测试、28/28 项 Python 测试通过**，无 skipped；五个 skills、29 份 Markdown 校验通过。

- 原生集成使用安装版 Cordis Loader、SettingsForms、ConfigEditor 和临时虚构 profile/home，不是 stub 配置写入。验证了晚到 Settings、准确 namespace 和序列化 schema、保存 root + enabled:false、保留其他字段、revision 冲突和无效/符号链接/文件路径在保存前拒绝。
- 在途旧库查询在位置切换时被取消，旧工具和缓冲来源失效，未把旧回合内容写入新库；选择位置不调用模型、不创建或写入知识库。
- Client 纯请求与静态测试覆盖可选 Settings、不选会话也可设置、精确 namespace 投影、无权限/缺失 provider、冲突/拒绝/未知结果、响应必须匹配请求位置、连接/权限变化隔离、原生目录列表与 native picker 的取消信号。没有模拟 React/DOM 或声称界面验收。
- 目录列表复用原生 Host picker，客户端只提供自己的有界选择界面；不创建工作区、目录或浏览器本地文件句柄。手动路径输入保留为替代方式。
- 独立 UI/UX 静态审查修复了 native picker 未传 AbortSignal 的取消问题，并延长交互超时至两分钟；已复核保存回执、访问范围、标签/错误与焦点处理，静态证据下无剩余已识别 P1/P2。
- 新增 Schema peer 后，文档校验发现误扫描下载依赖的 README；现明确跳过 node_modules 等环境目录，并新增发现范围回归测试，不忽略项目自身文档。

0.3.1 增加精确、无敏感值的不可用诊断。安装返回 applied，随后在现有 GUI 实页复现 `CTXKIT_SETTINGS_DESCRIPTOR_MISSING`：Settings 响应成功，但未返回本插件配置描述符；刷新、升级和单独重载未解决。不能据此宣称设置入口可用。用户已明确授权重启当前 DSH 以排除宿主旧模块缓存，重启后仍需继续验证。

真实目录选择、生产 profile 保存、界面焦点/主题/响应式及真实模型采集需分别验收。本轮没有替用户选择真实存储位置或启用采集。

## 0.2：浏览入口与 Agent 自主召回

日期：2026-11-16；目标 DSH `0.2.2-rc.3`。**82/82 项插件测试、27/27 项 Python 测试通过**，包括安装版原生 Commands、Cordis/Tools/Skills 和文件沙箱，无 skipped。五个 legacy skills 与 29 份 Markdown 链接校验通过。

- `recall_context` 直接向 Agent 提供历史查询；普通任务依赖既有背景时主动调用，不要求用户命名插件或先调用 skill。断言工具注册、自然使用指引、共享查询一致性、只读与无额外模型调用；没有用真实模型验证每一次自主调用决策。
- 原生“上下文库”页面使用 `sidebar.panellist` / `main` slots、宿主 locale/theme，以及当前真实会话的访问范围。topics/sessions/status/read 与 Agent 走相同 Host 查询；native Commands 测试确认接收到真实 loaded Session 的对象身份，并验证 command 审计与卸载。
- 查询测试覆盖超过 search top30 的分页、Unicode 总字节预算、连续游标、近期会话排序、来源/关系/子文档导航、精确状态筛选、未配置/拒绝/错误、await 后 scope 撤销及取消。没有读取个人库或真实聊天。
- Client 测试只覆盖 lazy-loader 注册、locale 同步、纯请求生命周期、超时/过期响应/卸载和静态契约；不执行 React 组件、不模拟 DOM，不把这些结果宣称为浏览器渲染验收。
- 独立 UI/UX 静态审查已完成并修复关系方向/类型与端点导航、分页键盘焦点恢复、来源阶段按钮、截断提示，以及旧 search/read/status 在 await 后缺失的 scope 复查。静态证据下无剩余已识别 P1/P2。
- 最终 `0.2.0` tarball 已通过 `plugin_manager` 安装，返回 `application: applied`、无插件管理器 warnings。安装版 manifest/client export 已回读；安装的 Client artifact 与源码 SHA-256 一致，语法通过。此客户端为直接交付的 lazy-factory artifact，不依赖重建 DSH shell。
- 安装后重新访问现有 GUI URL，仍重定向到 Cloudflare Access 登录页。因此亮暗主题、响应式布局、浏览器焦点行为和已有资料阅读流程仍未完成实页验收；不以模拟页面截图替代。此次未配置实际库或整理模型，也未启用真实采集。

原生 command 会把有界查询结果写入 session 审计日志，但不会送入模型聊天历史；查询不修改库。首次启用仍需要手动指定库、工作区范围和模型；0.2 浏览页不是设置向导。随后用户报告入口未出现；仅重载本插件并刷新后，用户确认已出现。该反馈证明当时入口可见，不等于整个资料阅读流程的自动浏览器验收。

## 0.1 历史交付记录

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
