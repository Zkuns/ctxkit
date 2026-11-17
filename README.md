# CtxKit

正常使用 AI session 做事，让有价值的成果逐渐形成自己的上下文库。

[English](README.en.md) · [DSH 插件](plugins/dsh/README.md) · [设计与数据契约](docs/dsh-design.md)

## 知识会长成什么样

**主题不是固定的项目表。** 它可以是产品、长期事项、技术专题或工作方法。一个主题从简短入口开始，随实际工作逐渐长出详细文档和可复用操作草稿：

```text
context/
├── INDEX.md
├── topics/topic_atlas/
│   ├── OVERVIEW.md
│   ├── docs/
│   │   ├── architecture.md
│   │   └── authentication.md
│   └── skills/deploy/SKILL.md
└── sessions/session_<id>/
    ├── SESSION.md
    └── checkpoints/cp_<id>.md
```

- **OVERVIEW** 是接手入口与导航，不复制所有细节。
- **详细文档** 解释当前系统、功能、决策、约束和依据。
- **主题 skills** 保存可复用操作的草稿；形成草稿不等于安装或授权执行。
- **Session 档案** 记录这次工作怎么推进、取得什么成果、停在哪里。
- **阶段记录** 为主题文档提供可追溯来源；一个 session 可以贡献多个主题。

主题保存当前理解，session 保留工作历史。计划、实现、实测、用户反馈和推断分开记录，后来的结论不会把早期尝试伪装成从未发生。

## DSH 插件优先

新的实现位于 [plugins/dsh](plugins/dsh/README.md)，不依赖旧版五个 skills。

第一版提供自动阶段提取、主题与详细文档整理、带依据的主题关系、惰性 skill 草稿，以及按需搜索和读取。数据用 Markdown 保存，无向量数据库或额外 Python 运行时依赖。写入经过当前 session 的文件权限检查，版本冲突和失败可检查、可重试。

**在上下文库中选目录即可接入。** 打开侧栏 **上下文库 / Context Library**，点击“选择目录”，确认 DSH 宿主上的已有目录；不需要环境变量、路径配置表单或第二个保存按钮。

**确认即授权当前工作目录的新成果记录。** 选择前明确展示范围，并说明使用各会话当前模型整理、会产生额外调用；仅授权当前工作目录，不自动覆盖其他或嵌套工作区。未确认时不采集；取消不改动，不导入历史或搬移旧资料，也不改变会话文件权限。

**日常不用说“查询 CtxKit”。** Agent 在接续工作或需要历史背景时，可以自主调用召回工具，按需读取相关来源。想主动浏览时，在 DSH 侧栏打开 **“上下文库”**，默认用可展开的**文件树**查看 Markdown，另一个 **Sessions** 页签搜索已采集的会话档案。

当前是 **0.5 MVP**：提供选目录后完整接入、文件树、独立会话搜索与直接主动召回入口；采集仍以回合结束为候选检查点，不保证退出前保存。搜索采用关键词，是否需要召回及知识正确性仍依赖模型判断与实际核对。具体限制、采集授权和验证范围见 [完整插件说明](plugins/dsh/docs/TECHNICAL.md)。

## 开发

```sh
npm --prefix plugins/dsh install --ignore-scripts
node --test plugins/dsh/tests/*.test.js
.venv/bin/python scripts/validate.py
.venv/bin/python -m unittest discover -s tests -v
```

更多信息见 [开发说明](docs/development.md)。测试使用虚构材料和临时目录，不读写个人真实资料。

## 早期 skills 原型

根目录 `skills/` 和 [旧版使用指南](docs/usage.md) 保留早期的 Codex / Claude Code 项目上下文原型，其 [数据格式](docs/data-model.md) 与新插件不同。它们仍可独立使用，但不代表新系统的自动采集能力，也不自动迁移或覆盖旧库。

[MIT License](LICENSE)
