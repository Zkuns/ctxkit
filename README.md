# CtxKit

**用 Markdown 留住项目知识，让 agent 在日常工作中主动接手、写回和记录。**

[English](README.en.md) · [自动维护配置模板](skills/context-setup/assets/AGENTS.context.template.md) · [完整使用示例](examples/walkthrough.md) · [示例库](examples/vault/CONTEXT.md) · [MIT](LICENSE)

CtxKit 是五个可以独立安装的 Agent Skills。资料放在你自己的 Markdown 文件夹中，可直接用编辑器或 Obsidian 阅读；agent 根据任务读取项目背景，把有价值的成果写回，并维护跨项目的 session 工作摘要。

**推荐用法是一次配置，日常正常提需求。** 例如：“接着做 Atlas，解决混合语言检索的问题。”配置好以后，agent 应主动读取 Atlas 的上下文，完成阶段工作后更新项目与本次 session，不需要你逐个输入 skill 名称。

## 自动使用是怎样工作的

自动维护需要两部分配合：

| 部分 | 负责什么 | 放在哪里 |
| --- | --- | --- |
| Skills | 告诉 agent 什么情况下适用、如何读取或写入 | 客户端能发现的 skills 目录 |
| 常驻指令 | 声明你的库在哪里、哪些项目适用、何时主动记录 | 客户端实际加载的用户或项目指令文件 |

Skills 的描述支持自然语言匹配，五份 `agents/openai.yaml` 也显式设置了 `allow_implicit_invocation: true`。它表示允许自动选择；仅设置这个值，并不会建立后台任务。常驻指令把“有阶段成果就写回”变成每次工作的约定。[Codex skills 官方说明](https://learn.chatgpt.com/docs/build-skills)

配置后的预期流程：

```text
正常提出项目任务
  → 读取导航与相关项目
  → 执行任务
  → 有实质成果、决策、验证结果或新阻塞
  → 更新项目现状
  → 更新同一份 session 工作摘要
  → 简短告知实际写回位置
```

长任务在有意义的阶段更新；没有新信息、仅查资料或明确要求“暂不记录”时跳过。写记录产生的文件变化不会再次触发记录，避免循环。

这仍然是 agent 在处理任务时遵循的工作约定，是否执行取决于客户端发现、指令加载及模型行为。它不监听关闭窗口或崩溃，也不保证每隔几分钟运行。需要硬性定时、退出回调或跨端消息管理时，还需要宿主提供调度或事件能力；CtxKit 当前不实现这些能力。

## 一次性安装和配置

### 1. 安装 skills

需要 Python 3.9+。以下使用 Codex 官方文档列出的用户级目录；其他客户端请替换为实际支持的 skills 目录。已有安装使用其他可被发现的目录时沿用原位置，避免多处重复安装同名 skill。

```sh
git clone https://github.com/Zkuns/ctxkit.git
cd ctxkit

# 预览目的地，不写入文件
python3 scripts/install.py --target "$HOME/.agents/skills" --dry-run

# 安装五个 skills
python3 scripts/install.py --target "$HOME/.agents/skills"

# 也可以只选需要的，例如：
# python3 scripts/install.py --target "$HOME/.agents/skills" --skill context-read
```

安装器只复制 skill 文件夹，遇到任何重名目标会在开始复制前退出。它不覆盖旧 skills，不修改客户端配置或资料库。也可以手动复制完整 skill 目录。

Codex 会自动发现 skill 变化；没有出现时重启客户端。不同客户端的加载和调用方式以各自能力为准。[官方说明](https://learn.chatgpt.com/docs/build-skills)

### 2. 准备 session 脚本的 Python

前四个 skills 只需要 agent 的文件能力。`context-log` 使用随包附带的 Python 脚本，需要 PyYAML。可以复用已有环境，或在仓库根目录执行：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r skills/context-log/requirements.txt
```

记下 `.venv/bin/python` 的实际绝对路径，填入下一步的常驻指令。安装器不会自动安装 Python 依赖。日常保存时，JSON 和脚本参数由 agent 处理，无需手工运行这些命令。

### 3. 把自动维护约定写进常驻指令

使用 [AGENTS.context.template.md](skills/context-setup/assets/AGENTS.context.template.md)，替换其中三个路径，并**增量合并**到客户端实际会加载的指令文件，保留其他已有规则。

| 模板变量 | 填写内容 |
| --- | --- |
| `context_root` | 私人上下文库的绝对路径 |
| `context_index` | 已有导航文件的绝对路径，不要求叫 `CONTEXT.md` |
| `context_python` | 已安装 PyYAML 的 Python 可执行文件绝对路径 |

这些是指令模板的占位符，不是脚本自动解析的环境变量。模板默认启用相关已登记项目的阶段写回和 session 摘要；只想维护项目时，去掉启用 session 和调用 `context-log` 的约定即可。

Codex 可使用用户级 `~/.codex/AGENTS.md`；仅在一个仓库内使用时，可放入该仓库的 `AGENTS.md`。自定义了 `CODEX_HOME` 或存在 `AGENTS.override.md` 时，应核对实际生效的入口。不要只把规则放在资料库里就假定每个新聊天会读到它。[官方指令加载规则](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

也可以让 agent 帮你完成这一次配置，不必知道 skill 名：

```text
帮我接入现有上下文库，启用 CtxKit 的自动读取、阶段写回和 session 工作摘要。
库目录：/absolute/path/to/context
导航入口：/absolute/path/to/context/CONTEXT.md
脚本 Python：/absolute/path/to/ctxkit/.venv/bin/python
把约定增量加入我的 /absolute/path/to/AGENTS.md，沿用现有资料结构。
```

这是一次配置请求。之后只说正常任务即可，不需要每轮重复路径或“记下来”。新库也可以用自然语言要求建立导航与项目入口；已有库按原有目录接入，不必迁移到示例结构。

### 4. 确认实际生效

重新开始一次聊天，让 agent 说明读到了哪个上下文入口和哪些维护约定，再说“接着做 Atlas”。它应找到相关项目并继续任务。完成一次有实质成果的工作后，检查回复中的项目与 session 文件链接。

测试时可以复制 [示例库](examples/vault/CONTEXT.md) 到临时目录。仅看配置存在不等于已验证自动行为；更多输入与预期见 [行为场景](tests/scenarios.md)。

## 五个 skills 的具体分工

| Skill | 自然使用场景或触发时机 | 主要行为与产物 |
| --- | --- | --- |
| [context-setup](skills/context-setup/SKILL.md) | “把现有资料接进来”“登记这个新项目”“启用自动维护” | 定位旧导航，补充项目入口；需要时填充常驻指令模板 |
| [context-read](skills/context-read/SKILL.md) | 开始、继续或切换已登记项目；“上次做到哪里了” | 读取导航、项目主文档及必要专题，接着完成当前任务；读取不改文件 |
| [context-write](skills/context-write/SKILL.md) | 已启用阶段写回，且产生了成果、决策、验证结果或新阻塞 | 增量更新相关项目的当前状态、证据与下一步 |
| [context-log](skills/context-log/SKILL.md) | 已启用 session 记录，且一个有实质内容的阶段结束；“最近做过什么” | 创建或更新同一份跨项目摘要；查询时按 `updated_at` 倒序 |
| [context-review](skills/context-review/SKILL.md) | 发现影响接手的矛盾、断链、重复或过长文档；“整理这些资料” | 检查相关范围，按已有约定局部修正；只要求检查时只报告 |

例如：

- “接着做 Atlas，排查混合语言检索。”→ 先读 Atlas，再做任务；有结果后主动写回和记 session。
- “顺便把 Beacon 的素材缺口也梳理一下。”→ 补读 Beacon，在同一 session 下增加该项目成果。
- “这个方案就定了，第一版先不加向量检索。”→ 保存已确认决策及理由；记录为决策，不能写成已实现。
- “最近我在 Atlas 上做了什么？”→ 查询关联 Atlas 的摘要，不更改原记录时间。
- “这次先看看，不要改上下文。”→ 保持只读，即使存在日常写回约定。

完整跨阶段示例见 [walkthrough](examples/walkthrough.md)。需要排查匹配问题或精确指定能力时，仍可显式使用 `$context-read`、`$context-write` 等；这只是补充入口。

## 两类文件分别放在哪里

### 技能仓库：工作方法和工具

```text
ctxkit/
├── README.md                         # 安装、自动使用、数据格式与约定
├── README.en.md                      # 英文使用说明
├── AGENTS.md                         # 开发本仓库的约定，不是用户自动维护配置
├── LICENSE                           # MIT 许可
├── requirements-dev.txt              # 本仓库验证需要的依赖
├── skills/
│   ├── context-setup/
│   │   ├── SKILL.md                  # 建库、接入与配置方法
│   │   ├── agents/openai.yaml        # 界面信息和自动选择策略
│   │   └── assets/
│   │       ├── CONTEXT.template.md   # 总导航模板
│   │       ├── PROJECT.template.md   # 项目主文档模板
│   │       └── AGENTS.context.template.md  # 用户的常驻指令模板
│   ├── context-read/                 # 按需读取
│   ├── context-write/                # 更新项目现状
│   ├── context-review/               # 检查与整理
│   └── context-log/
│       ├── SKILL.md                  # session 摘要的整理与身份规则
│       ├── agents/openai.yaml        # 界面信息和自动选择策略
│       ├── scripts/records.py        # save / get / list / view
│       ├── requirements.txt          # PyYAML 依赖
│       ├── references/cli.md         # CLI 输入、版本冲突及恢复说明
│       └── assets/sessions.base      # 可选 Obsidian 列表视图
├── scripts/install.py               # 安装到明确指定的目录，不覆盖已有内容
├── scripts/validate.py              # 校验 skills、链接、策略和样例格式
├── examples/vault/                  # 全部为虚构内容的示例库
├── examples/walkthrough.md          # 自然语言使用过程及预期结果
└── tests/                           # 脚本测试和人工行为检查场景
```

每个 skill 都有 `SKILL.md`、`agents/openai.yaml` 和独立 `LICENSE`。上图省略了重复项；安装单个 skill 不依赖同级 skill 文件夹。

`SKILL.md` 顶部的 YAML 用于发现能力，后面的 Markdown 正文定义执行方法。例如：

```markdown
---
name: context-write          # 稳定技能名，与文件夹名称一致
description: 在已启用阶段写回时，主动保存项目成果、决策和验证结果。
license: MIT
---

# 写回项目上下文
<!-- 正文描述定位、触发时机、增量更新方法和完成条件。 -->
```

其中 `description` 影响 agent 何时选择 skill。`agents/openai.yaml` 中的 `interface` 提供显示名称和示例提示语，`policy.allow_implicit_invocation: true` 允许隐式选择；`default_prompt` 里出现 `$skill-name` 是手动选择时的预填示例，不表示使用者必须输入它们。这些配置属于 skill，与下文项目及 session 的 YAML 属性用途不同。

### 私人上下文库：你的实际资料

```text
context/
├── CONTEXT.md                       # 库导航：项目入口与阅读顺序
├── projects/
│   ├── atlas/
│   │   ├── PROJECT.md               # Atlas 现在的状态和下一步
│   │   ├── checks.md                # 具体检查的条件、结果和范围
│   │   └── decisions/search.md      # 搜索方案的理由和变更历史
│   └── beacon/
│       └── PROJECT.md               # Beacon 的当前状态
├── sessions/
│   └── sess_<稳定ID>.md              # 一次会话的累计工作摘要，可关联多个项目
└── sessions.base                    # 展示配置，数据仍来自 sessions/*.md
```

`projects/` 和 `PROJECT.md` 是新库的推荐约定；已有中文分类、自定义入口和 Obsidian 双链可以保留。记录脚本当前扫描库根目录的 `sessions/*.md`，不递归扫描任意子目录。

私人资料库与开源技能仓库分开保存。安装、记录和查询都不会自动把私人内容提交或上传到 GitHub。

## 项目文件怎么写

### 导航 `CONTEXT.md`

导航只保留库的用途、项目路径和阅读规则。新增项目时更新入口；普通阶段进度写到项目中，不在导航再复制一份。专题从项目主文档链接即可。

参考 [导航模板](skills/context-setup/assets/CONTEXT.template.md) 和 [示例导航](examples/vault/CONTEXT.md)。

### 项目主文档 `PROJECT.md`

它回答“项目现在是什么状态，下一步怎么接着做”。下面是带注释的虚构示例；只保留有实际内容的小节：

```markdown
---
last_updated: 2026-01-15  # 文档最近编辑日期，不代表整篇都在当天重新核验
---

# Atlas

## 目标与边界
让团队检索资料标题与标签；第一版不做自动抓取。

## 当前状态
- 英文原型已实现，示例检查通过，详见 [验证记录](checks.md)。
- 中文与混合语言仍待验证，尚未部署。

## 关键入口
<!-- 放实际仓库、文档或服务入口；不存在的地址不编造。 -->

## 决策及原因
先使用数据库全文检索，原因与重新评估条件见 [搜索方案](decisions/search.md)。

## 阻塞与下一步
补齐中文和混合语言样本，再评估部署条件。

## 来源
<!-- 写明实际观察、来源文件或用户反馈，必要时注明核验日期和范围。 -->
```

项目笔记没有强制的数据库 schema。`last_updated` 是模板约定，已有元数据可以继续使用；章节名称也可以沿用旧库。示例里的 YAML `#` 和 Markdown `<!-- -->` 是说明性注释，模板落地时应填充或删除，不能当作项目事实。

| 内容 | 推荐放置位置 | 更新方式 |
| --- | --- | --- |
| 目标、当前状态、关键决策、阻塞与下一步 | 项目主文档 | 修改对应小节，避免堆叠多个互相矛盾的“最新进展” |
| 详细方案比较与决策变更 | `decisions/` 等专题 | 保留理由、日期、重新评估条件，主文档链接过去 |
| 验证条件、实际范围、通过与失败结果 | 检查或证据专题 | 区分 agent 执行、用户反馈、尚未验证；不混同部署 |
| 本次会话分别做了哪些工作 | session 工作摘要 | 记录历史成果与证据链接，不充当项目最新状态 |

项目主文档太长时保留接手所需的摘要，细节拆到有明确主题的文档。历史仍有用就保留来源，不靠反复复制全文维持上下文。

## Session 工作摘要的结构

Session 在这里指“一次会话做过的工作记录”。它不包含原始聊天、逐次工具输出或模型内部状态，也不能恢复原应用的完整对话。它和项目的关系是多对多：一次会话可以涉及多个项目，一个项目也可以经历多次会话。

### 文件与属性

脚本创建的文件名是 `sessions/sess_<32位UUID十六进制>.md`。例如下面这条 [虚构记录](examples/vault/sessions/sess_11111111111141118111111111111111.md)，无论跨几天或更换标题，ID 和文件名都保持不变。

```markdown
---
type: session-record                         # 固定类型，用于识别工作摘要
schema_version: 1                            # 当前格式版本
id: sess_11111111111141118111111111111111      # 脚本生成的稳定记录 ID
title: 确认搜索方案并整理周报素材                 # 展示名称，可以修改
created_at: '2026-01-14T02:00:00Z'             # 首次建立摘要的时间
updated_at: '2026-01-16T09:30:00Z'             # 摘要内容最近实际修改时间
projects:                                    # 库内完整项目文档路径
  - '[[projects/atlas/PROJECT]]'
  - '[[projects/beacon/PROJECT]]'
source: example-client                       # 可选：真实来源平台
source_session_id: demo-cross-project        # 可选：平台提供的真实会话 ID
---

# 确认搜索方案并整理周报素材

本次工作：确认搜索方向，并整理通讯素材缺口。

## Atlas
- 第一版决定先使用数据库全文检索。
- 整理英文原型的验证范围；中文仍待验证，尚未部署。
- 已写回 [项目状态](../projects/atlas/PROJECT.md)。

## Beacon
- 确认栏目结构并梳理素材缺口；尚未发送通讯。
- 已写回 [项目状态](../projects/beacon/PROJECT.md)。

## 待继续
- 补充中文与混合语言检索样本。
- 补齐通讯缺失素材。
```

以上事件与日期都是展示数据。实际记录只能填写已发生的工作和真实写回位置。

| 属性 | 格式及规则 |
| --- | --- |
| `type` | 固定为 `session-record`；脚本按这个属性识别记录 |
| `schema_version` | 新写入记录总是 `1`；读取时缺省按 `1` 兼容，其他版本会报错 |
| `id` | 必填，`sess_` 加 32 位小写十六进制；首次创建后保持不变 |
| `title` | 必填，非空单行文本，用于列表展示 |
| `created_at` | 必填，带时区时间；首次记录时间，不假定等于原聊天的创建时间 |
| `updated_at` | 必填，带时区时间，不能早于 `created_at`；脚本写为 UTC |
| `projects` | 必填列表；保存为带完整库内路径的双链，可用 `[]` 表示没有对应项目；脚本保存时检查项目文件存在 |
| `source` + `source_session_id` | 可选但需要成对提供；不同平台可有相同的原生 ID；已绑定的来源身份不改写 |

除 `schema_version` 的兼容缺省和可选来源字段外，表中字段都是记录格式的一部分。正文也必须非空。项目文档的宽松结构与 session 脚本校验的固定字段是两套不同约定。

`get` 返回的 `revision` 是根据文件内容计算的版本标记，`path` 是库内相对路径；它们不写入 YAML。已有扩展 YAML 属性会在脚本更新时保留，但 `save` 的输入 JSON 只接受 `title`、`projects`、`body` 和可选来源字段，ID 与时间由脚本管理。格式细节见 [CLI 说明](skills/context-log/references/cli.md)。

### 什么情况下新建，什么情况下更新

- 同一真实来源平台与会话 ID：继续更新已有摘要，跨项目、跨天都不新建日期文件。
- 无法获取原生 ID：第一次明确新建，agent 保留返回的记录 ID；后续用该 ID 更新。身份丢失且无法确认归属时询问，不能按标题或“最近一条”猜测。
- 新聊天或分叉：默认新记录。明确要求接续某条记录时才使用其 ID，并保留原有来源身份。
- 新阶段：先读旧正文与 `revision`，合并新增成果，再保存全文；版本过期则重读合并。
- 无新信息：不改内容、不刷新时间；手动编辑时需要同时维护 `updated_at`。

正文按项目归纳累计成果，不按每条消息追加流水账。变长时压缩重复过程，保留有价值的阶段、决策变化和未解决项，详细依据链接到项目专题。

### 与项目写回的顺序

同一阶段先更新项目的实际现状，再更新 session 中的历史成果和写回链接。只有实际写入成功才标记已同步；部分失败时逐项说明并在重试前读取已有结果。旧 session 可能已被后续工作超越，不能直接覆盖项目的新状态。

当前记录没有原应用的运行状态字段；`updated_at` 不能说明 agent 仍在运行、已经完成或正在等待回复。`source_session_id` 只是来源标识，不会自动打开或监听该聊天。

## 展示、查询与索引

Markdown 是数据源。列表每次从记录文件读取，按解析后的 `updated_at` 从新到旧排序；不按文件名或文件系统修改时间排序，不维护另一份需要同步的 SQLite 数据库。

平时可以直接问：“最近做了什么？”“只看 Atlas 的工作记录。”若想手动检查虚构示例，在准备好 Python 环境后运行：

```sh
.venv/bin/python skills/context-log/scripts/records.py --root examples/vault list
.venv/bin/python skills/context-log/scripts/records.py --root examples/vault list --project projects/atlas/PROJECT.md --format json
```

默认返回 20 条，支持项目、来源和条数过滤。列表只输出属性，`get` 才返回正文。生成的 Markdown 列表可以重建；不要把它当作需要手工维护的第二份数据。

Obsidian 用户可让 agent 添加 `sessions.base`：打开“最近记录”按更新时间查看；在项目文档嵌入 `![[sessions.base#当前项目]]` 查看关联记录。它保存筛选、列和排序配置，删除视图不会删除记录；自定义的已有视图不会被覆盖。具体命令见 [CLI 说明](skills/context-log/references/cli.md)。

## 使用边界与更新

- 客户端需要本地文件读取能力；写回还需文件编辑能力，session 脚本还需命令执行能力。无法访问本机文件的云端聊天不会自动获得这个库。
- 路径按本次指定、已生效的 agent 指令、`CONTEXT_ROOT` 的顺序定位；没有配置时，读取类流程只检查已有 `~/context`。桌面客户端未必继承终端变量，推荐在常驻指令写明绝对路径。
- 如果同时有其他维护同一库的 skills，在常驻指令中明确各自范围，避免同一阶段重复写入。CtxKit 不删除其他 skills 或迁移私人资料。
- 拉取更新只改变源码；已复制安装的 skills 需要比较差异、迁移自己的改动，再替换安装副本。安装器故意拒绝直接覆盖。修改常驻指令后按客户端方式开始新会话或重载。
- 脚本使用本机写锁、版本检查和原子替换减少覆盖风险；它不提供多机器同步锁。原生 ID 缺失、外部编辑冲突等处理见 [CLI 说明](skills/context-log/references/cli.md)。

## 开发与验证

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python scripts/validate.py
.venv/bin/python -m unittest discover -s tests -v
```

结构检查覆盖 skill 元数据、自动选择策略、模板引用、文档链接和示例格式。脚本测试在临时目录覆盖安装、身份去重、跨天更新、无变化保存、时间排序与版本冲突。它们不能证明模型每次都会触发 skill，也不等于 Obsidian 界面实测或所有客户端兼容认证。[行为场景](tests/scenarios.md) 用于补充实际客户端验证。

欢迎提交具体的脱敏案例：输入、已有资料、实际文件变化和期望行为。保持普通文件可读、各 skill 可独立安装，优先解决实际使用中的问题。

## License

[MIT](LICENSE)。可以复用、修改与分享，保留许可声明。
