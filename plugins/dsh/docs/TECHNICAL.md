# CtxKit for DSH

中文 / English · Native Host + Web MVP · DSH **0.2.2-rc.3**

## 做什么 / What it does

正常使用 DSH session，插件在新增回合结束后检查是否产生实质成果。值得保留的内容先形成带事件序号来源的阶段记录，再整理到主题入口、详细文档、带理由的主题关系或惰性操作草稿。它不要求主 agent 记得写笔记，也不执行你的项目任务。

Work normally in opted-in DSH sessions. Completed turns are checked for durable work, captured as sourced checkpoints, then organized into topic overviews, detailed knowledge, evidenced relationships and inert procedure drafts. A tool-free auxiliary model performs extraction and organization. It cannot deploy, publish or execute generated skills.

## 当前交互 / Current interaction

浏览器和 DSH 在同一台 Mac 时，点击 **选择目录** 直接弹出 **macOS 系统目录窗口**；在系统窗口确认即完成下述接入，取消不保存。不是上传目录，也不再打开网页目录列表。

配置后点击 **在 Finder 中打开** 查看、编辑或管理上下文文件；网页不再呈现文件树。**Sessions** 继续单独搜索已采集会话。Finder 是用户自己的系统文件管理器，手动删除或移动资料不享有插件的版本冲突保护；请谨慎操作。

Native desktop actions are macOS-only, browser-owner-only, and require writable Settings authority. They open on the DSH host display, so this workflow assumes the browser and DSH run on the same Mac. No global directory-picker service is replaced. The model/capture opt-in, current-workspace scope and file policy below remain unchanged.

## 安装与启用 / Install and opt in

在 DSH 的插件管理中添加本目录（或打包后的 npm tarball）。通过 agent 安装时使用 DSH 的 `plugin_manager`，不要自行重写用户 profile。CtxKit 自身不定义安装脚本，也不下载 embedding 模型。官方原生选择器的传递依赖 Koffi 带有构建脚本；macOS 目录选择不依赖其 Windows 组件，本轮没有批准或运行该脚本。

安装默认不采集。打开侧栏 **上下文库 / Context Library**，选中真实会话，点击“选择目录”，在 macOS 系统窗口确认一个已有目录。取消不作修改；没有路径配置表单、环境变量或第二个保存按钮。已有旧版目录可直接“使用此目录”完成接入。

确认前明确展示当前工作目录与模型政策：**仅此工作目录的新成果**会写入所选库，使用各会话当前选定的模型整理，会产生额外模型调用。目录属于运行 DSH 的机器，不是远程浏览器本机。推荐专用空目录；不导入历史聊天、不搬移旧资料、不覆盖无标记文档。

原生 Settings/configEditor 在同一个带 revision 的更新里保存 root、enabled:true、allowedWorkspaces:[当前 cwd]、useSessionModel:true、exactWorkspaces:true。没有先存目录再补授权的半完成步骤；更换目录或重新接入会将采集范围设为当前工作目录。实际模型从 Host 中该真实 Session 的 Agent.model.current() 获取，不从显示名称猜测，也不会缺省回退另一个服务商。

浏览仅依赖已选择的目录与授权范围，不再要求采集启用或模型就绪。未完成接入显示正常 setup_required，引导选目录；不会反复把未配置当作执行错误。模型不可用、采集关闭、工作目录未授权或文件权限不足分别报告，不冒充空库或保存成功。

Open **Context Library** in the sidebar, choose a host folder, and confirm the displayed current-directory scope and use of session-selected models. One revisioned native Settings update completes onboarding. New eligible work is summarized into this folder; cancelling, browsing folders or opening the page never grants capture. Reading remains available when capture is off. No credentials belong in plugin config.

Advanced compatibility: existing explicit provider/model configurations remain supported when useSessionModel is false. The old subtree workspace behavior remains only when exactWorkspaces is false; new UI confirmations use exact canonical working-directory matching.

### 权限和数据流 / Permissions and data flow

- 新选择流程只授权当前 canonical 工作目录；不自动授权嵌套或其他工作区。同目录的合格新 session 可向**同一个库**贡献知识，并查询该库全部已整理资料。此 MVP 不是库内多租户 ACL；敏感工作应使用隔离库/profile。
- root 在当前 session 的可写根目录之外时，不会绕过限制。只读 session 不触发模型整理或写入，但在 allowlist 内仍可查询此库。
- 文本只发送给用户确认的会话模型政策或兼容的固定 DSH 模型路由，没有静默 provider fallback。原始 source 文本只在内存中，有界裁剪并标注省略；持久任务保存来源标识，不复制聊天全文。
- 常见 token/private-key 模式会脱敏，但无法保证识别所有敏感信息。启用前应确认输入范围和该模型的数据处理政策。
- 默认排除子代理、推理块、附件字节、工具参数和 CtxKit 自身工具结果；不会自动扫描全部旧 session。

## 0.8 全局状态 / Shared global state

`GLOBAL.md` 与 `USER.md` 分开维护：USER 是“用户习惯怎样协作”，GLOBAL 是“大家当前需要共享知道什么”。GLOBAL 可保存共享环境事实、跨主题协调、共同约定、重要决策和未解决问题；具体项目细节和普通进度仍留在主题/session，不把整库搬到这里。

- 首次出现有来源的全局更新才生成；自然语言即可要求更正或移除。不自动导入旧聊天，也不因开发这个功能而编造共享内容。
- 沿用现有 capture 调用，从本次已验证的事实索引派生来源与证据标签，再与两份根记录和阶段资料同批 CAS/journal 写入；不增加模型调用。
- Markdown 正文显示类别、证据类型、记录时间。计划、推断、用户反馈不会变成实测结果。时间字段 observedAt 是采集入队时点，不一定是原事实发生时间。
- 已授权会话自动收到独立、有界的 user-role 历史快照。它不是实时检查；有时效性的状态必须复核，也不能用共同约定绕过当前指令和执行权限。
- 每轮最多6项变更、32项活动条目、64项无旧正文的删除水位；超限明确失败，不静默淘汰。旧任务不能复活较新删除。删除当前项不清除历史阶段记录。
- GLOBAL 与 USER 每份自动上下文均不足8000字符，超出标记 truncated、按需读取；更新其中一份不会擅自改动另一份。保留文件结构时可修改正文，结构性增删建议通过自然语言。无标记同名文件不覆盖。

GLOBAL.md is a separate shared last-known-state record, not a user-habit profile or live monitor. Updates cite this capture's validated facts and preserve evidence labels and recording timestamps. Native bounded user-role snapshots refresh automatically within the same authorized library; they never grant execution permission. Semantic extraction accuracy still requires real use and verification.

## 0.7 用户习惯 / User preferences

首次捕获到明确的长期偏好时，会在所选库根目录创建 `USER.md`，而不是改项目的 AGENTS 指令文件。例如用户真实说出“以后默认先给结论，再给依据”，可形成跨任务的表达偏好；单次任务要求、示例、工具输出、助手建议、敏感画像、凭据和执行权限不应成为习惯。

- 沿用 turn/end → capture 链路，不加第三次模型调用。偏好与阶段摘要同批写入；后续主题整理失败不丢已保存的偏好。
- 每项有稳定 ID、原用户事件 seq、checkpoint 来源及时间。更正和“忘记这项偏好”更新当前档案；删除不清除过去的阶段记录或宿主历史上下文。
- 模型必须引用本轮直接用户消息的精确短引文；Host 验证来源类型和文本匹配，但语义判断仍可能有误，需要实际使用核对。不根据过往历史扫描或推测补建人物画像。
- 所有获准访问同一库的会话自动获得当前偏好的有界快照，由 DSH 的原生动态 user-role 上下文记录和刷新。它是不可信历史资料，不替代当前指令，也不能授权执行操作。没有文件就不注入，读取失败省略而不阻断对话。
- 正文可阅读、在保留首行元数据和条目结构时修改；增删条目建议直接用自然语言提出。无标记同名文件或损坏格式会拒绝覆盖并报告错误。
- 上限：每轮 6 项变更、32 项活动偏好、64 项无旧文本的删除水位；上下文最终不足 8000 字符，超出部分标记 truncated，可通过已有读取工具按需查看。容量满会报错，不静默丢弃。

“全局”仅指同一授权库，不跨库/工作区访问边界；暂停采集或只读会话仍可按原有授权读取。首次有效偏好出现前没有 USER.md 是正常状态。

USER.md holds explicit cross-task defaults with human provenance. Capture atomically journals preference changes with their checkpoint, then separately organizes topics. Authorized sessions receive a bounded, untrusted user-role snapshot through native prompt context; it is never a permission grant. Corrections/removals affect current defaults, not historical records. Real-model semantic accuracy is not guaranteed by deterministic tests.

## 日常使用 / Daily use

**用户不需要知道 CtxKit 的名字，也不需要先说“查记忆”。** 在启用后的工作区正常说“继续 Atlas”“修复这个项目的登录问题”“上次为什么这样决定”即可。Agent 获得直接可调用的 `recall_context` 工具和轻量常驻指引：当普通任务依赖之前的工作、决策或进度时，自主查询相关记录；需要细节再读来源。不要求先调用 skill，也不把整库加载到每轮对话。

这是按需召回指引，不是强制每轮查询或保证模型每次都正确判断相关性；独立的新问题无需检索，历史结论仍需对照当前代码和实际情况。查询本身不额外调用整理模型，不修改知识库。原生 `ctxkit-recall` skill 保留为更详细的使用指引。

User-facing use is ordinary task language, not a plugin invocation. The agent has a direct `recall_context` tool and guidance to retrieve relevant prior work proactively; no product name, special phrase, or skill invocation is required from the user.

工具用于 Agent 调用，不是要求用户记住的命令：

| Tool | Purpose |
| --- | --- |
| `recall_context` | Agent 主动召回相关历史、决策和进度，返回有界来源摘录；primary proactive recall |
| `ctxkit_browse` | 分页浏览文件树、主题、会话档案、当前会话处理状态和文档；与浏览页共用查询 |
| `ctxkit_search` | 关键词/名称/别名搜索，返回有界摘录和路径；lexical search |
| `ctxkit_read` | 分页读正文、revision、来源元数据，以及主题双向关系；bounded read |
| `ctxkit_status` | 当前 session 的处理任务、失败、采集资格及阻断原因；processing readiness/status |
| `ctxkit_retry` | 在当前 session 内重试已有未完成任务，不扫描其他历史；retry existing pending work |
| `ctxkit_pause` | 用户要求时暂停/恢复当前 session 的采集；pause/resume recording |

读取工具和 skill 仅在已选择库且属于 allowlist 的调用范围可见；采集关闭不再隐藏已授权的读取能力。写入类操作仍检查采集开关、模型、暂停与文件权限，不能通过重试或恢复绕过未启用状态。自动整理在工作回合后异步执行，最终回答发出并不代表整理已经结束；用 `ctxkit_status` 检查。

Pause clears buffered source immediately and cancels that session's in-flight model request. A paused interval is not backfilled. If saving the pause flag fails, the response explicitly reports `persisted: false`; the in-memory pause still applies until restart. Resuming accepts future work, not permission to replay the paused interval.

## 浏览入口 / Library browser

安装或更新后刷新当前 DSH 页面，在侧栏打开 **“上下文库 / Context library”**。先选中一个真实会话，页面以该会话当前的工作区和权限检查访问范围，不会自行创建会话或扩大授权。

- **上下文目录**：显示采集状态，通过上方“在 Finder 中打开”查看文件；网页不再呈现文件树。
- **Sessions**：单独搜索、分页浏览库中已采集的会话档案，按近期更新排序。这不是全部 DSH 聊天列表。
- 当前会话的采集资格与阻断原因以小状态提示，详细处理状态也可通过工具查看。

未配置、没有记录、无匹配、无权限和读取失败分别显示。资料区域是**只读快照**：点击“刷新视图”获取后续变化；不轮询、不自动重试整理、不安装或执行草稿。存储目录直接在资料页选择：只有明确确认才启用当前范围的记录，浏览文件夹或取消不会改动。切换会话/工作区/权限或插件连接时，旧响应与旧文档会失效。正文先使用安全的纯文本 Markdown 阅读；受管理的来源、子文档和关系有独立导航按钮，正文中的任意链接或 HTML 不会执行。

The native sidebar page offers direct Finder access and a separate Sessions search tab, pagination, safe document windows and managed-source navigation. It shares the exact bounded Host query with agent tools. The current selected session supplies access context; an empty setup is not presented as an empty successful library.

浏览页通过 DSH 原生 session command 调用同一 Host 查询操作，不额外开启 HTTP server。DSH 会将有界查询结果写入该 session 的 command 审计日志（不作为模型聊天消息）；查询不写知识库，也不读取原始聊天全文。

## 形成的目录 / Resulting structure

```text
vault/
├── INDEX.md
├── USER.md
├── GLOBAL.md
├── topics/topic_atlas/
│   ├── OVERVIEW.md
│   ├── docs/architecture.md
│   └── skills/deploy/SKILL.md
├── sessions/session_<stable-hash>/
│   ├── SESSION.md
│   └── checkpoints/cp_<stable-hash>.md
└── .ctxkit/
    ├── jobs/
    ├── pause/
    └── transactions/
```

主题从简短入口开始；文档与 skills 按实际需要产生，不预建空目录。skills 在本版本始终标为草稿，不注册、不安装、不执行；请先检查适用范围、权限、验证结果和失败处理。

Markdown 首行的 `<!-- ctxkit {JSON} -->` 是版本化元数据，正文是可编辑知识。编辑正文时保留首行的合法 JSON；它不是标准 YAML frontmatter。第一版只读取自己管理的文件。派生 INDEX 可重建；源 checkpoint 和文档不是可随意删除的缓存。

Relations are stored once on the source topic with type, reason and checkpoint sources. Reverse relationships are derived at read time. Similar keywords alone do not justify a link. There is no automatic merge/delete/move or relation-removal operation in this MVP.

## 失败与恢复 / Failure and recovery

阶段摘要和主题整理是两个独立阶段：组织失败不丢已保存的阶段。修复配置、权限或冲突后，可以在当前 session 调用 `ctxkit_retry`；它仅重试该会话已有任务，暂停/只读时拒绝。重新激活当前 session 的 agent 也会尝试恢复其未完成任务。仅在有权限且已知精确事件范围时读取原始来源，不扩大扫描。新回合不会自动重试所有旧错误，也没有后台无限重试计时器。

- `done`：本阶段处理完成；不等于业务任务已经完成。
- `skipped`：模型判断本轮无新增可保留成果。
- `captured` / `organizing`：阶段已保存，知识更新尚未完成。
- `error`：失败及简要原因；不当作无新知识。
- `waiting_source`：需要原 session 的指定来源片段，目前无法获取。
- `paused`：暂不处理。

原子性以单文件为边界，跨文件更新采用 journal。中断后可能部分文件已发布；恢复只接受原版本或本事务目标版本，遇到用户/其他 session 的新修改会停止，不盲目回滚覆盖。

If `.ctxkit/writer.lock` remains after a crash or permission revocation, do not remove it while any writer may be active. Disable the plugin and stop all writers first; inspect the recorded PID/start time and back up the vault before manually resolving a stale lock. An unresolved journal conflict requires reviewing the involved documents and transaction, not deleting history indiscriminately. This version intentionally fails closed rather than automatically stealing locks.

## MVP 限制 / Limits

- 回合结束是候选检查点，不是精确的语义阶段检测；长任务在回合结束前不保证保存。纯查询可跳过，明显成果仍取决于模型判断。
- 每个有价值回合通常两次辅助调用（capture + organize），无信息通常一次。默认每次最多 4000 output tokens、60 秒；可能因截断或格式错误失败，可检查状态。不是免费、离线或零延迟记忆。
- 默认来源最多 24000 字符、单事件 4000；优先保留首个人类请求及最近的结果/回复，省略片段有明确标记，引用序号随保留内容同步。缺失信息不得被记为完整验证。
- 第一版库扫描上限 400 个 managed Markdown 文件，单文件 128000 bytes；主题目录深度最多 8 层。超过限制明确报错，不宣称无限规模。没有自动归档和全文数据库。
- 每个实例串行整理，队列有上限；溢出通过 adapter notice 报告，未被接受的回合不能承诺恢复。进程在来源任务落盘前崩溃也可能丢失该候选回合。
- 索引是关键词检索，不是语义向量搜索；中文按字符及完整查询匹配，质量需要真实案例评估。
- 模型只能修改完整读过且 revision 匹配的既有文件。已有文件过大/未进入上下文时，不能凭目录摘要覆盖。
- 来源引用证明可追溯性，不自动证明事实正确；本版本不执行独立事实核验。
- 0.5 以资料页选目录完成接入，修复只保存位置却无法启用的断层，并改为文件树与 Sessions 双页签。仍沿用原生 Settings/configEditor、theme/locale/slots；没有知识编辑、删除合并、自动刷新或一键部署操作，不开新服务器、不修改 DSH shell。
- `engines.dsh` 精确限制为已核对的 0.2.2-rc.3；其他版本需重新核对 API 和验收，不能静默放宽。

## 开发检查 / Development checks

```sh
npm install --ignore-scripts
npm run check
npm test
npm pack --dry-run
```

Tests use temporary directories, fictional session events and deterministic model output. They cover core persistence and adapter contracts; a passing mocked test is not proof of live provider quality, production session recovery or rendered Plugin Manager appearance. Real-host/native-backend checks and installation checks must be reported separately for each delivery.

## Reference / 参考

设计参考 [memsearch](https://github.com/zilliztech/memsearch) 的 Markdown 派生索引、分层召回与 DSH 接入思路；本包没有复制或依赖其实现、Milvus 或 Python runtime。保留 CtxKit 的主题知识与 session 历史分离，并采用 DSH 当前文件权限与生命周期接口。
