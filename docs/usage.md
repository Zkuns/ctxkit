# 使用指南

[项目首页](../README.md) · [English](usage.en.md) · [数据结构](data-model.md)

配置一次后，日常只需要提出正常的项目任务。agent 按约定读取背景，在有实质成果时更新项目和本次会话摘要。

下面的命令从 CtxKit 仓库目录执行。私人上下文库单独保存，不需要移进这个仓库。

## 1. 安装 skills

需要 Python 3.9+。以下使用 Codex 官方文档列出的用户级目录；其他客户端请替换为实际支持的 skills 目录。已有安装使用其他可被发现的目录时沿用原位置，避免多处重复安装同名 skill。

```sh
git clone https://github.com/Zkuns/ctxkit.git
cd ctxkit

# 预览目的地，不写入文件
python3 scripts/install.py \
  --target "$HOME/.agents/skills" --dry-run

# 安装五个 skills
python3 scripts/install.py \
  --target "$HOME/.agents/skills"
```

只装单个 skill 时，可添加 `--skill context-read` 等参数。

安装器只复制 skill 文件夹，遇到任何重名目标会在开始复制前退出。它不覆盖旧 skills，不修改客户端配置或资料库。也可以手动复制完整 skill 目录。

Codex 会自动发现 skill 变化；没有出现时重启客户端。不同客户端的加载和调用方式以各自能力为准。[官方说明](https://learn.chatgpt.com/docs/build-skills)

## 2. 准备 session 脚本的 Python

除 `context-log` 外，其余 skills 只需要 agent 的文件能力。`context-log` 使用随包附带的 Python 脚本，需要 PyYAML。可以复用已有环境，或在仓库根目录执行：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r skills/context-log/requirements.txt
```

记下 `.venv/bin/python` 的实际绝对路径，填入下一步的常驻指令。安装器不会自动安装 Python 依赖。日常保存时，JSON 和脚本参数由 agent 处理，无需手工运行这些命令。

## 3. 配置自动维护

使用 [AGENTS.context.template.md](../skills/context-setup/assets/AGENTS.context.template.md)，替换其中三个路径，并**增量合并**到客户端实际会加载的指令文件，保留其他已有规则。

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

## 4. 确认实际生效

重新开始一次聊天，让 agent 说明读到了哪个上下文入口和哪些维护约定，再说“接着做 Atlas”。它应找到相关项目并继续任务。完成一次有实质成果的工作后，检查回复中的项目与 session 文件链接。

测试时可以复制 [示例库](../examples/vault/CONTEXT.md) 到临时目录。仅看配置存在不等于已验证自动行为；更多输入与预期见 [行为场景](../tests/scenarios.md)。

## 日常怎么用

> 接着做 Atlas，排查混合语言检索的问题。

agent 先读 Atlas 的项目背景，再继续任务。有新的结论、验证结果或阻塞时，按已启用的约定更新项目与 session。没有新增信息、只查资料或明确要求“暂不记录”时跳过。

其他自然表达也可以：

- “顺便把 Beacon 的素材缺口梳理一下。”——补读另一个项目，把成果加入同一会话摘要。
- “这个方案定了，第一版先不加向量检索。”——保存确认的决策，保留尚未实现的区别。
- “最近我在 Atlas 上做了什么？”——查询相关摘要，不刷新记录时间。
- “这次先看看，不要改上下文。”——保持只读。

具体的跨项目、跨天过程见 [使用示例](../examples/walkthrough.md)。

## 五个 skills

每个 skill 都可以单独安装。完整流程会按当前任务选择需要的能力。

### context-setup：接入与配置

首次建库、接入旧资料、登记新项目或启用自动维护时使用。沿用已有导航与目录，补充缺少的入口；需要时填写常驻指令模板。

例如：“把这个新项目登记到上下文库。” [查看 skill](../skills/context-setup/SKILL.md)

### context-read：读取与接手

开始、继续或切换已登记项目时使用。先读导航和项目主文档，再按任务读取必要专题，接着完成当前工作。读取本身不改文件。

例如：“接着做 Atlas，上次做到哪里了？” [查看 skill](../skills/context-read/SKILL.md)

### context-write：更新项目现状

已启用阶段写回时，在得到实质成果、确认决策、验证结果或新阻塞后主动使用。增量更新相应项目的状态、证据和下一步。

无需每次提醒保存；也可以临时要求“把这个结论记下来”。[查看 skill](../skills/context-write/SKILL.md)

### context-log：记录会话成果

已启用 session 记录时，在有意义的阶段结束后更新本会话的累计摘要。一份记录可以关联多个项目，也可用于查询最近工作。

例如：“最近在 Atlas 和 Beacon 上做了什么？” [查看 skill](../skills/context-log/SKILL.md)

### context-review：检查与整理

发现影响接手的矛盾、断链、重复或过长文档时使用。按本次要求或已有约定局部整理；只要求检查时只报告问题。

例如：“检查这些项目资料里的矛盾，先不要修改。” [查看 skill](../skills/context-review/SKILL.md)

需要精确选择能力或排查匹配问题时，仍可显式输入 `$context-read` 等名称。它是补充入口，日常不需要逐个调用。

## 自动维护的运行方式

Skills 说明何时适用、怎么做；常驻指令声明库的位置、作用范围与阶段记录约定。五个 skills 都允许隐式选择，但实际执行仍取决于客户端发现、指令加载和模型行为。

在一次工作中，agent 应先读取相关背景，完成有意义的阶段后更新项目，再更新对应 session。阶段回复或等待用户前保存已有成果，不必等到整段聊天结束。写记录本身不再次触发维护循环。

这套约定在 agent 处理任务时执行，不是后台定时器，也不监听关闭窗口或崩溃。需要定时或退出回调时，还需要宿主提供相应能力。[Codex skills 官方说明](https://learn.chatgpt.com/docs/build-skills)

## 更新与常见问题

- 客户端需要本地文件读取能力；写回还需文件编辑能力，session 脚本还需命令执行能力。无法访问本机文件的云端聊天不会自动获得这个库。
- 路径按本次指定、已生效的 agent 指令、`CONTEXT_ROOT` 的顺序定位；没有配置时，读取类流程只检查已有 `~/context`。桌面客户端未必继承终端变量，推荐在常驻指令写明绝对路径。
- 如果同时有其他维护同一库的 skills，在常驻指令中明确各自范围，避免同一阶段重复写入。CtxKit 不删除其他 skills 或迁移私人资料。
- 拉取更新只改变源码；已复制安装的 skills 需要比较差异、迁移自己的改动，再替换安装副本。安装器故意拒绝直接覆盖。修改常驻指令后按客户端方式开始新会话或重载。
- 脚本使用本机写锁、版本检查和原子替换减少覆盖风险；它不提供多机器同步锁。原生 ID 缺失、外部编辑冲突等处理见 [CLI 说明](../skills/context-log/references/cli.md)。

记录格式、展示和查询见 [数据结构](data-model.md)；开发检查见 [开发说明](development.md)。
