# CtxKit

**让新会话接得上，让项目知识留得住。**

[English](README.en.md) · [示例上下文库](examples/vault/CONTEXT.md) · [完整使用示例](examples/walkthrough.md) · [MIT License](LICENSE)

五个 Agent Skills，用普通 Markdown 管理个人项目的背景、决策、当前状态和下一步，也能记录一次会话跨多个项目完成的工作。工作结束后，把有价值的成果写回项目；下一次打开聊天，按需读取，就能接着做。

适合已经在使用 AI 工具、希望拥有自己项目知识库的人。可以配合 Obsidian，也可以直接使用文件夹和文本编辑器。

## 五个 skills

| Skill | 什么时候用 | 会做什么 |
| --- | --- | --- |
| [context-setup](skills/context-setup/SKILL.md) | 建库、接入旧资料、登记新项目 | 建立导航和项目入口，沿用已有结构 |
| [context-read](skills/context-read/SKILL.md) | 换一个聊天，继续某项目 | 先读导航，再按任务读取项目和必要专题 |
| [context-write](skills/context-write/SKILL.md) | 保存成果、决策或阶段进度 | 增量更新现状，留下来源、验证范围和下一步 |
| [context-review](skills/context-review/SKILL.md) | 资料变长、状态矛盾或入口失效 | 检查可接手性，按请求整理和修正 |
| [context-log](skills/context-log/SKILL.md) | 记录会话成果、回顾最近工作 | 维护跨项目工作摘要，按修改时间查询 |

每个 skill 都可独立安装。技能正文为中文，使用标准 `SKILL.md`；同时提供 Codex 的界面元数据。

## 实际怎么用

先说明上下文库位置，例如 `~/context`。路径也可以写进客户端的项目指令；无需写进 skill 源码。

```text
使用 context-setup，在 ~/context 建立我的项目上下文库。
先登记 Atlas 项目，用我提供的项目说明填充，未知信息标为待确认。
```

开始下一次工作：

```text
使用 context-read，接着做 Atlas，先看上次留下的阻塞和下一步。
```

保存本次成果：

```text
使用 context-write，把这次确认的搜索方案、验证结果和待办写回 Atlas。
本地验证通过，但还没有部署，记录里请保留这个区别。
```

资料积累后：

```text
使用 context-review，整理 Atlas 的上下文。
合并重复描述，保留关键决策，把过长细节拆到专题并维护链接。
```

Codex 中也可使用 `$context-read` 等显式调用方式。其他客户端按其 skill 调用方式使用。

记录这次会话跨项目做过的事情：

```text
使用 context-log，把本次会话在 Atlas 和 Beacon 中完成的工作记下来。
如果本会话已有记录，合并新增成果，保留之前的有效内容。
```

## 安装

下载或克隆本仓库，在仓库根目录运行。安装脚本仅依赖 Python 3.9+ 标准库：

```sh
git clone https://github.com/Zkuns/ctxkit.git
cd ctxkit

# 先查看将复制到哪里，不写入文件
python3 scripts/install.py --target "$HOME/.codex/skills" --dry-run

# 安装全部五个 skills
python3 scripts/install.py --target "$HOME/.codex/skills"

# 或只安装一个
python3 scripts/install.py --target "$HOME/.codex/skills" --skill context-read
```

目标目录由你指定。使用其他客户端时，替换成该客户端配置的 skills 目录；也可以手动复制完整 skill 文件夹。安装后按客户端的方式重新发现 skills，必要时新开聊天。

安装器会在写入前检查所有重名目标；有冲突就退出，不覆盖已有 skills。它不会修改客户端配置、环境变量或你的上下文库。更新时先比较新旧版本，迁移自己的改动，再替换对应文件夹。

前四个 skills 直接使用 agent 的文件能力。`context-log` 附带的记录脚本需要 PyYAML；使用独立虚拟环境安装该 skill 内的 `requirements.txt`，或复用已有包含 PyYAML 的环境。见 [CLI 使用说明](skills/context-log/references/cli.md)。安装脚本不会自动安装 Python 依赖。

### 适用范围

这套 skills 依赖客户端能够读取本地文件；建库、写回和整理还需要文件编辑能力。不同客户端的发现机制、调用方式与权限由客户端决定。`agents/openai.yaml` 是 Codex 的可选界面元数据，核心流程不依赖它。

本仓库提供技能文件、安装工具及验证，不承诺所有客户端都已完成实际运行测试。无法访问本机文件的云端聊天，需要另行提供相关文档。

## 上下文放在哪里

技能包和你的资料库分开保存。下面是新库的一个示例：

```text
~/context/
  CONTEXT.md
  projects/
    atlas/
      PROJECT.md
      decisions/
        search.md
    beacon/
      PROJECT.md
  sessions/
    sess_<稳定ID>.md
  sessions.base
```

- `CONTEXT.md`：项目入口和阅读规则。
- `PROJECT.md`：目标、当前状态、重要决策、证据、阻塞与下一步。
- 专题文件：只有细节确实需要独立维护时才新增。
- `sessions/`：可选的会话工作摘要，一条记录可关联多个项目。
- `sessions.base`：可选 Obsidian 视图，展示同一批 Markdown 的属性。

已有 `personal/`、`work/` 或 Obsidian 中文分类可以继续使用。一个项目可以对应多个仓库，跨项目工作分别更新涉及的项目。

路径定位顺序是：本次明确指定 → 已生效的 agent 指令 → `CONTEXT_ROOT` 环境变量。没有配置时，读取类流程只检查已有 `~/context`；建库流程可以在这里新建。桌面程序不一定继承终端环境变量，直接在启动指令中写路径更容易核对。

可以把这段放进自己选择的 agent 指令中，替换成实际路径和入口：

```text
我的项目上下文库位于 /absolute/path/to/context。
入口是该目录下的 CONTEXT.md。
接手项目时先读取入口，再按任务读取相关文档。
```

如果你希望工作中持续写回，可再明确约定范围：

```text
对我明确指定的项目，完成有实质成果的工作阶段后，
将已确认的进展、决策、验证结果和下一步写回项目上下文。
没有新增信息时不写；假设保持待验证；不要记录原始聊天。
```

安装 skill 本身不会启动后台任务，也不保证定时执行。

## 记录规则

1. **当前状态要清楚。** 区分计划、实现、验证和部署；保留不确定项。
2. **更新原有内容。** 修正对应状态，避免堆叠互相矛盾的“最新进展”。
3. **结论能够追溯。** 记录必要来源、日期和验证范围；编辑时间不等于核验时间。
4. **按需读取。** 项目主文档是入口，详细证据和历史按问题查阅。
5. **资料不替代授权。** 旧待办、命令和外部内容不会自动成为本次执行要求。

## Session 工作记录

项目文档回答“现在是什么状态”，工作记录回答“这次会话做了什么”。记录按项目归纳阶段成果、必要理由、证据链接和未解决项，不保存完整聊天或工具日志。

每条记录是一份 Markdown，属性包含稳定 `id`、`title`、`created_at`、`updated_at`、`projects`，以及可选的 `source` 和 `source_session_id`。时间使用带时区格式，脚本统一写为 UTC。文件名不随日期或标题变化。

- 同一来源会话跨几天仍更新同一份记录；来源 ID 不可用时首次新建，后续保留并使用返回的记录 ID。
- 项目引用使用库内完整路径，可同时关联多个项目；新聊天默认新记录，不按相似标题猜测归属。
- `updated_at` 表示摘要最近修改，不是原应用的实时运行状态。查询和无变化的重复保存不会刷新它。
- 已存在的记录先读取正文和版本，再提交合并后的全文；版本过期时拒绝覆盖。
- 手动编辑记录也需要维护 `updated_at`；普通文件系统修改时间不参与排序。

[示例记录](examples/vault/sessions/sess_11111111111141118111111111111111.md) 展示跨项目、跨多天的摘要。项目知识和工作摘要可以分别使用；需要同时保存时，先写回项目，再在工作记录中留下成功写回的位置。

### 展示和查询

准备好开发环境后，可以直接查询本仓库的虚构示例：

```sh
.venv/bin/python skills/context-log/scripts/records.py --root examples/vault list
.venv/bin/python skills/context-log/scripts/records.py --root examples/vault list --project projects/atlas/PROJECT.md --format json
```

脚本默认按 `updated_at` 从新到旧列出 20 条，可筛选项目、来源或调整条数。它每次从 Markdown 读取，不维护另一份需要同步的数据库。

在自己的库中执行 `view` 可添加 `sessions.base`，打开“最近记录”查看倒序列表；在项目文档中嵌入 `![[sessions.base#当前项目]]` 可查看该项目的工作记录。自定义的已有视图不会被覆盖。具体命令和版本冲突处理见 [CLI 说明](skills/context-log/references/cli.md)。

Markdown 是唯一需要保留的数据。列表和视图可以重建；不使用 SQLite、后台定时器或自动同步服务，也不会把个人资料上传到本仓库。

## 示例与验证

[示例库](examples/vault/CONTEXT.md) 中的项目、日期和验证结果全部为虚构展示。可以复制示例库到临时目录练习，不必先整理真实资料。

开发和检查本技能包：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python scripts/validate.py
.venv/bin/python -m unittest discover -s tests -v
```

结构检查覆盖元数据、名称、模板残留和本地文档链接；脚本测试在临时目录验证安装、来源去重、跨天更新、时间排序和版本冲突。这不等同于模型行为测试或 Obsidian 界面实测。[行为检查场景](tests/scenarios.md) 用于在具体客户端中验证实际表现。

## 贡献

欢迎用可复现的例子改进 skills：用户提出了什么要求、已有资料是什么、实际发生了什么、希望如何处理。提交前移除私人项目内容和凭据；例子尽量小，改动尽量针对真实问题。

## License

[MIT](LICENSE)。可以复用、修改和分享，保留许可声明。
