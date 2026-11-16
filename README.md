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

**默认不采集。** 安装后仍需指定已有库目录、允许的工作区和整理模型，再显式启用。不扫描全部历史聊天，也不自动部署、发布或安装生成的 skill。

当前是 **0.1 MVP**：以回合结束为候选检查点，模型可跳过无实质进展的回合；不保证退出前保存。搜索采用关键词，知识正确性依赖模型与用户核对。具体限制、配置和验证范围见 [插件说明](plugins/dsh/README.md)。

## 开发

```sh
node --test plugins/dsh/tests/*.test.js
.venv/bin/python scripts/validate.py
.venv/bin/python -m unittest discover -s tests -v
```

更多信息见 [开发说明](docs/development.md)。测试使用虚构材料和临时目录，不读写个人真实资料。

## 早期 skills 原型

根目录 `skills/` 和 [旧版使用指南](docs/usage.md) 保留早期的 Codex / Claude Code 项目上下文原型，其 [数据格式](docs/data-model.md) 与新插件不同。它们仍可独立使用，但不代表新系统的自动采集能力，也不自动迁移或覆盖旧库。

[MIT License](LICENSE)
