# CtxKit

在侧栏打开 **上下文库 / Context Library**，点击 **选择目录**，在弹出的 **macOS 系统窗口** 中确认已有目录（浏览器与 DSH 运行在同一台 Mac）。

确认会同时启用**当前工作目录**的新成果记录，并沿用各会话当时选择的模型进行整理（会产生额外模型调用）。无需另填配置或另点保存；取消不作修改，不导入历史聊天，不移动旧资料。选择目录不改变会话本身的文件权限。

点击 **在 Finder 中打开** 查看和管理上下文 Markdown，不在网页中展示文件树；**Sessions** 页签单独搜索会话档案。生成的操作草稿不会自动安装或执行。

**用户习惯**：首次识别到明确、跨任务适用的偏好时，在库根目录生成 `USER.md`，与主题和会话档案分开维护。以后可直接要求更正或删除。同库已授权会话自动获得有界偏好快照；不覆盖当前指令、不授予执行权限，也不修改项目 AGENTS 文件。

**全局状态**：`GLOBAL.md` 独立记录同库已授权会话共享的事实、约定、重要决策和未解决事项；不混入用户习惯或项目流水账。首次有来源的全局更新时生成，支持更正和移除，并自动提供带证据类型、记录时间的有界快照。

---

Open **Context Library** in the sidebar and choose a directory in the native macOS dialog (browser and DSH on the same Mac). Confirmation enables new-work capture for the **current working directory**, using each session’s selected model for additional summarization calls. No separate configuration form or Save button. Cancelling changes nothing; historical chats and old files are not imported or moved. Session file permissions still apply.

Use **Open in Finder** to browse Markdown; search captured session dossiers in the separate **Sessions** tab.

[完整使用与技术说明 / Full guide](https://github.com/Zkuns/ctxkit/blob/main/plugins/dsh/docs/TECHNICAL.md)

Explicit cross-task preferences live in `USER.md`, created on the first supported preference. Authorized sessions receive a bounded current snapshot automatically. Corrections/removals update current defaults; historical checkpoints remain. No project AGENTS file is changed.

`GLOBAL.md` separately holds shared last-known facts, conventions, decisions and open issues, not personal habits. Sourced updates/removals and bounded automatic context reuse the existing capture pipeline, with no additional model call.
