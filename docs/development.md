# 开发说明

[项目首页](../README.md) · [使用指南](usage.md) · [数据结构](data-model.md)

## 仓库结构

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
│   │   └── assets/
│   │       ├── CONTEXT.template.md
│   │       ├── PROJECT.template.md
│   │       └── AGENTS.context.template.md
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

`agents/openai.yaml` 中的 `interface` 提供显示名称和示例提示语，`policy.allow_implicit_invocation: true` 允许隐式选择。`default_prompt` 里出现 `$skill-name` 是手动选择时的预填示例，不表示使用者必须输入它们。

这些配置属于 skill，与 [数据结构](data-model.md) 中的项目及 session 属性用途不同。

README 介绍项目动机与核心概念；`docs/` 承载使用方式和格式细节。根目录的 `AGENTS.md` 是开发本仓库的约定，用户的自动维护规则使用 `context-setup/assets/` 下的独立模板。

`context-log` 的脚本实现保存、读取、列表和视图生成；`references/cli.md` 说明命令接口。安装器只复制所选 skill，校验器检查元数据、隐式选择策略、文档链接与虚构样例。

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

结构检查覆盖 skill 元数据、自动选择策略、模板引用、文档链接和示例格式。脚本测试在临时目录覆盖安装、身份去重、跨天更新、无变化保存、时间排序与版本冲突。它们不能证明模型每次都会触发 skill，也不等于 Obsidian 界面实测或所有客户端兼容认证。[行为场景](../tests/scenarios.md) 用于补充实际客户端验证。

欢迎提交具体的脱敏案例：输入、已有资料、实际文件变化和期望行为。保持普通文件可读、各 skill 可独立安装，优先解决实际使用中的问题。

本项目使用 [MIT](../LICENSE) 许可。
