# Session 工作记录 CLI

所有命令都以现有上下文库为 `--root`。不运行应用、不扫描私有聊天存储，也不改项目文档；正文由 agent 根据已知工作提炼。

这是 agent 使用脚本的接口说明。日常自动维护时，常驻指令提供库路径、Python 路径与阶段记录约定，agent 在有实质成果后调用脚本；使用者不需要每次准备 JSON 或输入命令。脚本本身不会判断聊天是否结束，也不在后台监听新消息。

下列命令中的 `SKILL_DIR` 应指向实际安装的 `context-log` 目录，`VAULT_DIR` 指向实际资料库。变量名可自行选择，不覆盖系统变量。

## 准备

记录脚本使用 Python 3.9+ 和 PyYAML。可以复用已有包含 PyYAML 的 Python；没有时在用户选择的工具目录创建虚拟环境，避免改系统 Python：

```sh
python3 -m venv /path/to/context-tools-venv
/path/to/context-tools-venv/bin/python -m pip install -r "$SKILL_DIR/requirements.txt"
```

后续命令中的 `python3` 换成这个环境的 Python。项目仓库内开发时可用仓库 `.venv/bin/python`。

## 首次保存

准备 JSON 文件，`body` 是简短工作摘要；项目引用使用库根目录相对路径，脚本将它们保存成带完整路径的 Obsidian 双链。输入项目必须已存在，`projects: []` 也有效。

```json
{
  "title": "改进搜索并整理周报",
  "projects": ["projects/atlas/PROJECT.md", "projects/beacon/PROJECT.md"],
  "source": "codex",
  "source_session_id": "这里填写真实会话ID",
  "body": "# 改进搜索并整理周报\n\n## Atlas\n- 确认中文检索调整方案，尚未实施。\n\n## Beacon\n- 完成素材整理，等待运营数据。"
}
```

```sh
python3 "$SKILL_DIR/scripts/records.py" --root "$VAULT_DIR" save --input /path/to/summary.json
```

能获取来源会话时，先用 `get --source ... --source-session-id ...` 查找已有记录。同一来源已有内容且发生变化时，`save` 会要求先读版本，防止误覆盖。

无法获取来源会话 ID 时，从 JSON 中同时省略 `source` 和 `source_session_id`，首次用 `save --new --input ...`。保存返回的 `id` 用于后续更新。不要每次都用 `--new`，标题相同不代表同一条记录。

`created_at` 是首次建立记录的时间，不是假定的原会话创建时间。`updated_at` 是摘要最近修改时间，不代表原应用中会话仍在运行。二者由脚本生成，不能在输入 JSON 中指定。

## 继续更新

```sh
python3 "$SKILL_DIR/scripts/records.py" --root "$VAULT_DIR" get --id sess_记录ID
```

也可以通过真实来源定位：

```sh
python3 "$SKILL_DIR/scripts/records.py" --root "$VAULT_DIR" get --source codex --source-session-id "真实会话ID"
```

读取返回的 `body`，合并新增成果，保留之前有用的内容。使用返回的 `revision` 更新：

```sh
python3 "$SKILL_DIR/scripts/records.py" --root "$VAULT_DIR" save --id sess_记录ID --if-match "刚读取的revision" --input /path/to/merged-summary.json
```

更新 JSON 必须包含完整的 `title`、`projects`、`body`。来源字段省略时保留旧值；已经绑定的来源身份不可更换。扩展的已有 YAML 属性会保留。脚本不负责语义合并，所以不要只提供新增的一段来替换整个摘要。

正文、标题、项目和来源都没有变化时，返回 `changed: false`，文件字节和时间均保持原样。已提供的版本过期时仍会拒绝保存，应重新读取。

## 查询

```sh
# 最近 20 条，Markdown 输出
python3 "$SKILL_DIR/scripts/records.py" --root "$VAULT_DIR" list

# 查看某项目最近 5 条
python3 "$SKILL_DIR/scripts/records.py" --root "$VAULT_DIR" list --project projects/atlas/PROJECT.md --limit 5

# 给其他程序读取
python3 "$SKILL_DIR/scripts/records.py" --root "$VAULT_DIR" list --format json
```

按带时区的 `updated_at` 解析后倒序排序，同一时刻用稳定 ID 决定顺序。查询不修改文件。项目筛选支持完整库内路径或完整双链，不按模糊项目名称猜测。

列表的 Markdown 链接相对库根目录。如需保存展示，可从库根目录保存到 `工作记录.md`；它只是可以随时重新生成的列表，不应手动修改。不要把输出重定向到已有项目正文或原始记录。

## Obsidian 展示

```sh
python3 "$SKILL_DIR/scripts/records.py" --root "$VAULT_DIR" view
```

生成库根目录的 `sessions.base`。已有相同文件时不改动，已有不同内容时拒绝覆盖。数据仍在 `sessions/*.md`，`.base` 只定义视图。

- 打开“最近记录”：按修改时间倒序显示标题、关联项目、更新时间和来源。
- 在项目文档中嵌入 `![[sessions.base#当前项目]]`：只显示关联该项目的记录。这个视图直接单独打开时可能为空，因为它需要被嵌入项目文档。
- 标题通过 `file.asLink(note.title)` 显示，排序用 `date(note.updated_at)` 转换为时间，不依赖文件系统修改时间。

语法参考：[Bases syntax](https://obsidian.md/help/bases/syntax)。文件提供可检查的视图配置，具体渲染需在使用者的 Obsidian 版本中验证。

## 文件格式和恢复

每条记录存为 `sessions/sess_<UUID>.md`，包含 YAML 属性和 Markdown 正文。文件名不随标题或时间变化。`schema_version: 1`、`type: session-record`、ID、标题、时间及项目列表是当前格式，来源字段为可选的一对。

可用编辑器手动改正文，但需一并维护 `updated_at`；查询不会根据文件系统时间自动修正它。改项目文档路径时也要更新关联链接。保存时验证项目存在，查询仍可展示指向已移走项目的旧记录。

写入使用同目录临时文件和替换，并通过 `sessions/.context-log.lock` 协调同一机器上使用该脚本的写入。版本检查避免把过期摘要覆盖到新内容。这不提供多机器同步锁，也不能阻止外部编辑器在同一瞬间写入；避免同时编辑同一条记录。

若进程被强制终止，可能留下锁文件。先检查其中的 PID，确认没有写入进程仍在运行，再移除该锁重试。不要按锁文件年龄自动清除它。

格式错误、重复 ID 或重复来源映射会报错并停止写入，避免在身份不明确时生成第二条记录。备份冲突文件、核对实际归属后修正，不能任意选一份覆盖。
