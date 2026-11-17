/* Browser artifact: React is the only runtime import. Locale dictionaries below
 * mirror locale/*.json (checked by tests); the lazy loader has no JSON importer. */
window.__ModuleLoader__.load({
  id: 'ctxkit-dsh',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const dictionaries = /* LOCALES_START */ {
  "en": {
    "title": "Context library",
    "intro": "Choose a context directory, browse its files, and find captured session records.",
    "scope": "Access checked against the selected session",
    "shared": "Only managed context documents are shown. File reads still follow this session’s current permissions.",
    "topics": "Topics",
    "sessions": "Sessions",
    "status": "Processing",
    "search": "Search this section",
    "searchHint": "Keywords, names or aliases",
    "searchAction": "Search",
    "clear": "Clear",
    "filter": "Processing state",
    "all": "All states",
    "refresh": "Refresh view",
    "back": "Back to results",
    "previous": "Previous",
    "next": "Next",
    "range": "{start}–{end} of {total}",
    "part": "Characters {start}–{end} of {total}",
    "loading": "Loading library…",
    "empty": "No context files yet",
    "emptyBody": "This directory has no matching managed records yet. New opted-in work can gradually add documents here.",
    "noMatches": "No matching records",
    "noMatchesBody": "Try fewer keywords or clear the search and filter.",
    "noSession": "Choose a current session",
    "noSessionBody": "Select an existing session in the sidebar so its workspace and permissions can be checked. No session is created by this page.",
    "unconfigured": "Start your context library",
    "unconfiguredBody": "Choose a directory above, or confirm the existing directory. Managed files will appear here; use Sessions to search captured work records.",
    "denied": "Library access denied",
    "deniedBody": "This session’s workspace or current file permissions do not allow this read. Select an authorized session or ask the administrator to review its access. This page cannot change permissions.",
    "error": "Library could not be loaded",
    "errorBody": "The host could not complete this bounded read. Refresh the view after checking the connection and plugin availability.",
    "timeout": "The read timed out",
    "timeoutBody": "No result was accepted after 15 seconds. Refresh the view when the host is available.",
    "unavailable": "Library bridge unavailable",
    "unavailableBody": "The host did not recognize the library request. Check that both halves of the CtxKit plugin are installed and active.",
    "truncated": "Bounded results: some content was omitted. Use a narrower search or the next page when available.",
    "snapshot": "Read-only snapshot. Refresh to see later processing changes.",
    "document": "Document",
    "related": "Related records",
    "children": "Documents and checkpoints",
    "relations": "Topic relationships",
    "sources": "Evidence checkpoints",
    "part_of": "is part of",
    "depends_on": "depends on",
    "uses": "uses",
    "related_to": "is related to",
    "revision": "Revision",
    "plainText": "Safe plain-text Markdown view; embedded HTML and links are not executed.",
    "draft": "Procedure draft — not installed or authorized to run.",
    "ready": "Capture eligible",
    "notReady": "Capture not eligible",
    "paused": "Paused",
    "pending": "Pending: {count}",
    "reason": "Capture readiness",
    "unknown": "Unknown",
    "done": "Processed",
    "skipped": "No durable outcome",
    "captured": "Checkpoint saved",
    "organizing": "Organizing topics",
    "capturing": "Capturing checkpoint",
    "queued": "Queued",
    "waiting_source": "Waiting for source",
    "failed": "Failed",
    "job": "Processing task",
    "turn": "Turn {turn}",
    "statusHelp": "Processed means this capture stage finished, not that the project is complete. A saved checkpoint and organized topic are separate stages.",
    "disabled": "Capture disabled",
    "workspace_denied": "Workspace not opted in",
    "read_only": "Session is read-only",
    "write_denied": "Write permission unavailable",
    "no_source": "Source unavailable",
    "not_configured": "Configuration incomplete",
    "storage": "Context directory",
    "storageHelp": "Confirming connects this directory and enables the workspace described below. Existing documents are not moved.",
    "storageUnset": "No folder chosen",
    "storageReload": "Reload current directory",
    "storageLoading": "Loading saved location…",
    "storageSaving": "Saving location…",
    "storageSaved": "Directory connected for new outcomes in this workspace. Recording still requires an available session model and write permission.",
    "storageChanged": "The location changed elsewhere. Reload the current directory before choosing again.",
    "storageUnavailable": "The storage directory is temporarily unavailable. Reload to try again; technical details are below.",
    "storageReadonly": "This connection can view the directory but cannot change it.",
    "storageDenied": "This connection cannot read the storage directory.",
    "storageInvalid": "Choose an existing host directory and a real session with an absolute working directory.",
    "storageRejected": "The host did not accept this directory or workspace. They must exist, must not be symbolic links, and must be permitted.",
    "storageError": "The setup result is unknown and may already have been saved. Reload the current directory before confirming again.",
    "storageBrowseTitle": "Choose an existing host folder",
    "storageBrowseHelp": "Opening folders only navigates. Confirm the directory to connect the workspace described above; Cancel changes nothing.",
    "storageChoose": "Confirm this directory",
    "storageCloseBrowse": "Cancel",
    "storageHome": "Host home",
    "storageHidden": "Show hidden folders",
    "storageNoFolders": "No visible child folders in this directory.",
    "storageBrowseError": "Unable to browse host folders. Try Home or cancel and try again.",
    "storagePickerUnavailable": "The host directory chooser is unavailable on this connection. Cancel and check the host directory service.",
    "storageNativeWaiting": "Waiting up to two minutes for the folder chooser on the DSH host. Closing this section cancels the request.",
    "storageBrowseLoading": "Loading host folders…",
    "storageClientMissing": "This page has no native Settings client service. Refresh the page and check the DSH Remote assembly.",
    "storageHostFailed": "The native Settings API returned a failure. The safe error code below identifies the Host/API problem; no configuration values are included.",
    "storageRequestFailed": "The Settings request failed before a valid response arrived. Check the connection and reload saved settings.",
    "storageResponseInvalid": "The native Settings response has an unexpected format. Check that the page and Host use compatible DSH versions.",
    "storageDescriptorMissing": "Native Settings responded, but did not expose the CtxKit configuration entry. Check that the Host has loaded the updated CtxKit plugin with its Config schema; updating the page alone is not sufficient.",
    "storageDescriptorAmbiguous": "Native Settings returned duplicate CtxKit configuration entries. No entry was selected; check the Host plugin registration.",
    "storageSchemaIncompatible": "The Host does not expose the full directory/workspace/session-model setup schema. Update the CtxKit Host plugin before confirming; a client-only update cannot enable this setup.",
    "storageValueInvalid": "The CtxKit entry exists, but its configuration values or revision have an unexpected format. No value was accepted; reload saved settings after checking the Host plugin version.",
    "storageSelect": "Choose directory",
    "storageChange": "Change directory",
    "storageDetails": "Technical details",
    "files": "Files",
    "fileSearch": "Find a context file",
    "fileSearchHint": "Filename, path or title",
    "sessionSearch": "Search sessions",
    "sessionsHelp": "Search captured session dossiers, not all historical DSH chats.",
    "treeHelp": "Folders reflect managed files on this page. Expand a folder and choose a file to read it. Use pagination to see more files.",
    "expandFolder": "Expand {name}",
    "collapseFolder": "Collapse {name}",
    "storagePickHint": "Choose a folder on the DSH host — no file upload",
    "setupWorkspace": "Only this working directory",
    "setupConsent": "Record new outcomes only in this working directory, using each session’s current model. This adds model calls. No historical import, document migration or change to session file permissions.",
    "setupSelectSession": "Select a real session in the sidebar before confirming its workspace. You can still browse available host folders.",
    "storageUseExisting": "Use this directory",
    "storagePanelGuide": "Open Context library in the sidebar to choose a directory, browse its file tree, and search Sessions.",
    "modelUnavailable": "Current session model is unavailable"
  },
  "zh": {
    "title": "上下文库",
    "intro": "选择上下文目录，展开文件阅读，或搜索已积累的会话档案。",
    "scope": "按当前所选会话检查访问权限",
    "shared": "这里只展示受管理的上下文文档；读取仍遵守当前会话的文件权限。",
    "topics": "主题",
    "sessions": "Sessions",
    "status": "处理状态",
    "search": "搜索当前分类",
    "searchHint": "关键词、名称或别名",
    "searchAction": "搜索",
    "clear": "清除",
    "filter": "处理阶段",
    "all": "全部阶段",
    "refresh": "刷新视图",
    "back": "返回结果",
    "previous": "上一页",
    "next": "下一页",
    "range": "第 {start}–{end} 条，共 {total} 条",
    "part": "字符 {start}–{end}，共 {total} 字符",
    "loading": "正在读取上下文库…",
    "empty": "还没有上下文文件",
    "emptyBody": "此目录中尚无匹配的受管理记录。已授权的新工作成果会逐渐积累成文档。",
    "noMatches": "没有匹配记录",
    "noMatchesBody": "请减少关键词，或清除搜索与筛选条件。",
    "noSession": "选择当前会话",
    "noSessionBody": "在侧栏选择一个已有会话，以确认它的工作目录和权限。此页面不会创建新会话。",
    "unconfigured": "从一个目录开始积累上下文",
    "unconfiguredBody": "在上方选择目录，或确认使用已选目录。接入后，这里会显示受管理的文件树，也可在 Sessions 中搜索会话档案。",
    "denied": "无权读取上下文库",
    "deniedBody": "此会话的工作区或当前文件权限不允许这次读取。请选择已授权会话，或请管理员检查访问范围；此页面不能修改权限。",
    "error": "暂时无法读取上下文库",
    "errorBody": "宿主未能完成这次有界读取。请检查连接与插件是否可用，再刷新视图。",
    "timeout": "读取超时",
    "timeoutBody": "15 秒内未取得可用结果，后续响应已忽略。宿主恢复后可刷新视图。",
    "unavailable": "浏览接口不可用",
    "unavailableBody": "宿主未识别上下文库请求。请检查 CtxKit 的宿主与客户端组件均已安装并运行。",
    "truncated": "结果有界：部分内容已省略。请缩小搜索范围，或在可用时翻到下一页。",
    "snapshot": "只读快照。刷新视图可查看后续处理变化。",
    "document": "文档",
    "related": "相关记录",
    "children": "详细文档与阶段记录",
    "relations": "主题关系",
    "sources": "依据阶段记录",
    "part_of": "属于",
    "depends_on": "依赖",
    "uses": "使用",
    "related_to": "关联",
    "revision": "版本",
    "plainText": "以安全的纯文本显示 Markdown；不会执行内嵌 HTML 或链接。",
    "draft": "操作草稿：未安装，也不代表已获执行授权。",
    "ready": "可采集新成果",
    "notReady": "当前不可采集",
    "paused": "已暂停",
    "pending": "待处理：{count}",
    "reason": "采集条件",
    "unknown": "未知",
    "done": "已处理",
    "skipped": "无新增持久成果",
    "captured": "阶段已保存",
    "organizing": "正在整理主题",
    "capturing": "正在提取阶段",
    "queued": "排队中",
    "waiting_source": "等待来源",
    "failed": "失败",
    "job": "处理任务",
    "turn": "第 {turn} 回合",
    "statusHelp": "“已处理”只表示此次采集阶段结束，不代表项目完成。阶段保存与主题整理是两个独立步骤。",
    "disabled": "采集未启用",
    "workspace_denied": "工作区未授权",
    "read_only": "会话为只读",
    "write_denied": "无写入权限",
    "no_source": "来源不可用",
    "not_configured": "配置不完整",
    "storage": "上下文目录",
    "storageHelp": "确认后接入此目录，并启用下方工作目录的成果记录；不搬移已有文档。",
    "storageUnset": "尚未选择目录",
    "storageReload": "重新读取当前目录",
    "storageLoading": "正在读取存储位置…",
    "storageSaving": "正在保存位置…",
    "storageSaved": "目录已接入，将记录此工作目录的新成果；仍需当前会话模型可用并具有写入权限。",
    "storageChanged": "目录已在别处变更。请重新读取当前目录后再选择。",
    "storageUnavailable": "暂时无法读取存储目录。可重新读取后再试，技术详情见下方。",
    "storageReadonly": "当前连接可以查看目录，但不能更改。",
    "storageDenied": "当前连接无权读取存储目录。",
    "storageInvalid": "请选择已有宿主目录，以及有绝对工作目录的真实会话。",
    "storageRejected": "宿主未接受此目录或工作目录。请确认目录存在、不是符号链接，并且允许使用。",
    "storageError": "未能确认接入结果，设置可能已经保存。请重新读取当前目录后再确认。",
    "storageBrowseTitle": "选择已有宿主目录",
    "storageBrowseHelp": "打开文件夹只作浏览。确认目录即接入上方所示工作目录；取消不会改动。",
    "storageChoose": "确认使用此目录",
    "storageCloseBrowse": "取消",
    "storageHome": "宿主主目录",
    "storageHidden": "显示隐藏目录",
    "storageNoFolders": "此目录下没有可见的子目录。",
    "storageBrowseError": "暂时无法浏览目录。可返回宿主主目录重试，或取消后重新选择。",
    "storagePickerUnavailable": "当前连接无法使用宿主目录选择器。请取消并检查宿主目录服务。",
    "storageNativeWaiting": "正在等待 DSH 宿主上的目录选择窗口（最多两分钟）。关闭此区域会取消请求。",
    "storageBrowseLoading": "正在读取宿主目录…",
    "storageClientMissing": "当前页面没有原生 Settings 客户端服务。请刷新页面，并检查 DSH Remote 服务是否加载。",
    "storageHostFailed": "原生 Settings API 返回失败。下方仅显示安全错误码，用于定位宿主或接口问题，不包含任何配置值。",
    "storageRequestFailed": "Settings 请求未取得有效响应。请检查连接后重新读取已保存设置。",
    "storageResponseInvalid": "原生 Settings 响应格式不符合预期。请检查当前页面与宿主 DSH 版本是否兼容。",
    "storageDescriptorMissing": "原生 Settings 已响应，但没有提供 CtxKit 配置项。请确认宿主已加载带 Config schema 的新版 CtxKit；只更新页面并不足以更新宿主代码。",
    "storageDescriptorAmbiguous": "原生 Settings 返回了重复的 CtxKit 配置项。未选择任何一项，请检查宿主插件注册。",
    "storageSchemaIncompatible": "宿主尚未提供完整的目录、工作目录与会话模型设置。请先更新 CtxKit 宿主插件；只更新页面不能完成接入。",
    "storageValueInvalid": "已找到 CtxKit 配置项，但配置值或版本号格式不符合预期。未接受任何配置值；请检查宿主插件版本后重新读取。",
    "storageSelect": "选择目录",
    "storageChange": "更换目录",
    "storageDetails": "技术详情",
    "files": "文件",
    "fileSearch": "查找上下文文件",
    "fileSearchHint": "文件名、路径或标题",
    "sessionSearch": "搜索会话",
    "sessionsHelp": "搜索已采集的会话档案，不会扫描全部 DSH 历史聊天。",
    "treeHelp": "文件夹来自本页受管理的文件。展开目录，点击文件阅读正文；翻页可查看更多文件。",
    "expandFolder": "展开 {name}",
    "collapseFolder": "收起 {name}",
    "storagePickHint": "选择 DSH 宿主上的文件夹，不上传文件",
    "setupWorkspace": "仅此工作目录",
    "setupConsent": "只记录此工作目录的新成果，使用各会话当前模型整理，会产生额外模型调用。不导入历史，不搬移文档，不更改会话文件权限。",
    "setupSelectSession": "确认前请先在侧栏选择真实会话，以确定工作目录；仍可浏览宿主文件夹。",
    "storageUseExisting": "使用此目录",
    "storagePanelGuide": "在侧栏打开“上下文库”，即可选择目录、展开文件树阅读，并在 Sessions 中搜索会话。",
    "modelUnavailable": "当前会话模型不可用"
  }
} /* LOCALES_END */;
    const NS = 'ctxkit.library';
    const PAGE = 'ctxkit-library';
    const css = `
.ctxkit-library { box-sizing:border-box; height:100%; overflow:auto; padding:calc(var(--dsh-frame-top-clearance, 0px) + 28px) clamp(20px,4vw,48px) 48px; color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-base); font:inherit; line-height:1.5; }
.ctxkit-library * { box-sizing:border-box; }
.ctxkit-library .ck-content { max-width:960px; margin:0 auto; min-width:0; }
.ctxkit-library h1 { font-size:24px; line-height:1.3; margin:0 0 12px; padding-inline-start:var(--dsh-frame-leading-clearance,0px); }
.ctxkit-library h2 { font-size:18px; margin:0 0 8px; }
.ctxkit-library p { margin:8px 0; }
.ctxkit-library .ck-muted { color:var(--dsw-alias-label-secondary); font-size:13px; }
.ctxkit-library .ck-scope { padding:12px 16px; border:1px solid var(--dsw-alias-border-l2); border-radius:12px; margin:20px 0; overflow-wrap:anywhere; }
.ctxkit-library .ck-toolbar, .ctxkit-library .ck-tabs, .ctxkit-library .ck-pages, .ctxkit-library .ck-meta { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
.ctxkit-library .ck-tabs { border-bottom:1px solid var(--dsw-alias-border-l2); margin:20px 0; padding-bottom:8px; }
.ctxkit-library button, .ctxkit-library input, .ctxkit-library select { font:inherit; color:inherit; border:1px solid var(--dsw-alias-border-l2); border-radius:8px; background:var(--dsw-alias-bg-base); min-height:40px; padding:8px 12px; }
.ctxkit-library button { cursor:pointer; transition:background-color 150ms; }
.ctxkit-library button:disabled { cursor:default; opacity:.5; }
.ctxkit-library button[aria-pressed=true] { border-color:var(--dsw-alias-state-business-primary); color:var(--dsw-alias-state-business-primary); }
.ctxkit-library :is(button,input,select):focus-visible { outline:2px solid var(--dsw-alias-state-business-primary); outline-offset:2px; }
.ctxkit-library .ck-search { display:flex; flex-direction:column; gap:4px; flex:1; min-width:min(220px,100%); }
.ctxkit-library .ck-toolbar { align-items:flex-end; margin-bottom:16px; }
.ctxkit-library .ck-toolbar input { width:100%; }
.ctxkit-library ul { list-style:none; margin:0; padding:0; }
.ctxkit-library .ck-row { border-bottom:1px solid var(--dsw-alias-border-l2); padding:16px 0; overflow-wrap:anywhere; }
.ctxkit-library .ck-open { text-align:start; font-weight:600; border:0; padding:4px 0; border-radius:4px; min-height:32px; max-width:100%; overflow-wrap:anywhere; }
.ctxkit-library .ck-excerpt { white-space:pre-wrap; font-size:14px; line-height:1.6; }
.ctxkit-library .ck-badge { padding:2px 8px; border:1px solid var(--dsw-alias-border-l2); border-radius:6px; font-size:12px; }
.ctxkit-library .ck-notice { margin:16px 0; padding:20px; border:1px solid var(--dsw-alias-border-l2); border-radius:12px; overflow-wrap:anywhere; }
.ctxkit-library .ck-pages { justify-content:flex-end; margin:20px 0; }
.ctxkit-library .ck-pages span { margin-inline-end:auto; }
.ctxkit-library .ck-document { white-space:pre-wrap; overflow-wrap:anywhere; font-family:inherit; font-size:var(--dsh-content-font-size,14px); line-height:1.8; max-width:78ch; margin:24px 0; }
.ctxkit-library .ck-detail-title { margin-top:20px; overflow-wrap:anywhere; }
.ctxkit-library .ck-storage { border:1px solid var(--dsw-alias-border-l2); border-radius:12px; padding:20px; margin:24px 0; }
.ctxkit-library .ck-storage-path { overflow-wrap:anywhere; }
.ctxkit-library summary { cursor:pointer; min-height:44px; padding-block:8px; }
.ctxkit-library .ck-folders { border-top:1px solid var(--dsw-alias-border-l2); padding-top:16px; margin-top:20px; }
.ctxkit-library .ck-folder-list { max-height:260px; overflow:auto; margin:12px 0; }
.ctxkit-library .ck-folder-list button { text-align:start; width:100%; overflow-wrap:anywhere; }
.ctxkit-library .ck-folders input[type=checkbox] { min-height:20px; width:20px; }
.ctxkit-library .ck-folders label { min-height:44px; padding-block:8px; cursor:pointer; }
.ctxkit-library .ck-folders h3 { margin:0; }
.ctxkit-library .ck-directory-pick { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; width:100%; min-height:152px; border:2px dashed var(--dsw-alias-border-l2); padding:24px; }
.ctxkit-library .ck-directory-pick.is-connected { display:inline-flex; flex-direction:row; min-height:44px; width:auto; border-style:solid; border-width:1px; padding:8px 12px; }
.ctxkit-library .ck-setup-consent { margin:16px 0 8px; overflow-wrap:anywhere; font-size:14px; }
.ctxkit-library .ck-storage-empty { border:0; padding:0; }
.ctxkit-library .ck-processing { display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; color:var(--dsw-alias-label-secondary); font-size:13px; margin:8px 0; }
.ctxkit-library .ck-scope summary { cursor:pointer; }
.ctxkit-library .ck-tree { border:1px solid var(--dsw-alias-border-l2); border-radius:12px; padding:8px; }
.ctxkit-library .ck-tree-branch { padding-inline-start:18px; border-inline-start:1px solid var(--dsw-alias-border-l2); margin-inline-start:13px; }
.ctxkit-library .ck-tree-row { display:flex; align-items:center; flex-wrap:wrap; width:100%; min-height:44px; border:0; text-align:start; gap:8px; background:transparent; }
.ctxkit-library .ck-tree-chevron { width:14px; flex:none; text-align:center; }
.ctxkit-library .ck-tree-row svg { flex:none; }
.ctxkit-library .ck-tree-name { overflow-wrap:anywhere; min-width:0; }
.ctxkit-library .ck-tree-title { overflow-wrap:anywhere; min-width:0; }
@media(max-width:600px) { .ctxkit-library .ck-tree-branch { padding-inline-start:10px; margin-inline-start:8px; } .ctxkit-library .ck-tree-title { flex-basis:100%; padding-inline-start:30px; } }
@media(hover:hover) { .ctxkit-library button:not(:disabled):hover { background:var(--dsw-alias-interactive-bg-hover); } }
@media(pointer:coarse) { .ctxkit-library :is(button,input,select) { min-height:44px; } .ctxkit-library :is(input,select) { font-size:16px; } }
@media(prefers-reduced-motion:reduce) { .ctxkit-library button { transition:none; } }
`;
    const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
    const text = (value, max = 500) => typeof value === 'string' ? value.slice(0, max) : '';
    const pathOf = value => typeof value === 'string' && value.length <= 300 && /^(?:INDEX\.md|(?:topics|sessions)\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.md)$/.test(value) ? value : null;
    const codeOf = value => typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value) ? value : '';
    const failure = kind => ({ ok: false, state: kind });
    function decode(response) {
      if (!response?.ok) return failure(/denied|forbidden|unauthorized|permission/i.test(response?.error?.code ?? '') ? 'denied' : 'error');
      const result = response.value?.result;
      if (!result) return failure('unavailable');
      if (typeof result.text !== 'string' || result.text.length > 25000) return failure('error');
      try {
        const value = JSON.parse(result.text);
        if (!value || typeof value !== 'object' || typeof value.ok !== 'boolean') return failure('error');
        if (value.ok && result.kind !== 'success') return failure('error');
        return value;
      } catch { return failure('error'); }
    }
    // The shipped native Loader entry is id: ctxkit. Never guess a namespace
    // from unrelated settings values, and never retain their descriptors.
    const SETTINGS_NS = 'ctxkit';
    const absoluteRoot = value => typeof value === 'string' && value.length > 0 && value.length <= 4096
      && !/[\u0000-\u001f]/.test(value) && (/^\//.test(value) || /^[a-zA-Z]:[\\/]/.test(value) || /^\\\\[^\\]+\\[^\\]+/.test(value));
    function storageDescriptorProblem(row) {
      if (row?.ns !== SETTINGS_NS || !Number.isSafeInteger(row.revision) || row.revision < 0) return 'CTXKIT_SETTINGS_VALUE_INVALID';
      const wire = row.schema;
      const resolve = value => typeof value === 'number' ? wire?.refs?.[value] : value;
      const schema = wire?.refs ? resolve(wire.uid) : wire;
      const scopes = resolve(schema?.dict?.allowedWorkspaces);
      if (schema?.type !== 'object' || resolve(schema.dict?.root)?.type !== 'string' || resolve(schema.dict?.enabled)?.type !== 'boolean'
        || resolve(schema.dict?.useSessionModel)?.type !== 'boolean' || resolve(schema.dict?.exactWorkspaces)?.type !== 'boolean'
        || scopes?.type !== 'array' || resolve(scopes.inner)?.type !== 'string') return 'CTXKIT_SETTINGS_SCHEMA_INCOMPATIBLE';
      if (typeof row.value?.root !== 'string' || row.value.root.length > 4096 || typeof row.value.enabled !== 'boolean'
        || typeof row.value.useSessionModel !== 'boolean' || typeof row.value.exactWorkspaces !== 'boolean'
        || !Array.isArray(row.value.allowedWorkspaces) || row.value.allowedWorkspaces.length > 256 || row.value.allowedWorkspaces.some(path => !absoluteRoot(path))) return 'CTXKIT_SETTINGS_VALUE_INVALID';
      return null;
    }
    function storageDescriptor(row) {
      return storageDescriptorProblem(row) ? null : { ns: row.ns, revision: row.revision, root: row.value.root, enabled: row.value.enabled,
        allowedWorkspaces: [...row.value.allowedWorkspaces], useSessionModel: row.value.useSessionModel, exactWorkspaces: row.value.exactWorkspaces };
    }
    function canBrowseStorage(descriptor, session) {
      if (!descriptor?.root || !Array.isArray(descriptor.allowedWorkspaces) || !absoluteRoot(session?.cwd)) return false;
      const normalized = value => value.replace(/\\/g, '/').replace(/\/+$/, '');
      const cwd = normalized(session.cwd);
      return descriptor.allowedWorkspaces.some(path => { const base = normalized(path); return cwd === base || (!descriptor.exactWorkspaces && cwd.startsWith(base + '/')); });
    }
    const storageDiagnostics = {
      CTXKIT_SETTINGS_CLIENT_SERVICE_MISSING: 'storageClientMissing',
      CTXKIT_SETTINGS_HOST_FAILED: 'storageHostFailed',
      CTXKIT_SETTINGS_REQUEST_FAILED: 'storageRequestFailed',
      CTXKIT_SETTINGS_RESPONSE_INVALID: 'storageResponseInvalid',
      CTXKIT_SETTINGS_DESCRIPTOR_MISSING: 'storageDescriptorMissing',
      CTXKIT_SETTINGS_DESCRIPTOR_AMBIGUOUS: 'storageDescriptorAmbiguous',
      CTXKIT_SETTINGS_SCHEMA_INCOMPATIBLE: 'storageSchemaIncompatible',
      CTXKIT_SETTINGS_VALUE_INVALID: 'storageValueInvalid',
    };
    const nativeCodeOf = value => typeof value === 'string' && /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]{0,59}$/.test(value) && value.length <= 90 ? value : '';
    const storageDiagnostic = diagnostic => ({ ...failure('unavailable'), diagnostic });
    function storageFailure(response, describing = false) {
      const code = response?.error?.code ?? '';
      return failure(code === 'settings/conflict' ? 'conflict' : code === 'settings/rejected' ? 'rejected'
        : /denied|forbidden|unauthorized|permission/.test(code) ? 'denied'
          : describing || /unavailable|not-found|not-implemented/.test(code) ? 'unavailable' : 'error');
    }
    function Notice({ t, kind, code }) {
      const known = ['noSession', 'unconfigured', 'denied', 'error', 'timeout', 'unavailable', 'empty', 'noMatches'];
      const name = known.includes(kind) ? kind : 'error';
      return h('section', { className: 'ck-notice', role: ['denied', 'error', 'timeout', 'unavailable'].includes(name) ? 'alert' : 'status' },
        h('h2', null, t(name)), h('p', null, t(name + 'Body')),
        codeOf(code) ? h('p', { className: 'ck-muted' }, codeOf(code)) : null);
    }
    // Only bounded, Host-managed records become tree leaves. Inferred directories
    // are navigation structure, never candidates for arbitrary filesystem reads.
    function buildTree(records) {
      const root = new Map(), seen = new Set();
      for (const row of Array.isArray(records) ? records.slice(0, 50) : []) {
        const path = pathOf(row?.path);
        if (!path || seen.has(path)) continue;
        const parts = path.split('/');
        if (parts.length > 20) continue;
        seen.add(path);
        let branch = root;
        for (let index = 0; index < parts.length; index++) {
          const name = parts[index], current = parts.slice(0, index + 1).join('/');
          if (index === parts.length - 1) branch.set(name, { path, name, kind: 'file', title: text(row.title), recordKind: text(row.kind, 80), revision: text(row.revision, 80) });
          else {
            if (!branch.has(name)) branch.set(name, { path: current, name, kind: 'directory', children: new Map() });
            branch = branch.get(name).children;
          }
        }
      }
      const sorted = branch => [...branch.values()].sort((a, b) => a.kind !== b.kind ? a.kind === 'directory' ? -1 : 1 : a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
        .map(node => node.kind === 'directory' ? { ...node, children: sorted(node.children) } : node);
      return sorted(root);
    }
    function FolderIcon({ file = false, size = 20 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, 'aria-hidden': true },
        h('path', { d: file ? 'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6' : 'M3 7V5h6l2 2h10v13H3z' }));
    }
    function FileTree({ t, records, expanded, onToggle, onOpen }) {
      const id = React.useId();
      const render = nodes => nodes.map(node => {
        const folder = node.kind === 'directory', opened = expanded.has(node.path), group = id + '-' + encodeURIComponent(node.path);
        return h('li', { key: node.path, className: 'ck-tree-item' },
          h('button', { type: 'button', className: 'ck-tree-row',
            ...(folder ? { 'aria-expanded': opened, 'aria-controls': group, 'aria-label': t(opened ? 'collapseFolder' : 'expandFolder', { name: node.name }) } : {}),
            onClick: () => folder ? onToggle(node.path) : onOpen(node.path) },
            h('span', { className: 'ck-tree-chevron', 'aria-hidden': true }, folder ? opened ? '−' : '+' : ''),
            h(FolderIcon, { file: !folder }), h('span', { className: 'ck-tree-name' }, node.name),
            !folder && node.title && node.title !== node.name ? h('span', { className: 'ck-muted ck-tree-title' }, node.title) : null),
          folder ? h('ul', { id: group, hidden: !opened, className: 'ck-tree-branch' }, render(node.children)) : null);
      });
      return h('nav', { className: 'ck-tree', 'aria-label': t('files') }, h('ul', null, render(buildTree(records))));
    }
    function Icon({ size = 18 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true },
        h('path', { d: 'M4 4h6v16H4zM10 4h6v16h-6zM17 5l3-1 4 15-3 1z', transform: 'translate(-1 0)' }));
    }
    function Pager({ t, data, previous, onPrevious, onNext, document = false }) {
      const start = count(data.offset), length = document ? text(data.body, 24000).length : (Array.isArray(data.results) ? data.results.length : 0);
      const total = count(document ? data.totalChars : data.total);
      const next = Number.isSafeInteger(data.nextOffset) && data.nextOffset > start ? data.nextOffset : null;
      return h('nav', { className: 'ck-pages', 'aria-label': t(document ? 'document' : 'title') },
        h('span', { className: 'ck-muted' }, t(document ? 'part' : 'range', { start: length ? start + 1 : 0, end: start + length, total })),
        h('button', { type: 'button', disabled: !previous.length, onClick: onPrevious }, t('previous')),
        h('button', { type: 'button', disabled: next === null, onClick: () => onNext(next) }, t('next')));
    }
    function Processing({ t, value }) {
      if (!value || typeof value !== 'object') return null;
      const reasons = { CTXKIT_READ_ONLY: 'read_only', CTXKIT_PAUSED: 'paused', CTXKIT_VAULT_NOT_WRITABLE: 'write_denied', CTXKIT_WORKSPACE_DENIED: 'workspace_denied', CTXKIT_UNCONFIGURED: 'not_configured', CTXKIT_CAPTURE_DISABLED: 'disabled', CTXKIT_MODEL_UNAVAILABLE: 'modelUnavailable' };
      return h('div', { className: 'ck-processing', role: 'status' },
        h('div', { className: 'ck-meta' },
          h('strong', null, t(value.paused ? 'paused' : value.captureEligible === true ? 'ready' : value.captureEligible === false ? 'notReady' : 'unknown')),
          h('span', { className: 'ck-badge' }, t('pending', { count: count(value.pending) }))),
        value.reason ? h('p', { className: 'ck-muted' }, t('reason'), ': ', reasons[value.reason] ? t(reasons[value.reason]) : codeOf(value.reason) || t('unknown')) : null,
        codeOf(value.adapterNotice) ? h('p', { className: 'ck-muted' }, codeOf(value.adapterNotice)) : null);
    }
    function Library({ t, session, startRead }) {
      const [tab, setTab] = React.useState('files');
      const [draft, setDraft] = React.useState('');
      const [search, setSearch] = React.useState('');
      const [expanded, setExpanded] = React.useState(() => new Set(['topics', 'sessions']));
      const [offset, setOffset] = React.useState(0);
      const [previous, setPrevious] = React.useState([]);
      const [detail, setDetail] = React.useState(null);
      const [reload, setReload] = React.useState(0);
      const [loaded, setLoaded] = React.useState(null);
      const heading = React.useRef(null);
      const focusOnLoad = React.useRef(false);
      const args = detail ? { action: 'read', path: detail.path, offset: detail.offset, limit: 10000 }
        : { action: tab === 'files' ? 'tree' : 'sessions', query: search, offset, limit: tab === 'files' ? 50 : 20 };
      const requestKey = JSON.stringify([args, reload]);
      // Gate the render as well as the callback: old rows disappear in the very
      // render that changes scope/filter/path, before any passive effect runs.
      const current = loaded?.key === requestKey ? loaded.value : null;
      React.useEffect(() => startRead(session.id, args, value => {
        setLoaded({ key: requestKey, value });
      }), [requestKey, session.id, startRead]);
      React.useEffect(() => {
        if (current && focusOnLoad.current) { focusOnLoad.current = false; heading.current?.focus(); }
      }, [current]);
      const changeTab = next => { setTab(next); setDraft(''); setSearch(''); setOffset(0); setPrevious([]); setDetail(null); };
      const open = path => { if (pathOf(path)) { focusOnLoad.current = true; setDetail({ path, offset: 0, previous: [], parent: detail }); } };
      const back = () => { focusOnLoad.current = true; setDetail(detail?.parent ?? null); };
      const controls = detail
        ? h('button', { type: 'button', onClick: back }, t('back'))
        : h(React.Fragment, null,
          h('nav', { className: 'ck-tabs', 'aria-label': t('title') }, ['files', 'sessions'].map(name =>
            h('button', { type: 'button', key: name, 'aria-pressed': tab === name, onClick: () => changeTab(name) }, t(name)))),
          h('form', { className: 'ck-toolbar', onSubmit: event => { event.preventDefault(); setSearch(draft.trim()); setOffset(0); setPrevious([]); } },
            h('label', { className: 'ck-search' }, t(tab === 'files' ? 'fileSearch' : 'sessionSearch'), h('input', { type: 'search', maxLength: 300, value: draft, placeholder: t(tab === 'files' ? 'fileSearchHint' : 'searchHint'), onChange: event => setDraft(event.target.value) })),
            h('button', { type: 'submit' }, t('searchAction')),
            h('button', { type: 'button', disabled: !(draft || search), onClick: () => { setDraft(''); setSearch(''); setOffset(0); setPrevious([]); } }, t('clear'))));
      let body;
      if (!current) body = h('p', { role: 'status', 'aria-live': 'polite' }, t('loading'));
      else if (current.configured === false || ['unconfigured', 'setup_required'].includes(current.state)) body = h(Notice, { t, kind: 'unconfigured' });
      else if (!current.ok) body = h(Notice, { t, kind: current.state, code: current.error });
      else if (detail) body = h(React.Fragment, null,
        h('h2', { className: 'ck-detail-title', ref: heading, tabIndex: -1 }, text(current.title) || t('document')),
        h('p', { className: 'ck-muted' }, text(current.path, 300)),
        current.kind === 'skill-draft' ? h('p', { className: 'ck-notice' }, t('draft')) : null,
        h('p', { className: 'ck-muted' }, t('plainText')),
        h('article', { className: 'ck-document' }, text(current.body, 24000)),
        h('p', { className: 'ck-muted' }, t('revision'), ': ', text(current.revision, 80)),
        Array.isArray(current.metadata?.sources) && current.metadata.sources.length ? h('section', null,
          h('h2', null, t('sources')), h('ul', null, current.metadata.sources.slice(0, 8).map(path =>
            h('li', { key: path }, h('button', { type: 'button', className: 'ck-open', onClick: () => open(path) }, text(path, 300)))))) : null,
        h(Pager, { t, data: current, document: true, previous: detail.previous,
          onNext: next => { focusOnLoad.current = true; setDetail({ ...detail, offset: next, previous: [...detail.previous, detail.offset] }); },
          onPrevious: () => { focusOnLoad.current = true; setDetail({ ...detail, offset: detail.previous.at(-1), previous: detail.previous.slice(0, -1) }); } }),
        Array.isArray(current.children) && current.children.length ? h('section', null, h('h2', null, t('children')), h('ul', null,
          current.children.slice(0, 50).map(item => h('li', { key: item.path }, h('button', { className: 'ck-open', type: 'button', onClick: () => open(item.path) }, text(item.title) || text(item.path)))))) : null,
        Array.isArray(current.related) && current.related.length ? h('section', null, h('h2', null, t('relations')), h('ul', null,
          current.related.slice(0, 20).map((item, index) => h('li', { key: index, className: 'ck-row' },
            h('div', { className: 'ck-meta' },
              h('button', { type: 'button', className: 'ck-open', disabled: !/^topic_[a-z0-9][a-z0-9_-]{0,63}$/.test(item.from), onClick: () => open('topics/' + item.from + '/OVERVIEW.md') }, text(item.from, 100)),
              h('span', null, t(['part_of', 'depends_on', 'uses', 'related_to'].includes(item.type) ? item.type : 'unknown')),
              h('button', { type: 'button', className: 'ck-open', disabled: !/^topic_[a-z0-9][a-z0-9_-]{0,63}$/.test(item.to), onClick: () => open('topics/' + item.to + '/OVERVIEW.md') }, text(item.to, 100))),
            h('p', null, text(item.reason)),
            Array.isArray(item.sources) && item.sources.length ? h('div', { className: 'ck-meta' }, h('span', { className: 'ck-muted' }, t('sources')),
              item.sources.slice(0, 3).map(path => h('button', { key: path, type: 'button', className: 'ck-open', onClick: () => open(path) }, text(path, 300)))) : null)))) : null);
      else {
        const rows = Array.isArray(current.results) ? current.results.slice(0, 50) : [];
        body = h(React.Fragment, null,
          h('h2', { ref: heading, tabIndex: -1 }, t(tab)),
          h(Processing, { t, value: current.processing }),
          tab === 'files' ? h('p', { className: 'ck-muted' }, t('treeHelp')) : h('p', { className: 'ck-muted' }, t('sessionsHelp')),
          rows.length ? tab === 'files'
            ? h(FileTree, { t, records: rows, expanded, onOpen: open, onToggle: path => setExpanded(previous => { const next = new Set(previous); next.has(path) ? next.delete(path) : next.add(path); return next; }) })
            : h('ul', null, rows.map((item, index) => h('li', { className: 'ck-row', key: item.path || item.id || index },
              h('button', { type: 'button', className: 'ck-open', disabled: !pathOf(item.path), onClick: () => open(item.path) }, text(item.title) || t('document')),
              h('p', { className: 'ck-excerpt' }, text(item.excerpt)), h('p', { className: 'ck-muted' }, text(item.path, 300)),
              h('div', { className: 'ck-meta' }, [...(Array.isArray(item.topics) ? item.topics : []), ...(Array.isArray(item.sessions) ? item.sessions : [])].slice(0, 24).map(link =>
                h('button', { key: link.path, type: 'button', className: 'ck-open', disabled: !pathOf(link.path), onClick: () => open(link.path) }, text(link.title) || text(link.path, 300)))),
              item.linksTruncated ? h('p', { className: 'ck-muted' }, t('truncated')) : null)))
            : h(Notice, { t, kind: search ? 'noMatches' : 'empty' }),
          h(Pager, { t, data: current, previous, onNext: next => { focusOnLoad.current = true; setPrevious([...previous, offset]); setOffset(next); }, onPrevious: () => { focusOnLoad.current = true; setOffset(previous.at(-1)); setPrevious(previous.slice(0, -1)); } }));
      }
      return h(React.Fragment, null, controls,
        h('div', { className: 'ck-toolbar' }, h('p', { className: 'ck-muted' }, t('snapshot')), h('button', { type: 'button', disabled: !current, onClick: () => { focusOnLoad.current = true; setReload(reload + 1); } }, t('refresh'))),
        h('div', { 'aria-busy': !current }, body),
        current?.truncated || current?.relatedTruncated || current?.childrenTruncated || current?.metadataTruncated ? h('p', { className: 'ck-notice', role: 'status' }, t('truncated')) : null);
    }
    function StorageChooser({ t, startStorage, startChoosing, canWrite, canList, canPick, useSettingsRevision, useStorageOutcome, session, onStorage }) {
      const revision = useSettingsRevision(value => value), uncertain = useStorageOutcome(value => value);
      const [loaded, setLoaded] = React.useState(null), [busy, setBusy] = React.useState(false), [message, setMessage] = React.useState('');
      const [folderOpen, setFolderOpen] = React.useState(false), [folders, setFolders] = React.useState(null), [hidden, setHidden] = React.useState(false);
      const chooser = React.useRef(null), cancelLoad = React.useRef(() => {}), busyNow = React.useRef(false);
      const chooseButton = React.useRef(null), folderTitle = React.useRef(null), reloadButton = React.useRef(null), focusAfter = React.useRef(false);
      const ids = React.useId(), descriptor = loaded?.descriptor;
      const sessionReady = typeof session?.id === 'string' && session.id.length > 0 && absoluteRoot(session.cwd);
      const setupReady = descriptor?.enabled && descriptor.useSessionModel && descriptor.exactWorkspaces && sessionReady && descriptor.allowedWorkspaces.length === 1 && descriptor.allowedWorkspaces[0] === session.cwd;
      const changed = !!descriptor && revision > descriptor.revision;
      const needsReload = changed || uncertain || (!!message && message !== 'storageSaved');
      const writable = canWrite && loaded?.writable === true;
      const load = (acknowledge = false) => {
        if (busyNow.current) return;
        chooser.current?.cancel(); chooser.current = null; cancelLoad.current();
        busyNow.current = true; setBusy(true); setMessage(''); setFolderOpen(false); setFolders(null); setLoaded(null);
        cancelLoad.current = startStorage({ action: 'load', acknowledge }, value => {
          busyNow.current = false; setBusy(false); setLoaded(value); onStorage?.(value.ok ? value.descriptor : null);
          if (!value.ok) setMessage(value.state === 'denied' ? 'storageDenied' : 'storageUnavailable');
        });
      };
      React.useEffect(() => { load(); }, [startStorage]);
      // Layout cleanup closes the chooser before promise callbacks can run after
      // an owner panel/permission-key unmount, not a later passive-effect pass.
      React.useLayoutEffect(() => () => {
        chooser.current?.cancel(); chooser.current = null; cancelLoad.current(); busyNow.current = false;
      }, [startStorage, startChoosing]);
      const closeChooser = () => {
        chooser.current?.cancel(); chooser.current = null; setFolderOpen(false); setFolders(null); focusAfter.current = true;
      };
      const choose = (existing = false) => {
        if (busyNow.current || chooser.current || !writable || needsReload || (existing && !sessionReady)) return;
        setMessage(''); setFolders(null); setFolderOpen(!existing); setHidden(false);
        chooser.current = startChoosing({ ns: descriptor.ns, revision: descriptor.revision, path: absoluteRoot(descriptor.root) ? descriptor.root : undefined,
          sessionId: session?.id, workspace: session?.cwd, existing, canList, canPick }, value => {
          if (value.choosing) { setFolders(value.loading ? null : value); return; }
          if (value.saving) { busyNow.current = true; setBusy(true); setFolderOpen(false); setFolders(null); return; }
          chooser.current = null; busyNow.current = false; setBusy(false); setFolderOpen(false); setFolders(null); focusAfter.current = true;
          if (value.cancelled) return;
          if (value.ok) { setLoaded({ ...loaded, descriptor: value.descriptor }); setMessage('storageSaved'); onStorage?.(value.descriptor); }
          else setMessage(value.state === 'conflict' ? 'storageChanged' : value.state === 'rejected' ? 'storageRejected' : value.state === 'invalid' ? 'storageInvalid' : value.state === 'denied' ? 'storageReadonly' : 'storageError');
        });
        if (existing) chooser.current?.confirm(descriptor.root);
      };
      React.useEffect(() => { if (folderOpen && !folders?.nativeWaiting) folderTitle.current?.focus(); }, [folderOpen, folders]);
      React.useEffect(() => { if (!busy && !folderOpen && focusAfter.current) { focusAfter.current = false; (needsReload ? reloadButton : chooseButton).current?.focus(); } }, [busy, folderOpen, needsReload]);
      React.useLayoutEffect(() => { if (changed && !busyNow.current) closeChooser(); }, [changed]);
      const folderRows = folders?.entries?.filter(row => hidden || !row.hidden) ?? [];
      const notice = uncertain ? 'storageError' : changed ? 'storageChanged' : message;
      return h('section', { className: 'ck-storage' + (descriptor?.root ? ' ck-storage-connected' : ' ck-storage-empty'), 'aria-labelledby': ids + '-title', 'aria-busy': busy },
        h('h2', { id: ids + '-title' }, t('storage')),
        descriptor?.root ? h('p', { className: 'ck-storage-path' }, descriptor.root) : null,
        h('button', { type: 'button', ref: chooseButton, className: 'ck-directory-pick' + (descriptor?.root ? ' is-connected' : ''), 'aria-describedby': ids + '-help', disabled: busy || folderOpen || !writable || needsReload || !descriptor, onClick: () => choose(false) },
          h(FolderIcon, { size: descriptor?.root ? 20 : 32 }), h('strong', null, t(descriptor?.root ? 'storageChange' : 'storageSelect')),
          !descriptor?.root ? h('span', { className: 'ck-muted' }, t('storagePickHint')) : null),
        h('p', { id: ids + '-help', className: 'ck-muted' }, t('storageHelp')),
        sessionReady ? h('div', { className: 'ck-setup-consent' }, h('p', null, t('setupWorkspace'), ': ', h('strong', null, session.cwd)), h('p', { className: 'ck-muted' }, t('setupConsent')))
          : h('p', { className: 'ck-muted' }, t('setupSelectSession')),
        descriptor?.root && !setupReady ? h('button', { type: 'button', className: 'ck-use-existing', disabled: busy || folderOpen || !writable || needsReload || !sessionReady, onClick: () => choose(true) }, t('storageUseExisting')) : null,
        busy ? h('p', { role: 'status' }, t(descriptor ? 'storageSaving' : 'storageLoading')) : null,
        descriptor && !writable ? h('p', null, t('storageReadonly')) : null,
        notice && !busy ? h('p', { role: notice === 'storageSaved' ? 'status' : 'alert' }, t(notice)) : null,
        loaded?.diagnostic && storageDiagnostics[loaded.diagnostic] ? h('details', null, h('summary', null, t('storageDetails')),
          h('p', null, t(storageDiagnostics[loaded.diagnostic])),
          h('p', { className: 'ck-muted' }, codeOf(loaded.diagnostic), nativeCodeOf(loaded.nativeCode) ? ' · ' + nativeCodeOf(loaded.nativeCode) : '')) : null,
        needsReload || (loaded && !loaded.ok) ? h('button', { type: 'button', ref: reloadButton, disabled: busy, onClick: () => load(true) }, t('storageReload')) : null,
        folderOpen && !changed && writable ? h('section', { className: 'ck-folders', 'aria-labelledby': ids + '-folders', 'aria-busy': !folders || !!folders.nativeWaiting,
          onKeyDown: event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeChooser(); } } },
          h('h3', { id: ids + '-folders', ref: folderTitle, tabIndex: -1 }, t('storageBrowseTitle')),
          h('p', null, t('storageBrowseHelp')),
          !folders || folders.nativeWaiting ? h('p', { role: 'status' }, t(folders?.nativeWaiting ? 'storageNativeWaiting' : 'storageBrowseLoading'))
            : !folders.ok ? h('p', { role: 'alert' }, t(folders.state === 'unavailable' || folders.state === 'denied' ? 'storagePickerUnavailable' : 'storageBrowseError'))
              : h(React.Fragment, null,
                h('p', { className: 'ck-storage-path' }, folders.path),
                h('nav', { className: 'ck-meta', 'aria-label': t('storageBrowseTitle') }, folders.crumbs.map(row => h('button', { key: row.path, type: 'button', disabled: row.path === folders.path, onClick: () => chooser.current?.navigate(row.path) }, row.name))),
                h('label', { className: 'ck-meta' }, h('input', { type: 'checkbox', checked: hidden, onChange: event => setHidden(event.target.checked) }), t('storageHidden')),
                folderRows.length ? h('ul', { className: 'ck-folder-list' }, folderRows.map(row => h('li', { key: row.path }, h('button', { type: 'button', onClick: () => chooser.current?.navigate(row.path) }, row.name)))) : h('p', null, t('storageNoFolders')),
                folders.truncated ? h('p', { role: 'status' }, t('truncated')) : null,
                h('button', { type: 'button', disabled: !sessionReady, onClick: () => chooser.current?.confirm(folders.path) }, t('storageChoose'))),
          h('div', { className: 'ck-toolbar' }, h('button', { type: 'button', disabled: !folders || !!folders.nativeWaiting, onClick: () => chooser.current?.navigate(undefined) }, t('storageHome')),
            h('button', { type: 'button', onClick: closeChooser }, t('storageCloseBrowse')))) : null);
    }
    function StorageAccess(props) {
      const { t, useRemoteAccess, useStorageEpoch } = props;
      const readable = useRemoteAccess('settings/describe'), canWrite = useRemoteAccess('settings/update');
      const canList = useRemoteAccess('directoryPicker/list'), canPick = useRemoteAccess('directoryPicker/pick');
      const epoch = useStorageEpoch(value => value);
      React.useEffect(() => { if (!readable) props.onStorage?.(null); }, [readable, props.onStorage]);
      return !readable ? h('section', { className: 'ck-storage' }, h('h2', null, t('storage')), h('p', null, t('storageDenied')))
        : h(StorageChooser, { ...props, canWrite, canList, canPick, key: JSON.stringify([epoch, readable, canWrite, canList, canPick, props.session?.id, props.session?.cwd, props.session?.permission]) });
    }
    function StoragePanel({ t }) {
      return h('p', null, t('storagePanelGuide'));
    }
    function SessionContent({ t, session, useSessionAccess, useLibraryEpoch, startRead }) {
      const permitted = useSessionAccess(session.id, 'commands/execute');
      const epoch = useLibraryEpoch(value => value);
      const scope = JSON.stringify([session.id, session.cwd, session.permission, permitted, epoch]);
      return !permitted ? h(Notice, { t, kind: 'denied' })
        : h(Library, { key: scope, t, session, startRead });
    }
    function Page(props) {
      const { t, useSessions } = props;
      const [storage, setStorage] = React.useState(undefined);
      const selection = useSessions(list => {
        const row = Object.values(list.byId).find(item => (item.retainedBy?.mainView ?? 0) > 0);
        return row ? JSON.stringify({ id: row.id, cwd: row.cwd ?? '', title: row.title ?? row.displayTitle ?? row.id,
          permission: list.projectionsBySession?.[row.id]?.values?.permissions?.currentValue ?? null }) : '';
      });
      const session = selection ? JSON.parse(selection) : null;
      // A keyed subtree makes scope changes remove old document/search state
      // synchronously, not merely when an async cleanup eventually runs.
      return h('section', { className: 'ctxkit-library', 'aria-label': t('title') }, h('style', null, css),
        h('div', { className: 'ck-content' }, h('h1', null, t('title')), h('p', null, t('intro')),
          h(StorageAccess, { ...props, session, onStorage: setStorage }),
          session ? h('details', { className: 'ck-scope' }, h('summary', null, t('scope')), h('p', null, session.title), h('p', { className: 'ck-muted' }, session.cwd), h('p', { className: 'ck-muted' }, t('shared'))) : null,
          !session ? h(Notice, { t, kind: 'noSession' })
            : storage === undefined ? h('p', { role: 'status' }, t('storageLoading'))
              : storage !== null && !canBrowseStorage(storage, session) ? h(Notice, { t, kind: 'unconfigured' })
                : h(SessionContent, { ...props, key: session.id, session })));
    }
    return {
      inject: ['slots', 'locale', 'remote', 'remote.commands'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dictionaries));
        const t = ctx.locale.bind(NS);
        let active = true, epoch = 0, storageEpoch = 0, settingsRevision = -1, storageUncertain = false;
        const listeners = new Set(), reads = new Set(), operations = new Set(), storageListeners = new Set(), revisionListeners = new Set(), outcomeListeners = new Set();
        const invalidateLibrary = () => { for (const cancel of reads) cancel(); epoch++; for (const listener of listeners) listener(); };
        const invalidate = () => {
          for (const cancel of operations) cancel();
          storageEpoch++; settingsRevision = -1; invalidateLibrary();
          for (const listener of storageListeners) listener();
          for (const listener of revisionListeners) listener();
        };
        const observable = (getSnapshot, set) => ({ getSnapshot, subscribe: listener => { set.add(listener); return () => set.delete(listener); } });
        const source = observable(() => epoch, listeners);
        const storageSource = observable(() => storageEpoch, storageListeners);
        const revisionSource = observable(() => settingsRevision, revisionListeners);
        const outcomeSource = observable(() => storageUncertain, outcomeListeners);
        const setUncertain = value => { if (storageUncertain === value) return; storageUncertain = value; for (const listener of outcomeListeners) listener(); };
        // Settings writes do not accept an AbortSignal in the native API. The
        // local lifetime stops late UI results, not an already dispatched write.
        const operation = (work, receive, onCancel = () => {}) => {
          if (!active) return () => {};
          let pending = true;
          const controller = new AbortController();
          let timer;
          const cancel = () => { if (!pending) return; onCancel(); pending = false; clearTimeout(timer); controller.abort(); operations.delete(cancel); };
          const alive = () => pending && active;
          const settle = value => { if (alive()) { cancel(); receive(value); } };
          operations.add(cancel);
          const extend = milliseconds => { clearTimeout(timer); timer = setTimeout(() => settle(failure('error')), milliseconds); };
          extend(15000);
          Promise.resolve().then(() => alive() ? work(controller.signal, alive, extend) : undefined)
            .then(value => { if (value) settle(value); }, () => settle(failure('error')));
          return cancel;
        };
        const startStorage = (request, receive) => {
          let dispatched = false, answered = false;
          return operation(async (_signal, alive) => {
          const settings = ctx.get('remote.settings');
          if (!settings) return storageDiagnostic('CTXKIT_SETTINGS_CLIENT_SERVICE_MISSING');
          if (request.action === 'load') {
            let reply;
            try { reply = await settings.describe(); }
            catch { return storageDiagnostic('CTXKIT_SETTINGS_REQUEST_FAILED'); }
            if (!alive()) return;
            if (!reply?.ok) return { ...storageFailure(reply, true), diagnostic: 'CTXKIT_SETTINGS_HOST_FAILED', nativeCode: nativeCodeOf(reply?.error?.code) };
            if (!Array.isArray(reply.value?.namespaces)) return storageDiagnostic('CTXKIT_SETTINGS_RESPONSE_INVALID');
            const matches = reply.value.namespaces.filter(row => row?.ns === SETTINGS_NS);
            if (!matches.length) return storageDiagnostic('CTXKIT_SETTINGS_DESCRIPTOR_MISSING');
            if (matches.length !== 1) return storageDiagnostic('CTXKIT_SETTINGS_DESCRIPTOR_AMBIGUOUS');
            const problem = storageDescriptorProblem(matches[0]);
            if (problem) return storageDiagnostic(problem);
            const descriptor = storageDescriptor(matches[0]);
            if (descriptor.revision < settingsRevision) return failure('conflict');
            if (request.acknowledge === true) setUncertain(false);
            return { ok: true, descriptor, writable: reply.value.writable === true };
          }
          if (request.action !== 'save' || request.ns !== SETTINGS_NS || !Number.isSafeInteger(request.revision) || request.revision < 0 || !absoluteRoot(request.root)
            || !absoluteRoot(request.workspace) || typeof request.sessionId !== 'string' || !request.sessionId || request.sessionId.length > 256) return failure('invalid');
          if (request.revision < settingsRevision) return failure('conflict');
          if (storageUncertain) return failure('error');
          dispatched = true;
          const reply = await settings.update(request.ns, { root: request.root, enabled: true, allowedWorkspaces: [request.workspace], useSessionModel: true, exactWorkspaces: true }, request.revision);
          answered = true;
          if (!alive()) return;
          if (!reply?.ok) return storageFailure(reply);
          // A native settings event can arrive before this response. Never show
          // success if a newer write has already replaced the returned revision.
          invalidateLibrary();
          const descriptor = storageDescriptor(reply.value);
          if (!descriptor || descriptor.root !== request.root || descriptor.enabled !== true || descriptor.useSessionModel !== true || descriptor.exactWorkspaces !== true
            || descriptor.allowedWorkspaces.length !== 1 || descriptor.allowedWorkspaces[0] !== request.workspace
            || descriptor.revision < request.revision || descriptor.revision < settingsRevision) return failure('conflict');
          return { ok: true, descriptor, saved: true };
          }, value => {
            if (request.action === 'save' && value.state === 'error') setUncertain(true);
            receive(value);
          }, () => { if (dispatched && !answered) setUncertain(true); });
        };
        const startFolders = ({ path, canList, canPick }, receive) => operation(async (signal, alive, extend) => {
          const picker = ctx.get('remote.directoryPicker');
          if (!picker || (!canList && !canPick)) return failure('unavailable');
          if (path !== undefined && !absoluteRoot(path)) return failure('invalid');
          const reply = canList ? await picker.list(path, signal) : { ok: false, error: { code: 'directory-picker/unavailable', details: { capability: 'native' } } };
          if (!alive()) return;
          if (!reply?.ok && reply?.error?.code === 'directory-picker/unavailable' && reply.error.details?.capability === 'native' && canPick) {
            extend(120000);
            receive({ ok: true, nativeWaiting: true });
            const picked = await picker.pick(signal);
            if (!alive()) return;
            return !picked?.ok ? storageFailure(picked) : picked.value === null ? { ok: true, cancelled: true }
              : absoluteRoot(picked.value) ? { ok: true, picked: picked.value } : failure('error');
          }
          if (!reply?.ok) return storageFailure(reply);
          const listing = reply.value;
          if (!absoluteRoot(listing?.path) || !Array.isArray(listing.entries) || !Array.isArray(listing.crumbs)) return failure('error');
          const rows = list => list.filter(row => absoluteRoot(row?.path) && typeof row.name === 'string').slice(0, 200).map(row => ({ path: row.path, name: row.name.slice(0, 300), hidden: row.hidden === true }));
          return { ok: true, path: listing.path, home: absoluteRoot(listing.home) ? listing.home : undefined,
            crumbs: rows(listing.crumbs), entries: rows(listing.entries), truncated: listing.truncated === true || listing.entries.length > 200 };
        }, receive);
        // One chooser lifetime owns navigation and the sole persistence boundary.
        // Native pick and browse confirmation converge here; navigation never saves.
        const startChoosing = (request, receive) => {
          let live = active, saving = false, serial = 0, selectable, cancelRequest = () => {};
          const cancel = () => { live = false; serial++; cancelRequest(); operations.delete(cancel); };
          const finish = value => { if (!live || !active) return; live = false; operations.delete(cancel); receive(value); };
          const confirm = root => {
            if (!live || !active || saving || !absoluteRoot(root) || root !== selectable) return;
            saving = true; serial++; cancelRequest();
            // Commit is deferred by startStorage's operation microtask: closing or
            // disposing before dispatch cancels it, even after confirmation.
            receive({ ok: true, saving: true });
            if (!live || !active) return;
            cancelRequest = startStorage({ action: 'save', ns: request.ns, revision: request.revision, root, workspace: request.workspace, sessionId: request.sessionId }, finish);
          };
          const navigate = path => {
            if (!live || !active || saving) return;
            const generation = ++serial; selectable = undefined; cancelRequest();
            receive({ ok: true, choosing: true, loading: true });
            if (!live || !active) return;
            cancelRequest = startFolders({ path, canList: request.canList, canPick: request.canPick }, value => {
              if (!live || !active || saving || serial !== generation) return;
              if (value.ok && value.picked) { selectable = value.picked; confirm(value.picked); }
              else if (value.cancelled) finish({ ok: true, cancelled: true });
              else { selectable = value.ok && absoluteRoot(value.path) ? value.path : undefined; receive({ ...value, choosing: true }); }
            });
          };
          if (live) { operations.add(cancel); if (request.existing === true && absoluteRoot(request.path)) selectable = request.path; else navigate(request.path); }
          return { navigate, confirm, cancel };
        };
        // Pure request lifecycle face, independent of React/DOM. Disposing or
        // invalidating the plugin also cancels requests before React unmounts.
        const startRead = (sessionId, args, receive) => {
          if (!active || typeof sessionId !== 'string' || !sessionId) return () => {};
          let pending = true;
          const controller = new AbortController();
          let timer;
          const cancel = () => { pending = false; clearTimeout(timer); controller.abort(); reads.delete(cancel); };
          const settle = value => { if (pending && active) { cancel(); receive(value); } };
          reads.add(cancel);
          timer = setTimeout(() => settle(failure('timeout')), 15000);
          Promise.resolve().then(() => pending && active
            ? ctx.remote.commands.execute(sessionId, '/ctxkit-library ' + JSON.stringify(args), [], controller.signal)
            : undefined).then(value => settle(decode(value)), () => settle(failure('error')));
          return cancel;
        };
        ctx.effect(() => () => { active = false; for (const cancel of reads) cancel(); for (const cancel of operations) cancel(); listeners.clear(); storageListeners.clear(); revisionListeners.clear(); outcomeListeners.clear(); });
        ctx.on('connection/reset', invalidate);
        ctx.remote.$on('plugin-manager/changed', invalidate);
        ctx.remote.$on('settings/document-updated', (ns, revision) => {
          if (ns !== SETTINGS_NS) return;
          if (Number.isSafeInteger(revision)) settingsRevision = Math.max(settingsRevision, revision);
          invalidateLibrary();
          for (const listener of revisionListeners) listener();
        });
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PAGE, locale: NS,
          inject: () => ({ startRead, startStorage, startFolders, startChoosing, buildTree, canBrowseStorage,
            hooks: { libraryEpoch: source, storageEpoch: storageSource, settingsRevision: revisionSource, storageOutcome: outcomeSource } }),
        }, Page));
        ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({ name: 'plugins.bundle.config', key: 'ctxkit-dsh', locale: NS,
        }, StoragePanel));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PAGE, order: 20, locale: NS, label: () => t('title') }, Icon));
      },
    };
  },
});
