# CtxKit for DSH

中文 / English · Host-only MVP · DSH **0.2.2-rc.3**

## 做什么 / What it does

正常使用 DSH session，插件在新增回合结束后检查是否产生实质成果。值得保留的内容先形成带事件序号来源的阶段记录，再整理到主题入口、详细文档、带理由的主题关系或惰性操作草稿。它不要求主 agent 记得写笔记，也不执行你的项目任务。

Work normally in opted-in DSH sessions. Completed turns are checked for durable work, captured as sourced checkpoints, then organized into topic overviews, detailed knowledge, evidenced relationships and inert procedure drafts. A tool-free auxiliary model performs extraction and organization. It cannot deploy, publish or execute generated skills.

## 安装与启用 / Install and opt in

在 DSH 的插件管理中添加本目录（或打包后的 npm tarball）。通过 agent 安装时使用 DSH 的 `plugin_manager`，不要自行重写用户 profile。源码包无依赖安装脚本，不下载 embedding 模型。

安装默认值为 `enabled: false`，没有配置库、工作区与模型时也保持惰性。**安装不等于采集已启用。** 先决定以下内容，再用宿主支持的配置编辑机制保存该插件条目的配置；插件不会直接改写 profile 文件。

```json
{
  "enabled": true,
  "root": "/absolute/path/to/context-vault",
  "allowedWorkspaces": ["/absolute/path/to/workspace"],
  "provider": "your-configured-dsh-provider-id",
  "model": "your-authorized-model-id"
}
```

这些路径、模型名都是占位示例。库与工作区必须已经存在，不能是符号链接；首次使用推荐**专用空库和一个测试工作区**。库中未带 CtxKit 标记的原有文件不会被覆盖，不自动迁移早期 skills 资料。

The bundle is inactive by default. Choose an existing dedicated vault, an explicit workspace allowlist, and a configured DSH provider/model. Save the complete config through supported host configuration facilities. No credentials belong in plugin config. This MVP validates configuration in code; it does not provide a custom settings page or a schema-generated setup wizard.

### 权限和数据流 / Permissions and data flow

- 允许的工作区包含其子目录；不要为了方便直接配置整个 home。允许一个工作区，意味着其中合格的新 session 可向**同一个库**贡献知识，且可查询该库全部已整理主题。此 MVP 不是库内多租户 ACL；敏感工作应使用隔离库/profile。
- root 在当前 session 的可写根目录之外时，不会绕过限制。只读 session 不触发模型整理或写入，但在 allowlist 内仍可查询此库。
- 文本只发送给显式配置的 DSH 模型路由，没有静默 provider fallback。原始 source 文本只在内存中，有界裁剪并标注省略；持久任务保存来源标识，不复制聊天全文。
- 常见 token/private-key 模式会脱敏，但无法保证识别所有敏感信息。启用前应确认输入范围和该模型的数据处理政策。
- 默认排除子代理、推理块、附件字节、工具参数和 CtxKit 自身工具结果；不会自动扫描全部旧 session。

## 日常使用 / Daily use

**用户不需要知道 CtxKit 的名字，也不需要先说“查记忆”。** 在启用后的工作区正常说“继续 Atlas”“修复这个项目的登录问题”“上次为什么这样决定”即可。Agent 获得直接可调用的 `recall_context` 工具和轻量常驻指引：当普通任务依赖之前的工作、决策或进度时，自主查询相关记录；需要细节再读来源。不要求先调用 skill，也不把整库加载到每轮对话。

这是按需召回指引，不是强制每轮查询或保证模型每次都正确判断相关性；独立的新问题无需检索，历史结论仍需对照当前代码和实际情况。查询本身不额外调用整理模型，不修改知识库。原生 `ctxkit-recall` skill 保留为更详细的使用指引。

User-facing use is ordinary task language, not a plugin invocation. The agent has a direct `recall_context` tool and guidance to retrieve relevant prior work proactively; no product name, special phrase, or skill invocation is required from the user.

工具用于 Agent 调用，不是要求用户记住的命令：

| Tool | Purpose |
| --- | --- |
| `recall_context` | Agent 主动召回相关历史、决策和进度，返回有界来源摘录；primary proactive recall |
| `ctxkit_browse` | 分页浏览主题、会话档案、当前会话处理状态和文档；与浏览页共用查询 |
| `ctxkit_search` | 关键词/名称/别名搜索，返回有界摘录和路径；lexical search |
| `ctxkit_read` | 分页读正文、revision、来源元数据，以及主题双向关系；bounded read |
| `ctxkit_status` | 当前 session 的处理任务、失败、采集资格及阻断原因；processing readiness/status |
| `ctxkit_retry` | 在当前 session 内重试已有未完成任务，不扫描其他历史；retry existing pending work |
| `ctxkit_pause` | 用户要求时暂停/恢复当前 session 的采集；pause/resume recording |

工具和 skill 仅在已配置且属于 allowlist 的调用范围可见；未启用时不会向所有 agent 添加无用工具。自动整理在工作回合后异步执行，最终回答发出并不代表整理已经结束；用 `ctxkit_status` 检查。

Pause clears buffered source immediately and cancels that session's in-flight model request. A paused interval is not backfilled. If saving the pause flag fails, the response explicitly reports `persisted: false`; the in-memory pause still applies until restart. Resuming accepts future work, not permission to replay the paused interval.

## 浏览入口 / Library browser

安装或更新后刷新当前 DSH 页面，在侧栏打开 **“上下文库 / Context library”**。先选中一个真实会话，页面以该会话当前的工作区和权限检查访问范围，不会自行创建会话或扩大授权。

- **主题**：搜索、分页查看主题入口，打开详细文档、操作草稿、关联主题及来源阶段。
- **会话档案**：查看库中已采集的工作档案，按近期更新排序，进入各阶段记录和关联主题。这不是全部 DSH 聊天列表。
- **处理状态**：查看当前所选会话的采集资格、处理阶段、失败代码及已保存的 checkpoint。库的主题/档案共享，处理任务不跨会话展示。

未配置、没有记录、无匹配、无权限和读取失败分别显示。页面是**只读快照**：点击“刷新视图”获取后续变化；不轮询、不改配置、不自动重试整理、不安装或执行草稿。切换会话/工作区/权限或插件连接时，旧响应与旧文档会失效。正文先使用安全的纯文本 Markdown 阅读；受管理的来源、子文档和关系有独立导航按钮，正文中的任意链接或 HTML 不会执行。

The native sidebar page offers Topics, Session dossiers and Processing tabs, search, pagination, safe document windows and managed-source navigation. It shares the exact bounded Host query with agent tools. The current selected session supplies access context; an empty setup is not presented as an empty successful library.

浏览页通过 DSH 原生 session command 调用同一 Host 查询操作，不额外开启 HTTP server。DSH 会将有界查询结果写入该 session 的 command 审计日志（不作为模型聊天消息）；查询不写知识库，也不读取原始聊天全文。

## 形成的目录 / Resulting structure

```text
vault/
├── INDEX.md
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
- 0.2 增加原生侧栏浏览页，沿用 DSH theme/locale/slots。仍没有设置向导、知识编辑、删除合并、自动刷新或一键部署操作；不开新服务器、不修改 DSH shell。
- `engines.dsh` 精确限制为已核对的 0.2.2-rc.3；其他版本需重新核对 API 和验收，不能静默放宽。

## 开发检查 / Development checks

```sh
npm run check
npm test
npm pack --dry-run
```

Tests use temporary directories, fictional session events and deterministic model output. They cover core persistence and adapter contracts; a passing mocked test is not proof of live provider quality, production session recovery or rendered Plugin Manager appearance. Real-host/native-backend checks and installation checks must be reported separately for each delivery.

## Reference / 参考

设计参考 [memsearch](https://github.com/zilliztech/memsearch) 的 Markdown 派生索引、分层召回与 DSH 接入思路；本包没有复制或依赖其实现、Milvus 或 Python runtime。保留 CtxKit 的主题知识与 session 历史分离，并采用 DSH 当前文件权限与生命周期接口。
