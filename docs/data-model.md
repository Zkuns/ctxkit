# 数据结构

[项目首页](../README.md) · [使用指南](usage.md) · [开发说明](development.md)

项目文档描述现在的状态，session 摘要描述一次会话做过的事。本页说明两类记录的文件结构、字段和更新规则。

## 上下文库布局

```text
context/
├── CONTEXT.md
├── projects/
│   ├── atlas/
│   │   ├── PROJECT.md
│   │   ├── checks.md
│   │   └── decisions/search.md
│   └── beacon/
│       └── PROJECT.md
├── sessions/
│   └── sess_<稳定ID>.md
└── sessions.base
```

`projects/` 和 `PROJECT.md` 是新库的推荐约定；已有中文分类、自定义入口和 Obsidian 双链可以保留。记录脚本当前扫描库根目录的 `sessions/*.md`，不递归扫描任意子目录。

私人资料库与开源技能仓库分开保存。安装、记录和查询都不会自动把私人内容提交或上传到 GitHub。

## 导航文件

导航只保留库的用途、项目路径和阅读规则。新增项目时更新入口；普通阶段进度写到项目中，不在导航再复制一份。专题从项目主文档链接即可。

参考 [导航模板](../skills/context-setup/assets/CONTEXT.template.md) 和 [示例导航](../examples/vault/CONTEXT.md)。

## 项目主文档

它回答“项目现在是什么状态，下一步怎么接着做”。下面是带注释的虚构示例；只保留有实际内容的小节：

```markdown
---
# 文档最近编辑日期，不代表整篇内容在当天重新核验
last_updated: 2026-01-15
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

更新时修改对应小节，避免堆叠多个互相矛盾的“最新进展”。详细内容按主题放置：

- 决策专题：保存方案比较、理由、变更日期和重新评估条件。
- 验证记录：保存检查条件、实际范围、通过与失败结果，区分 agent 执行与用户反馈。
- Session 摘要：保存本次会话的历史成果与证据链接。

项目主文档太长时保留接手所需的摘要，细节拆到有明确主题的文档。历史仍有用就保留来源，不靠反复复制全文维持上下文。

## Session 工作摘要

Session 在这里指“一次会话做过的工作记录”。它不包含原始聊天、逐次工具输出或模型内部状态，也不能恢复原应用的完整对话。它和项目的关系是多对多：一次会话可以涉及多个项目，一个项目也可以经历多次会话。

### 文件与属性

脚本创建的文件名是 `sessions/sess_<32位UUID十六进制>.md`。例如下面这条 [虚构记录](../examples/vault/sessions/sess_11111111111141118111111111111111.md)，无论跨几天或更换标题，ID 和文件名都保持不变。

```markdown
---
type: session-record
schema_version: 1
id: sess_11111111111141118111111111111111
title: 确认搜索方案并整理周报素材
created_at: '2026-01-14T02:00:00Z'
updated_at: '2026-01-16T09:30:00Z'
projects:
  - '[[projects/atlas/PROJECT]]'
  - '[[projects/beacon/PROJECT]]'
source: example-client
source_session_id: demo-cross-project
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

`get` 返回的 `revision` 是根据文件内容计算的版本标记，`path` 是库内相对路径；它们不写入 YAML。已有扩展 YAML 属性会在脚本更新时保留，但 `save` 的输入 JSON 只接受 `title`、`projects`、`body` 和可选来源字段，ID 与时间由脚本管理。格式细节见 [CLI 说明](../skills/context-log/references/cli.md)。

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
.venv/bin/python skills/context-log/scripts/records.py \
  --root examples/vault list

.venv/bin/python skills/context-log/scripts/records.py \
  --root examples/vault list \
  --project projects/atlas/PROJECT.md --format json
```

默认返回 20 条，支持项目、来源和条数过滤。列表只输出属性，`get` 才返回正文。生成的 Markdown 列表可以重建；不要把它当作需要手工维护的第二份数据。

Obsidian 用户可让 agent 添加 `sessions.base`：打开“最近记录”按更新时间查看；在项目文档嵌入 `![[sessions.base#当前项目]]` 查看关联记录。它保存筛选、列和排序配置，删除视图不会删除记录；自定义的已有视图不会被覆盖。具体命令见 [CLI 说明](../skills/context-log/references/cli.md)。

想看实际文件，可打开 [虚构示例库](../examples/vault/CONTEXT.md)。
