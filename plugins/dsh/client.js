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
    "unconfiguredBody": "No library files were read. An administrator must configure an existing vault, allowed workspaces and a summarization model, then explicitly enable CtxKit through DSH plugin settings.",
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
    "not_configured": "Configuration incomplete"
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
    "unconfiguredBody": "未读取任何库文件。管理员需通过 DSH 插件设置配置已有库目录、允许的工作区和整理模型，再显式启用 CtxKit。",
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
    "not_configured": "配置不完整"
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
          session ? h('div', { className: 'ck-scope' }, h('strong', null, t('scope')), h('p', null, session.title), h('p', { className: 'ck-muted' }, session.cwd), h('p', { className: 'ck-muted' }, t('shared'))) : null,
          !session ? h(Notice, { t, kind: 'noSession' })
            : h(SessionContent, { ...props, key: session.id, session })));
    }
    return {
      inject: ['slots', 'locale', 'remote', 'remote.commands'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dictionaries));
        const t = ctx.locale.bind(NS);
        let active = true, epoch = 0;
        const listeners = new Set(), reads = new Set();
        const invalidate = () => { for (const cancel of reads) cancel(); epoch++; for (const listener of listeners) listener(); };
        const source = { getSnapshot: () => epoch, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); } };
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
        ctx.effect(() => () => { active = false; for (const cancel of reads) cancel(); listeners.clear(); });
        ctx.on('connection/reset', invalidate);
        ctx.remote.$on('plugin-manager/changed', invalidate);
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PAGE, locale: NS,
          inject: () => ({ startRead, hooks: { libraryEpoch: source } }),
        }, Page));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PAGE, order: 20, locale: NS, label: () => t('title') }, Icon));
      },
    };
  },
});
