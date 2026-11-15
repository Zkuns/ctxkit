# 客户端接入

配置自动维护时按当前客户端读取这一页。各客户端共用同一份 `SKILL.md`、脚本与 [维护模板](../assets/maintenance.template.md)，差异集中在技能目录和常驻指令入口。

## 个人全局配置

| 客户端 | 默认个人 skills 目录 | 个人指令入口 |
| --- | --- | --- |
| Codex | `~/.agents/skills/` | `~/.codex/AGENTS.md` |
| Claude Code | `~/.claude/skills/` | `~/.claude/CLAUDE.md` |

展开路径，核对当前环境与已有配置后，将填好路径的模板增量合并到实际生效的入口；已有 CtxKit 段落就更新，不反复追加。只配置用户要求的客户端。两个客户端可指向同一资料库，使用同一套维护约定；全局入口中的对应段落由同一模板维护，不各自设计不同的读写流程。

Codex 自定义 `CODEX_HOME` 时使用该目录；同一层存在非空 `AGENTS.override.md` 时，它优先于 `AGENTS.md`。其他自定义配置目录也以当前客户端实际加载位置为准。已有 skill 安装沿用原位置，避免重复安装同名技能。

## 项目内共用一份规则

只希望在一个代码仓库中生效时，将模板增量合并到项目 `AGENTS.md`。Claude Code 的项目 `CLAUDE.md` 可以通过一行导入同目录文件，保留其他已有内容：

```markdown
@AGENTS.md
```

这会导入整个 `AGENTS.md`，先检查其中的项目规则适用于两个客户端。Claude Code v2.1.277 及之后的版本也支持直接读取 `AGENTS.md`，但会受已有 `CLAUDE.md` / `CLAUDE.local.md`、配置和可用功能影响；不依赖这一默认行为时保留导入即可。

项目技能目录分别为 `.agents/skills/` 和 `.claude/skills/`。个人绝对路径放在个人指令中；共享仓库内只保留适合其他使用者的项目规则。

## 自动选择与验证

- `SKILL.md` 的 `name`、`description` 和正文采用 Agent Skills 格式。两个客户端都可按描述自动选择；描述负责发现，常驻指令负责在接手和阶段结束时提醒检查，技能正文负责具体操作。
- `agents/openai.yaml` 是 Codex 的附加元数据，`allow_implicit_invocation: true` 只控制 Codex。Claude Code 默认允许模型调用相关 skill，不要加入 `disable-model-invocation: true` 禁止自动调用。使用自然语言引用技能，不把 `$skill-name` 或 `/skill-name` 当作跨客户端协议。
- 只安装 skill 不等于配置了持续写回。确认客户端实际加载了库路径与维护约定，再用自然语言验证一次只读接手和一次有成果的写回；记录实际文件变化。Claude Code 可用 `/memory` 检查指令入口。
- Agent Skills 没有统一的定时或生命周期回调。CtxKit 在工作阶段由模型判断是否保存；hooks 是客户端可选适配，本包不安装 hooks，也不承诺关闭窗口或崩溃前保存。
- 客户端需要文件能力，session 还需要执行 Python。云端环境必须能访问库和脚本；本机安装不代表其他设备已接入。不同客户端的新聊天各建自己的工作记录，不用项目相同作为合并 session 的依据。

## 官方依据

- [Agent Skills 格式](https://agentskills.io/specification)
- [Codex 技能发现与自动调用](https://learn.chatgpt.com/docs/build-skills)
- [Codex 指令加载](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Claude Code skills](https://code.claude.com/docs/en/skills)
- [Claude Code 指令与 AGENTS.md 共用](https://code.claude.com/docs/en/memory)
