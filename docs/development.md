# 开发说明

[项目首页](../README.md) · [使用指南](usage.md) · [数据结构](data-model.md)

## 当前主线：DSH 插件

新设计见 [知识与能力空间](dsh-design.md)，配置与操作见 [完整插件说明](../plugins/dsh/docs/TECHNICAL.md)，实际执行与未验证范围见 [MVP 验证记录](dsh-verification.md)。

```text
plugins/dsh/
├── index.js              # Cordis bundle 入口及配置切换生命周期
├── config.js             # 原生 volatile 配置及目录校验
├── adapter.js            # 原生事件、模型、权限、工具与 skill 接入
├── library.js            # UI/Agent 共用的有界只读查询
├── desktop-host.js       # 仅 browser owner 的共享 API 桌面动作与取消生命周期
├── browser-host.js       # 原生 session command 桥接与可信会话绑定
├── client.js             # 系统目录选择、Finder 打开与 Sessions（lazy-factory artifact）
├── contracts.js          # 有界输入和方案校验
├── preferences.js        # USER.md 正文、直接用户证据、更正与删除水位
├── preference-context.js # 原生有界 user-role 动态上下文
├── global-state.js       # GLOBAL.md 当前共享内容、证据与删除水位
├── global-context.js     # 全局共享状态的有界 user-role 快照
├── record-context.js     # 两份根记录共用的授权/有界读取
├── engine.js             # capture / organize / recover 状态机
├── vault.js              # Markdown、CAS、journal 与关键词检索
├── prompts.js            # 无工具提取与整理提示
├── locale/               # 中英文插件元数据
└── tests/                # 虚构临时库及宿主适配测试
```

```sh
npm --prefix plugins/dsh install --ignore-scripts
node --test plugins/dsh/tests/*.test.js
npm --prefix plugins/dsh run check
npm --prefix plugins/dsh pack --dry-run
```

无安装脚本；0.3 的原生配置使用与宿主一致的 `@deepseek-ai/schemastery@3.19.0` peer。开发测试先安装该依赖。`DSH_INSTALL_DIR` **只用于开发者运行原生集成测试，不是插件使用配置**；0.5 在上下文库中确认目录即原子接入当前工作目录与会话模型政策；不再要求用户另填配置。原生测试仅在该变量存在时解析已安装的 Cordis、Loader、Settings 和 sandbox 后端；没有该变量就明确 skip，不偷偷安装 DSH。测试用合成 session、模型和隔离的临时配置，不读写真实 profile、凭据或用户日志。

所有核心写入要求 authorizer；DSH 运行时注入原生 fs publisher，单文件版本检查与发布由宿主后端完成。Standalone writer 仅用于隔离的核心测试。不要用替代 server 或 profile 手工编辑绕过插件管理。

下方结构与说明是仍保留的**早期 skills 原型**，不限制新插件的数据模型。

## 早期 skills 仓库结构

```text
ctxkit/
├── README.md
├── README.en.md
├── AGENTS.md
├── LICENSE
├── requirements-dev.txt
├── docs/
│   ├── usage.md
│   ├── usage.en.md
│   ├── data-model.md
│   └── development.md
├── skills/
│   ├── context-setup/
│   │   ├── SKILL.md
│   │   ├── agents/openai.yaml
│   │   ├── references/clients.md
│   │   └── assets/
│   │       ├── CONTEXT.template.md
│   │       ├── PROJECT.template.md
│   │       └── maintenance.template.md
│   ├── context-read/
│   ├── context-write/
│   ├── context-review/
│   └── context-log/
│       ├── SKILL.md
│       ├── agents/openai.yaml
│       ├── scripts/records.py
│       ├── requirements.txt
│       ├── references/cli.md
│       └── assets/sessions.base
├── scripts/install.py
├── scripts/validate.py
├── examples/vault/
├── examples/walkthrough.md
└── tests/
```

每个 skill 都有 `SKILL.md`、`agents/openai.yaml` 和独立 `LICENSE`。上图省略了重复项；安装单个 skill 不依赖同级 skill 文件夹。

`SKILL.md` 顶部的 YAML 用于发现能力，后面的 Markdown 正文定义执行方法。例如：

```markdown
---
name: context-write
description: 在已启用阶段写回时，主动保存项目成果、决策和验证结果。
license: MIT
---

# 写回项目上下文
<!-- 正文描述定位、触发时机、增量更新方法和完成条件。 -->
```

`name` 是与文件夹一致的稳定技能名，`description` 影响 agent 何时选择 skill。

`SKILL.md` 使用 Agent Skills 通用格式；核心流程不依赖某个客户端的命令名、原生会话日志或 hooks。`agents/openai.yaml` 是 Codex 附加配置，其中 `interface` 提供显示名称和示例提示语，`policy.allow_implicit_invocation: true` 允许隐式选择。`default_prompt` 里出现 `$skill-name` 是手动选择时的预填示例，不表示使用者必须输入它们，也不控制 Claude Code 的调用。

Claude Code 默认允许按描述自动选择技能；保持其 `disable-model-invocation` 未设置或为 `false`。客户端的目录、常驻指令与兼容细节集中在 `context-setup/references/clients.md`；一份 `maintenance.template.md` 定义共同的维护时机，不按客户端复制业务规则。hooks 如有需要作为可选适配，不成为核心技能依赖。

这些配置属于 skill，与 [数据结构](data-model.md) 中的项目及 session 属性用途不同。

README 介绍项目动机与核心概念；`docs/` 承载使用方式和格式细节。根目录的 `AGENTS.md` 是开发本仓库的约定，用户的自动维护规则使用 `context-setup/assets/` 下的独立模板。

`context-log` 的脚本实现保存、读取、列表和视图生成；`references/cli.md` 说明命令接口。安装器用 `--client codex` / `--client claude-code` 选择默认个人目录，或通过 `--target` 接入自定义目录；两种方式互斥，只复制同一套所选 skills，不修改客户端指令。校验器检查元数据、隐式选择策略、文档链接与虚构样例。

## 文档排版

- 首页保留简短介绍和入口，命令、字段表和配置示例放到对应文档。
- 目录树只展示层级；长注释放在树外说明，不用空格对齐中英文文本。
- 代码块标注语言，长命令合理换行；标题、段落和列表之间保留空行。
- 表格用于简短字段对照，长流程用小节和段落展开。
- 移动文档后更新相对链接，避免依赖仓库根目录的隐含位置。

## 验证与贡献

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python scripts/validate.py
.venv/bin/python -m unittest discover -s tests -v
```

结构检查覆盖 skill 元数据、自动选择策略、模板引用、文档链接和示例格式。脚本测试在临时目录覆盖两个客户端的安装入口、自定义目录、身份去重、跨天更新、无变化保存、时间排序与版本冲突。它们不能证明模型每次都会触发 skill，也不等于 Obsidian 界面实测或所有客户端兼容认证。[行为场景](../tests/scenarios.md) 用于补充实际客户端验证。

欢迎提交具体的脱敏案例：输入、已有资料、实际文件变化和期望行为。保持普通文件可读、各 skill 可独立安装，优先解决实际使用中的问题。

本项目使用 [MIT](../LICENSE) 许可。
