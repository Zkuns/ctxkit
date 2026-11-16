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
    "intro": "Work normally. In opted-in sessions, useful outcomes become sourced notes; relevant context can be recalled without mentioning CtxKit.",
    "scope": "Access checked against the selected session",
    "shared": "Topics and captured dossiers belong to the shared configured library. Processing status is for this session only.",
    "topics": "Topics",
    "sessions": "Session dossiers",
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
    "empty": "No records yet",
    "emptyBody": "No managed records were found in this section. Useful new work in opted-in sessions can gradually build this library.",
    "noMatches": "No matching records",
    "noMatchesBody": "Try fewer keywords or clear the search and filter.",
    "noSession": "Select a session to browse",
    "noSessionBody": "Choose a real session in the sidebar, then open Context library. Its current workspace and permissions determine access; this page creates no session.",
    "unconfigured": "Library is not enabled",
    "unconfiguredBody": "No library files were read. Set the storage location above; allowed workspaces and a summarization model must still be configured before recording is explicitly enabled.",
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
    "storage": "Storage location",
    "storageHelp": "Choose an existing directory on the DSH host, not this browser’s computer. No environment variables are needed. A dedicated empty directory is recommended.",
    "storageSafety": "Saving only sets the location and pauses recording. It does not enable recording, change workspace access or models, or move or delete existing files.",
    "savedLocation": "Saved location (last loaded)",
    "storageUnset": "Not set",
    "storagePath": "Absolute host directory path",
    "storageEdit": "Set storage location",
    "storageSave": "Save location and keep recording off",
    "storageCancel": "Cancel edits",
    "storageReload": "Reload saved settings",
    "storageLoading": "Loading saved location…",
    "storageSaving": "Saving location…",
    "storageSaved": "Location saved. Recording is off. Workspace access and a model must still be configured before recording is explicitly enabled.",
    "storageChanged": "Settings changed elsewhere. Reload saved settings before editing again; your draft has not been saved.",
    "storageUnavailable": "Location settings are unavailable. Check that the updated CtxKit host plugin and native Settings provider are active.",
    "storageReadonly": "You can view this location, but this connection or profile does not allow editing settings.",
    "storageDenied": "This connection cannot read location settings.",
    "storageInvalid": "Enter an absolute path to an existing host directory. Relative paths, environment variables and ~ are not expanded.",
    "storageRejected": "The host rejected this location. Check that the directory exists, is not a symbolic link, and is permitted by the configuration layer.",
    "storageError": "The operation could not be confirmed. Reload saved settings before retrying; a timed-out save may already have reached the host.",
    "storageBrowse": "Browse host folders",
    "storageBrowseTitle": "Choose an existing host folder",
    "storageBrowseHelp": "Navigate using host-provided folders. Choosing a folder only fills the path field; press Save to persist it.",
    "storageChoose": "Use this folder",
    "storageCloseBrowse": "Close folder browser",
    "storageHome": "Host home",
    "storageHidden": "Show hidden folders",
    "storageNoFolders": "No visible child folders in this directory.",
    "storageBrowseError": "Host folders could not be listed. You may enter an existing absolute host path directly.",
    "storagePickerUnavailable": "Host folder picking is unavailable on this connection. Enter an existing absolute host path directly.",
    "storageNativeWaiting": "Waiting up to two minutes for the folder chooser on the DSH host. Closing this section cancels the request.",
    "storageBrowseLoading": "Loading host folders…",
    "storageClientMissing": "This page has no native Settings client service. Refresh the page and check the DSH Remote assembly.",
    "storageHostFailed": "The native Settings API returned a failure. The safe error code below identifies the Host/API problem; no configuration values are included.",
    "storageRequestFailed": "The Settings request failed before a valid response arrived. Check the connection and reload saved settings.",
    "storageResponseInvalid": "The native Settings response has an unexpected format. Check that the page and Host use compatible DSH versions.",
    "storageDescriptorMissing": "Native Settings responded, but did not expose the CtxKit configuration entry. Check that the Host has loaded the updated CtxKit plugin with its Config schema; updating the page alone is not sufficient.",
    "storageDescriptorAmbiguous": "Native Settings returned duplicate CtxKit configuration entries. No entry was selected; check the Host plugin registration.",
    "storageSchemaIncompatible": "The CtxKit entry exists, but its root/enabled schema is incompatible with this page. Reload the page after confirming the updated Host plugin is active.",
    "storageValueInvalid": "The CtxKit entry exists, but its configuration values or revision have an unexpected format. No value was accepted; reload saved settings after checking the Host plugin version."
  },
  "zh": {
    "title": "上下文库",
    "intro": "正常做事即可。已授权会话中的实质成果会逐渐形成可追溯笔记；需要时可以自然召回相关上下文，无需提及 CtxKit。",
    "scope": "按当前所选会话检查访问权限",
    "shared": "主题与已采集的会话档案来自配置的共享库；处理状态仅属于当前会话。",
    "topics": "主题",
    "sessions": "会话档案",
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
    "empty": "暂无记录",
    "emptyBody": "此分类尚未找到受管理的记录。已授权会话中的新工作成果会逐渐积累到库中。",
    "noMatches": "没有匹配记录",
    "noMatchesBody": "请减少关键词，或清除搜索与筛选条件。",
    "noSession": "先选择一个会话",
    "noSessionBody": "在侧栏选择真实会话，再打开上下文库。访问取决于该会话当前的工作区与权限；此页面不会创建会话。",
    "unconfigured": "上下文库尚未启用",
    "unconfiguredBody": "未读取任何库文件。可先在上方设置存储位置；仍需配置允许的工作区和整理模型，再明确开启采集。",
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
    "storage": "存储位置",
    "storageHelp": "请选择 DSH 宿主机器上已存在的目录，而非当前浏览器所在电脑的目录。无需设置环境变量；推荐使用专用空目录。",
    "storageSafety": "保存只设置位置并暂停采集，不会开启记录、更改工作区授权或模型，也不会移动或删除旧目录里的资料。",
    "savedLocation": "已保存的位置（上次读取）",
    "storageUnset": "尚未设置",
    "storagePath": "宿主目录的绝对路径",
    "storageEdit": "设置存储位置",
    "storageSave": "保存位置并保持采集关闭",
    "storageCancel": "取消修改",
    "storageReload": "重新读取已保存设置",
    "storageLoading": "正在读取存储位置…",
    "storageSaving": "正在保存位置…",
    "storageSaved": "位置已保存，采集保持关闭。仍需配置允许的工作区和整理模型，再明确开启采集。",
    "storageChanged": "设置已在别处变更。请重新读取后再修改；当前草稿尚未保存。",
    "storageUnavailable": "存储位置设置暂不可用，请确认新版 CtxKit 宿主插件与原生 Settings 服务已启用。",
    "storageReadonly": "可以查看存储位置，但当前连接或配置不允许修改设置。",
    "storageDenied": "当前连接无权读取存储位置设置。",
    "storageInvalid": "请输入宿主上已有目录的绝对路径；相对路径、环境变量和 ~ 不会自动展开。",
    "storageRejected": "宿主拒绝保存此位置。请确认目录已存在、不是符号链接，且未被更高层配置覆盖。",
    "storageError": "未能确认操作结果。请重新读取已保存设置后再尝试；超时的保存请求可能已经到达宿主。",
    "storageBrowse": "浏览宿主目录",
    "storageBrowseTitle": "选择已有宿主目录",
    "storageBrowseHelp": "使用宿主返回的目录进行导航。选择目录只填写路径，点击保存才会持久化。",
    "storageChoose": "使用此目录",
    "storageCloseBrowse": "关闭目录浏览",
    "storageHome": "宿主主目录",
    "storageHidden": "显示隐藏目录",
    "storageNoFolders": "此目录下没有可见的子目录。",
    "storageBrowseError": "无法列出宿主目录；也可以直接填写已有宿主目录的绝对路径。",
    "storagePickerUnavailable": "当前连接无法使用宿主目录选择器，请直接填写已有目录的绝对路径。",
    "storageNativeWaiting": "正在等待 DSH 宿主上的目录选择窗口（最多两分钟）。关闭此区域会取消请求。",
    "storageBrowseLoading": "正在读取宿主目录…",
    "storageClientMissing": "当前页面没有原生 Settings 客户端服务。请刷新页面，并检查 DSH Remote 服务是否加载。",
    "storageHostFailed": "原生 Settings API 返回失败。下方仅显示安全错误码，用于定位宿主或接口问题，不包含任何配置值。",
    "storageRequestFailed": "Settings 请求未取得有效响应。请检查连接后重新读取已保存设置。",
    "storageResponseInvalid": "原生 Settings 响应格式不符合预期。请检查当前页面与宿主 DSH 版本是否兼容。",
    "storageDescriptorMissing": "原生 Settings 已响应，但没有提供 CtxKit 配置项。请确认宿主已加载带 Config schema 的新版 CtxKit；只更新页面并不足以更新宿主代码。",
    "storageDescriptorAmbiguous": "原生 Settings 返回了重复的 CtxKit 配置项。未选择任何一项，请检查宿主插件注册。",
    "storageSchemaIncompatible": "已找到 CtxKit 配置项，但 root/enabled schema 与此页面不兼容。请确认新版宿主插件已加载后刷新页面。",
    "storageValueInvalid": "已找到 CtxKit 配置项，但配置值或版本号格式不符合预期。未接受任何配置值；请检查宿主插件版本后重新读取。"
  }
} /* LOCALES_END */;
    const NS = 'ctxkit.library';
    const PAGE = 'ctxkit-library';
    const states = ['queued', 'capturing', 'captured', 'organizing', 'done', 'skipped', 'error', 'waiting_source', 'paused'];
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
.ctxkit-library .ck-path-input { width:100%; margin:8px 0 12px; }
.ctxkit-library .ck-folders { border-top:1px solid var(--dsw-alias-border-l2); padding-top:16px; margin-top:20px; }
.ctxkit-library .ck-folder-list { max-height:260px; overflow:auto; margin:12px 0; }
.ctxkit-library .ck-folder-list button { text-align:start; width:100%; overflow-wrap:anywhere; }
.ctxkit-library .ck-folders input[type=checkbox] { min-height:20px; width:20px; }
.ctxkit-library .ck-folders label { min-height:44px; padding-block:8px; cursor:pointer; }
.ctxkit-library .ck-folders h3 { margin:0; }
@media(hover:hover) { .ctxkit-library button:not(:disabled):hover { background:var(--dsw-alias-interactive-bg-hover); } }
@media(pointer:coarse) { .ctxkit-library :is(button,input,select) { min-height:44px; } .ctxkit-library :is(input,select) { font-size:16px; } }
@media(prefers-reduced-motion:reduce) { .ctxkit-library button { transition:none; } }
`;
    const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
    const text = (value, max = 500) => typeof value === 'string' ? value.slice(0, max) : '';
    const pathOf = value => typeof value === 'string' && value.length <= 300 && /^(topics|sessions)\/[a-zA-Z0-9_/-]+\.md$/.test(value) && !value.includes('..') ? value : null;
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
      if (schema?.type !== 'object' || resolve(schema.dict?.root)?.type !== 'string' || resolve(schema.dict?.enabled)?.type !== 'boolean') return 'CTXKIT_SETTINGS_SCHEMA_INCOMPATIBLE';
      if (typeof row.value?.root !== 'string' || row.value.root.length > 4096 || typeof row.value.enabled !== 'boolean') return 'CTXKIT_SETTINGS_VALUE_INVALID';
      return null;
    }
    function storageDescriptor(row) {
      return storageDescriptorProblem(row) ? null : { ns: row.ns, revision: row.revision, root: row.value.root, enabled: row.value.enabled };
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
      const reasons = { CTXKIT_READ_ONLY: 'read_only', CTXKIT_PAUSED: 'paused', CTXKIT_VAULT_NOT_WRITABLE: 'write_denied', CTXKIT_WORKSPACE_DENIED: 'workspace_denied', CTXKIT_UNCONFIGURED: 'not_configured' };
      return h('div', { className: 'ck-notice' },
        h('div', { className: 'ck-meta' },
          h('strong', null, t(value.paused ? 'paused' : value.captureEligible === true ? 'ready' : value.captureEligible === false ? 'notReady' : 'unknown')),
          h('span', { className: 'ck-badge' }, t('pending', { count: count(value.pending) }))),
        value.reason ? h('p', { className: 'ck-muted' }, t('reason'), ': ', reasons[value.reason] ? t(reasons[value.reason]) : codeOf(value.reason) || t('unknown')) : null,
        codeOf(value.adapterNotice) ? h('p', { className: 'ck-muted' }, codeOf(value.adapterNotice)) : null);
    }
    function Library({ t, session, startRead }) {
      const [tab, setTab] = React.useState('topics');
      const [draft, setDraft] = React.useState('');
      const [search, setSearch] = React.useState('');
      const [filter, setFilter] = React.useState('');
      const [offset, setOffset] = React.useState(0);
      const [previous, setPrevious] = React.useState([]);
      const [detail, setDetail] = React.useState(null);
      const [reload, setReload] = React.useState(0);
      const [loaded, setLoaded] = React.useState(null);
      const heading = React.useRef(null);
      const focusOnLoad = React.useRef(false);
      const args = detail ? { action: 'read', path: detail.path, offset: detail.offset, limit: 10000 }
        : { action: tab, query: tab === 'status' ? filter : search, offset, limit: 20 };
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
      const changeTab = next => { setTab(next); setDraft(''); setSearch(''); setFilter(''); setOffset(0); setPrevious([]); setDetail(null); };
      const open = path => { if (pathOf(path)) { focusOnLoad.current = true; setDetail({ path, offset: 0, previous: [], parent: detail }); } };
      const back = () => { focusOnLoad.current = true; setDetail(detail?.parent ?? null); };
      const controls = detail
        ? h('button', { type: 'button', onClick: back }, t('back'))
        : h(React.Fragment, null,
          h('nav', { className: 'ck-tabs', 'aria-label': t('title') }, ['topics', 'sessions', 'status'].map(name =>
            h('button', { type: 'button', key: name, 'aria-pressed': tab === name, onClick: () => changeTab(name) }, t(name)))),
          h('form', { className: 'ck-toolbar', onSubmit: event => { event.preventDefault(); setSearch(draft.trim()); setOffset(0); setPrevious([]); } },
            tab === 'status'
              ? h('label', { className: 'ck-search' }, t('filter'), h('select', { value: filter, onChange: event => { setFilter(event.target.value); setOffset(0); setPrevious([]); } },
                h('option', { value: '' }, t('all')), states.map(state => h('option', { key: state, value: state }, t(state === 'error' ? 'failed' : state)))))
              : h(React.Fragment, null, h('label', { className: 'ck-search' }, t('search'), h('input', { type: 'search', maxLength: 300, value: draft, placeholder: t('searchHint'), onChange: event => setDraft(event.target.value) })),
                h('button', { type: 'submit' }, t('searchAction'))),
            h('button', { type: 'button', disabled: !(draft || search || filter), onClick: () => { setDraft(''); setSearch(''); setFilter(''); setOffset(0); setPrevious([]); } }, t('clear'))));
      let body;
      if (!current) body = h('p', { role: 'status', 'aria-live': 'polite' }, t('loading'));
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
          tab === 'status' ? h('p', { className: 'ck-muted' }, t('statusHelp')) : null,
          rows.length ? h('ul', null, rows.map((item, index) => h('li', { className: 'ck-row', key: item.path || item.id || index },
            tab === 'status'
              ? h(React.Fragment, null, h('strong', null, t(states.includes(item.status) ? item.status === 'error' ? 'failed' : item.status : 'unknown')),
                h('p', { className: 'ck-muted' }, text(item.id, 100)), codeOf(item.error) ? h('p', null, codeOf(item.error)) : null,
                pathOf(item.checkpointPath) ? h('button', { type: 'button', className: 'ck-open', onClick: () => open(item.checkpointPath) }, t('document')) : null)
              : h(React.Fragment, null, h('button', { type: 'button', className: 'ck-open', onClick: () => open(item.path) }, text(item.title) || t('document')),
                h('p', { className: 'ck-excerpt' }, text(item.excerpt)), h('p', { className: 'ck-muted' }, text(item.path, 300)),
                h('div', { className: 'ck-meta' }, [...(Array.isArray(item.topics) ? item.topics : []), ...(Array.isArray(item.sessions) ? item.sessions : [])].slice(0, 24).map(link =>
                  h('button', { key: link.path, type: 'button', className: 'ck-open', onClick: () => open(link.path) }, text(link.title) || text(link.path, 300)))),
                item.linksTruncated ? h('p', { className: 'ck-muted' }, t('truncated')) : null))))
            : h(Notice, { t, kind: search || filter ? 'noMatches' : 'empty' }),
          h(Pager, { t, data: current, previous, onNext: next => { focusOnLoad.current = true; setPrevious([...previous, offset]); setOffset(next); }, onPrevious: () => { focusOnLoad.current = true; setOffset(previous.at(-1)); setPrevious(previous.slice(0, -1)); } }));
      }
      return h(React.Fragment, null, controls,
        h('div', { className: 'ck-toolbar' }, h('p', { className: 'ck-muted' }, t('snapshot')), h('button', { type: 'button', disabled: !current, onClick: () => { focusOnLoad.current = true; setReload(reload + 1); } }, t('refresh'))),
        h('div', { 'aria-busy': !current }, body),
        current?.truncated || current?.relatedTruncated || current?.childrenTruncated || current?.metadataTruncated ? h('p', { className: 'ck-notice', role: 'status' }, t('truncated')) : null);
    }
    function StorageForm({ t, startStorage, startFolders, canWrite, canList, canPick, useSettingsRevision }) {
      const revision = useSettingsRevision(value => value);
      const [loaded, setLoaded] = React.useState(null), [editing, setEditing] = React.useState(false);
      const [draft, setDraft] = React.useState(''), [busy, setBusy] = React.useState(false), [message, setMessage] = React.useState('');
      const [folderRequest, setFolderRequest] = React.useState(null), [folders, setFolders] = React.useState(null), [hidden, setHidden] = React.useState(false);
      const cancel = React.useRef(() => {}), input = React.useRef(null), folderTitle = React.useRef(null), reloadButton = React.useRef(null), focusReload = React.useRef(false);
      const ids = React.useId(), descriptor = loaded?.descriptor;
      const stale = (!!descriptor && revision > descriptor.revision) || ['storageChanged', 'storageError', 'storageReadonly'].includes(message);
      const writable = canWrite && loaded?.writable === true;
      const load = () => {
        cancel.current(); setBusy(true); setMessage(''); setFolderRequest(null); setLoaded(null);
        cancel.current = startStorage({ action: 'load' }, value => {
          setBusy(false); setLoaded(value); setEditing(false);
          if (value.ok) setDraft(value.descriptor.root);
          else setMessage(value.state === 'denied' ? 'storageDenied' : 'storageUnavailable');
        });
      };
      React.useEffect(() => { load(); return () => cancel.current(); }, [startStorage]);
      React.useEffect(() => {
        if (!folderRequest || stale) return;
        setFolders(null);
        return startFolders({ path: folderRequest.path, canList, canPick }, value => {
          if (value.picked) { setDraft(value.picked); setFolderRequest(null); input.current?.focus(); }
          else if (value.cancelled) { setFolderRequest(null); input.current?.focus(); }
          else setFolders(value);
        });
      }, [folderRequest, canList, canPick, startFolders, stale]);
      React.useEffect(() => { if (folders && !folders.nativeWaiting) folderTitle.current?.focus(); }, [folders]);
      React.useEffect(() => { if (editing) input.current?.focus(); }, [editing]);
      React.useEffect(() => { if (!busy && focusReload.current) { focusReload.current = false; reloadButton.current?.focus(); } }, [busy, editing, message]);
      const save = event => {
        event.preventDefault();
        if (!writable || stale || busy) return;
        if (!absoluteRoot(draft)) { setMessage('storageInvalid'); input.current?.focus(); return; }
        cancel.current(); setBusy(true); setMessage(''); setFolderRequest(null);
        cancel.current = startStorage({ action: 'save', ns: descriptor.ns, root: draft, revision: descriptor.revision }, value => {
          setBusy(false);
          if (value.ok) { setLoaded({ ...loaded, descriptor: value.descriptor }); setDraft(value.descriptor.root); setEditing(false); setMessage('storageSaved'); focusReload.current = true; }
          else { setMessage(value.state === 'conflict' ? 'storageChanged' : value.state === 'rejected' ? 'storageRejected' : value.state === 'invalid' ? 'storageInvalid' : value.state === 'denied' ? 'storageReadonly' : 'storageError'); input.current?.focus(); }
        });
      };
      const error = message && message !== 'storageSaved';
      const folderRows = folders?.entries?.filter(row => hidden || !row.hidden) ?? [];
      const openFolder = path => { setFolders(null); setFolderRequest({ path }); };
      return h('section', { className: 'ck-storage', 'aria-labelledby': ids + '-title', 'aria-busy': busy },
        h('h2', { id: ids + '-title' }, t('storage')), h('p', null, t('storageHelp')),
        descriptor ? h('p', { className: 'ck-storage-path' }, h('strong', null, t('savedLocation'), ': '), descriptor.root || t('storageUnset')) : null,
        busy ? h('p', { role: 'status' }, t(editing ? 'storageSaving' : 'storageLoading')) : null,
        descriptor && revision > descriptor.revision && !busy ? h('p', { role: 'alert' }, t('storageChanged')) : null,
        !editing && descriptor ? h('div', { className: 'ck-toolbar' }, h('button', { type: 'button', disabled: busy || !writable || stale, onClick: () => { setEditing(true); setDraft(descriptor.root); setMessage(''); } }, t('storageEdit'))) : null,
        descriptor && !writable ? h('p', null, t('storageReadonly')) : null,
        editing ? h('form', { onSubmit: save },
          h('p', { id: ids + '-safety' }, t('storageSafety')),
          h('label', { className: 'ck-search', htmlFor: ids + '-path' }, t('storagePath')),
          h('input', { id: ids + '-path', ref: input, className: 'ck-path-input', type: 'text', maxLength: 4096, value: draft, disabled: busy || !writable || stale, spellCheck: false, autoComplete: 'off',
            'aria-describedby': ids + '-safety' + (error ? ' ' + ids + '-error' : ''), 'aria-invalid': !!error,
            onChange: event => { setDraft(event.target.value); setMessage(''); } }),
          message ? h('p', { id: ids + '-error', role: error ? 'alert' : 'status' }, t(message)) : null,
          h('div', { className: 'ck-toolbar' },
            h('button', { type: 'button', disabled: busy || stale || !writable || !(canList || canPick), onClick: () => openFolder(absoluteRoot(draft) ? draft : undefined) }, t('storageBrowse')),
            h('button', { type: 'submit', disabled: busy || stale || !writable || !draft }, t('storageSave')),
            h('button', { type: 'button', disabled: busy, onClick: () => { setEditing(false); setDraft(descriptor.root); setMessage(''); setFolderRequest(null); reloadButton.current?.focus(); } }, t('storageCancel'))),
          !(canList || canPick) ? h('p', { className: 'ck-muted' }, t('storagePickerUnavailable')) : null) : null,
        !editing && message ? h('p', { role: error ? 'alert' : 'status' }, t(message)) : null,
        loaded?.diagnostic && storageDiagnostics[loaded.diagnostic] ? h('div', { role: 'status' },
          h('p', null, t(storageDiagnostics[loaded.diagnostic])),
          h('p', { className: 'ck-muted' }, codeOf(loaded.diagnostic), nativeCodeOf(loaded.nativeCode) ? ' · ' + nativeCodeOf(loaded.nativeCode) : '')) : null,
        h('button', { type: 'button', ref: reloadButton, disabled: busy, onClick: load }, t('storageReload')),
        folderRequest && !stale && writable ? h('section', { className: 'ck-folders', 'aria-labelledby': ids + '-folders', 'aria-busy': !folders || !!folders.nativeWaiting },
          h('h3', { id: ids + '-folders', ref: folderTitle, tabIndex: -1 }, t('storageBrowseTitle')),
          h('p', null, t('storageBrowseHelp')),
          !folders || folders.nativeWaiting ? h('p', { role: 'status' }, t(folders?.nativeWaiting ? 'storageNativeWaiting' : 'storageBrowseLoading'))
            : !folders.ok ? h('p', { role: 'alert' }, t(folders.state === 'unavailable' || folders.state === 'denied' ? 'storagePickerUnavailable' : 'storageBrowseError'))
              : h(React.Fragment, null,
                h('p', { className: 'ck-storage-path' }, folders.path),
                h('nav', { className: 'ck-meta', 'aria-label': t('storageBrowseTitle') }, folders.crumbs.map(row => h('button', { key: row.path, type: 'button', disabled: row.path === folders.path, onClick: () => openFolder(row.path) }, row.name))),
                h('label', { className: 'ck-meta' }, h('input', { type: 'checkbox', checked: hidden, onChange: event => setHidden(event.target.checked) }), t('storageHidden')),
                folderRows.length ? h('ul', { className: 'ck-folder-list' }, folderRows.map(row => h('li', { key: row.path }, h('button', { type: 'button', onClick: () => openFolder(row.path) }, row.name)))) : h('p', null, t('storageNoFolders')),
                folders.truncated ? h('p', { role: 'status' }, t('truncated')) : null,
                h('button', { type: 'button', onClick: () => { setDraft(folders.path); setFolderRequest(null); input.current?.focus(); } }, t('storageChoose'))),
          h('div', { className: 'ck-toolbar' }, h('button', { type: 'button', disabled: !folders || !!folders.nativeWaiting, onClick: () => openFolder(undefined) }, t('storageHome')),
            h('button', { type: 'button', onClick: () => { setFolderRequest(null); input.current?.focus(); } }, t('storageCloseBrowse')))) : null);
    }
    function Storage(props) {
      const { t, useRemoteAccess, useStorageEpoch } = props;
      const readable = useRemoteAccess('settings/describe'), canWrite = useRemoteAccess('settings/update');
      const canList = useRemoteAccess('directoryPicker/list'), canPick = useRemoteAccess('directoryPicker/pick');
      const epoch = useStorageEpoch(value => value);
      return !readable ? h('section', { className: 'ck-storage' }, h('h2', null, t('storage')), h('p', null, t('storageDenied')))
        : h(StorageForm, { ...props, canWrite, canList, canPick, key: JSON.stringify([epoch, readable, canWrite, canList, canPick]) });
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
          h(Storage, props),
          session ? h('div', { className: 'ck-scope' }, h('strong', null, t('scope')), h('p', null, session.title), h('p', { className: 'ck-muted' }, session.cwd), h('p', { className: 'ck-muted' }, t('shared'))) : null,
          !session ? h(Notice, { t, kind: 'noSession' })
            : h(SessionContent, { ...props, key: session.id, session })));
    }
    return {
      inject: ['slots', 'locale', 'remote', 'remote.commands'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dictionaries));
        const t = ctx.locale.bind(NS);
        let active = true, epoch = 0, storageEpoch = 0, settingsRevision = -1;
        const listeners = new Set(), reads = new Set(), operations = new Set(), storageListeners = new Set(), revisionListeners = new Set();
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
        // Settings writes do not accept an AbortSignal in the native API. The
        // local lifetime stops late UI results, not an already dispatched write.
        const operation = (work, receive) => {
          if (!active) return () => {};
          let pending = true;
          const controller = new AbortController();
          let timer;
          const cancel = () => { pending = false; clearTimeout(timer); controller.abort(); operations.delete(cancel); };
          const alive = () => pending && active;
          const settle = value => { if (alive()) { cancel(); receive(value); } };
          operations.add(cancel);
          const extend = milliseconds => { clearTimeout(timer); timer = setTimeout(() => settle(failure('error')), milliseconds); };
          extend(15000);
          Promise.resolve().then(() => alive() ? work(controller.signal, alive, extend) : undefined)
            .then(value => { if (value) settle(value); }, () => settle(failure('error')));
          return cancel;
        };
        const startStorage = (request, receive) => operation(async (_signal, alive) => {
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
            return { ok: true, descriptor: storageDescriptor(matches[0]), writable: reply.value.writable === true };
          }
          if (request.action !== 'save' || request.ns !== SETTINGS_NS || !Number.isSafeInteger(request.revision) || request.revision < 0 || !absoluteRoot(request.root)) return failure('invalid');
          if (request.revision < settingsRevision) return failure('conflict');
          const reply = await settings.update(request.ns, { root: request.root, enabled: false }, request.revision);
          if (!alive()) return;
          if (!reply?.ok) return storageFailure(reply);
          // A native settings event can arrive before this response. Never show
          // success if a newer write has already replaced the returned revision.
          invalidateLibrary();
          const descriptor = storageDescriptor(reply.value);
          if (!descriptor || descriptor.root !== request.root || descriptor.enabled !== false || descriptor.revision < settingsRevision) return failure('conflict');
          return { ok: true, descriptor, saved: true };
        }, receive);
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
        ctx.effect(() => () => { active = false; for (const cancel of reads) cancel(); for (const cancel of operations) cancel(); listeners.clear(); storageListeners.clear(); revisionListeners.clear(); });
        ctx.on('connection/reset', invalidate);
        ctx.remote.$on('plugin-manager/changed', invalidate);
        ctx.remote.$on('settings/document-updated', (ns, revision) => {
          if (ns !== SETTINGS_NS) return;
          if (Number.isSafeInteger(revision)) settingsRevision = Math.max(settingsRevision, revision);
          invalidateLibrary();
          for (const listener of revisionListeners) listener();
        });
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PAGE, locale: NS,
          inject: () => ({ startRead, startStorage, startFolders, hooks: { libraryEpoch: source, storageEpoch: storageSource, settingsRevision: revisionSource } }),
        }, Page));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PAGE, order: 20, locale: NS, label: () => t('title') }, Icon));
      },
    };
  },
});
