window.__ModuleLoader__.load({
  id: 'dsh-shortcut-editor',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const MODIFIERS = [
      ['control', 'ctrlKey'],
      ['alt', 'altKey'],
      ['shift', 'shiftKey'],
      ['meta', 'metaKey'],
    ];

    const KEY_NAMES = {
      Slash: '/',
      Comma: ',',
      Period: '.',
      Backslash: '\\',
      Backquote: '`',
      Minus: '-',
      Equal: '=',
      BracketLeft: '[',
      BracketRight: ']',
      Semicolon: ';',
      Quote: "'",
      Enter: 'Enter',
      Escape: 'Esc',
      Space: 'Space',
      Tab: 'Tab',
      Backspace: 'Backspace',
      Delete: 'Delete',
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
    };

    const MODIFIER_KEYS = ['Control', 'Shift', 'Alt', 'Meta', 'OS', 'AltGraph', 'CapsLock', 'Dead'];

    const MAC_SYMBOLS = { control: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' };
    const PC_SYMBOLS = { control: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Meta' };

    function isSupportedCode(code) {
      if (typeof code !== 'string' || code === '') return false;
      if (/^(Key[A-Z]|Digit[0-9]|F([1-9]|1[0-9]|2[0-4]))$/.test(code)) return true;
      return Object.prototype.hasOwnProperty.call(KEY_NAMES, code);
    }

    function keyLabel(code) {
      if (Object.prototype.hasOwnProperty.call(KEY_NAMES, code)) return KEY_NAMES[code];
      if (/^Key[A-Z]$/.test(code)) return code.slice(3);
      if (/^Digit[0-9]$/.test(code)) return code.slice(5);
      return code;
    }

    function normalizeBinding(binding, platform) {
      const modifiers = [];
      (binding.modifiers || []).forEach((modifier) => {
        const resolved = modifier === 'primary' ? (platform === 'macos' ? 'meta' : 'control') : modifier;
        if (MODIFIER_KEYS && resolved && modifiers.indexOf(resolved) === -1) modifiers.push(resolved);
      });
      const codes = [binding.code];
      if (binding.secondCode) codes.push(binding.secondCode);
      return { codes: codes, modifiers: modifiers };
    }

    function keycaps(binding, platform) {
      if (!binding || !binding.code) return [];
      const normalized = normalizeBinding(binding, platform);
      const symbols = platform === 'macos' ? MAC_SYMBOLS : PC_SYMBOLS;
      const caps = normalized.modifiers.map((modifier) => symbols[modifier] || modifier).concat(normalized.codes.map(keyLabel));
      return caps;
    }

    const TEXTS = {
      zh: {
        title: '快捷键',
        intro: '查看应用内的全部快捷键，与默认按键对照。点击「修改」后按下新的组合键，也可以随时还原默认。',
        search: '搜索命令或按键…',
        resetAll: '全部还原默认',
        defaultHeader: '默认',
        currentHeader: '当前',
        commandHeader: '命令',
        edit: '修改',
        reset: '还原',
        cancel: '取消',
        recording: '请按下组合键…',
        recordingHint: '正在录制：按下新的快捷键，按 Esc 取消。',
        modified: '已修改',
        conflict: '冲突',
        issue: '不可用',
        modifiedCount: (count) => '已修改 ' + count + ' 项',
        fixedTitle: '固定按键（只读）',
        loading: '正在读取快捷键设置…',
        unavailable: '快捷键服务不可用，无法读取或修改快捷键。',
        stale: '快捷键设置已被其他窗口修改，请重试。',
        saved: '已保存。',
        failed: '保存失败，请重试。',
        unreadable: '快捷键配置文件无法读取，已临时使用默认值。',
        notReady: '快捷键设置尚未就绪，请稍后重试。',
        refFix: '该组合键与系统或浏览器保留键冲突。',
        needsModifier: '请同时按下一个或多个修饰键（Ctrl / Alt / Shift / Meta）。',
        unsupportedKey: '不支持该按键，请换一个组合键。',
        noMatch: '没有匹配的命令。',
        defaultsUnknown: '默认值不可用',
        conflictWith: (names) => '与以下命令冲突：' + names.join('、'),
      },
      en: {
        title: 'Keyboard shortcuts',
        intro: 'Review every shortcut, compare it with its default binding, and rebind it. Defaults can be restored at any time.',
        search: 'Search commands or keys…',
        resetAll: 'Restore all defaults',
        defaultHeader: 'Default',
        currentHeader: 'Current',
        commandHeader: 'Command',
        edit: 'Edit',
        reset: 'Restore',
        cancel: 'Cancel',
        recording: 'Press a key combination…',
        recordingHint: 'Recording: press the new shortcut, or press Esc to cancel.',
        modified: 'Custom',
        conflict: 'Conflict',
        issue: 'Unusable',
        modifiedCount: (count) => count + ' customized',
        fixedTitle: 'Fixed keys (read-only)',
        loading: 'Loading shortcut settings…',
        unavailable: 'The shortcut service is unavailable, so shortcuts cannot be read or edited.',
        stale: 'Shortcuts were changed in another window. Please try again.',
        saved: 'Saved.',
        failed: 'Could not save the shortcut. Please try again.',
        unreadable: 'The shortcut settings file is unreadable; defaults are in use.',
        notReady: 'Shortcut settings are not ready yet. Please try again.',
        refFix: 'This combination is reserved by the system or the browser.',
        needsModifier: 'Hold at least one modifier key (Ctrl / Alt / Shift / Meta).',
        unsupportedKey: 'This key is not supported; try another combination.',
        noMatch: 'No matching commands.',
        defaultsUnknown: 'Defaults unavailable',
        conflictWith: (names) => 'Conflicts with: ' + names.join(', '),
      },
    };

    const serviceState = { value: undefined, listeners: new Set() };
    const fallbackState = { ctx: undefined };

    function readDirectService() {
      const ctx = fallbackState.ctx;
      if (!ctx) return undefined;
      if (typeof ctx.get === 'function') {
        try {
          const found = ctx.get('shortcuts');
          if (found) return found;
        } catch (error) {
          /* service not present yet */
        }
      }
      try {
        return ctx.shortcuts || undefined;
      } catch (error) {
        return undefined;
      }
    }

    function publishService(value) {
      serviceState.value = value;
      serviceState.listeners.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          console.error('shortcut-editor: listener failed', error);
        }
      });
    }

    const localeState = { service: undefined };

    function useShortcutsService() {
      const [, bump] = React.useReducer((count) => count + 1, 0);
      React.useEffect(() => {
        const update = () => bump();
        serviceState.listeners.add(update);
        const timer = setTimeout(update, 600);
        return () => {
          serviceState.listeners.delete(update);
          clearTimeout(timer);
        };
      }, []);
      return serviceState.value !== undefined ? serviceState.value : readDirectService();
    }

    function readActiveLocale() {
      const service = localeState.service;
      if (!service) return 'en';
      try {
        const snapshot = typeof service.getSnapshot === 'function' ? service.getSnapshot() : service.getLocale();
        const active = snapshot && snapshot.active !== undefined ? snapshot.active : snapshot;
        return typeof active === 'string' && active !== '' ? active : 'en';
      } catch (error) {
        return 'en';
      }
    }

    function useActiveLocale() {
      const [active, setActive] = React.useState(readActiveLocale);
      React.useEffect(() => {
        const service = localeState.service;
        if (!service || typeof service.subscribe !== 'function') return undefined;
        const off = service.subscribe(() => setActive(readActiveLocale()));
        return typeof off === 'function' ? off : undefined;
      }, []);
      return active;
    }

    function useStoreSnapshot(store) {
      const [snapshot, setSnapshot] = React.useState(undefined);
      React.useEffect(() => {
        if (!store) {
          setSnapshot(undefined);
          return undefined;
        }
        setSnapshot(store.getSnapshot());
        if (typeof store.subscribe !== 'function') return undefined;
        const off = store.subscribe(() => setSnapshot(store.getSnapshot()));
        return typeof off === 'function' ? off : undefined;
      }, [store]);
      return snapshot;
    }

    /** Pins one store per service instance so a getter that builds a fresh object cannot loop renders. */
    function useServiceStore(service, key) {
      const ref = React.useRef({ owner: null, store: undefined });
      if (ref.current.owner !== service) {
        let store;
        if (service) {
          try {
            store = service[key];
          } catch (error) {
            store = undefined;
          }
        }
        ref.current = { owner: service, store: store };
      }
      return useStoreSnapshot(ref.current.store);
    }

    function defaultBindingOf(service, id) {
      if (!service || !service.registry || typeof service.registry.definitions !== 'function') return undefined;
      try {
        const definitions = service.registry.definitions();
        if (!Array.isArray(definitions)) return undefined;
        for (let index = 0; index < definitions.length; index += 1) {
          const definition = definitions[index];
          if (!definition || definition.id !== id) continue;
          const defaults = definition.defaults;
          if (!defaults) return undefined;
          return defaults[service.runtime + ':' + service.platform];
        }
      } catch (error) {
        return undefined;
      }
      return undefined;
    }

    const styles = [
      '.dse-root{display:flex;flex-direction:column;height:100%;min-height:0;font-size:14px;color:var(--dsw-alias-label-primary);}',
      '.dse-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:0 0 10px;}',
      '.dse-title{margin:0;font-size:16px;font-weight:600;line-height:24px;}',
      '.dse-intro{margin:2px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);max-width:60ch;}',
      '.dse-toolbar{display:flex;align-items:center;gap:8px;padding:0 0 8px;}',
      '.dse-search{flex:1;min-width:0;height:30px;box-sizing:border-box;padding:0 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;font-size:13px;outline:none;}',
      '.dse-search:focus{border-color:var(--dsw-alias-brand-primary);}',
      '.dse-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;padding:3px 10px;cursor:pointer;white-space:nowrap;}',
      '.dse-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1);}',
      '.dse-btn:disabled{opacity:.45;cursor:default;}',
      '.dse-btn-accent{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);}',
      '.dse-note{margin:0 0 8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);}',
      '.dse-list{flex:1;min-height:0;overflow-y:auto;border-top:1px solid var(--dsw-alias-border-l1);}',
      '.dse-group{padding:12px 2px 4px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);}',
      '.dse-thead{position:sticky;top:0;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) 150px 168px 124px;gap:12px;align-items:end;padding:8px 2px 6px;background:var(--dsw-alias-bg-base);border-bottom:1px solid var(--dsw-alias-border-l1);}',
      '.dse-th{font-size:11px;line-height:16px;font-weight:600;letter-spacing:.04em;color:var(--dsw-alias-label-secondary);}',
      '.dse-row{display:grid;grid-template-columns:minmax(0,1fr) 150px 168px 124px;gap:12px;align-items:center;padding:6px 2px;border-bottom:1px solid var(--dsw-alias-border-l1);}',
      '.dse-row:hover{background:var(--dsw-alias-bg-layer-1);}',
      '.dse-row-on{background:var(--dsw-alias-bg-layer-1);outline:1px solid var(--dsw-alias-brand-primary);outline-offset:-1px;border-radius:6px;}',
      '.dse-cell{display:flex;align-items:center;min-width:0;overflow:hidden;}',
      '.dse-main{min-width:0;display:flex;flex-direction:column;gap:1px;}',
      '.dse-meta{display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;}',
      '.dse-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dse-id{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dse-keys{display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-start;min-height:22px;}',
      '.dse-kbd{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 5px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:var(--dsw-alias-bg-base);font-size:11px;line-height:1;color:var(--dsw-alias-label-primary);}',
      '.dse-kbd-dim{color:var(--dsw-alias-label-secondary);border-color:var(--dsw-alias-border-l1);background:transparent;}',
      '.dse-actions{display:flex;align-items:center;gap:6px;justify-content:flex-end;}',
      '.dse-actions .dse-cell,.dse-actions{min-width:0;}',
      '.dse-tag{font-size:10px;line-height:16px;padding:0 6px;border-radius:999px;color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);}',
      '.dse-tag-warn{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 14%,transparent);}',
      '.dse-tag-error{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);}',
      '.dse-recording{font-size:12px;color:var(--dsw-alias-brand-primary);white-space:nowrap;}',
      '.dse-empty{padding:24px 2px;text-align:center;font-size:13px;color:var(--dsw-alias-label-secondary);}',
      '.dse-section{padding:14px 2px 4px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);}',
      '.dse-row-fixed{grid-template-columns:minmax(0,1fr) minmax(0,auto);opacity:.85;}',
    ].join('');

    function Keycaps(props) {
      const caps = keycaps(props.binding, props.platform);
      if (caps.length === 0) {
        return h('span', { className: 'dse-keys' }, h('span', { className: 'dse-id' }, props.emptyLabel || '—'));
      }
      return h(
        'span',
        { className: 'dse-keys' },
        caps.map((cap, index) =>
          h('kbd', { key: String(index) + cap, className: props.dim ? 'dse-kbd dse-kbd-dim' : 'dse-kbd' }, cap),
        ),
      );
    }

    function ShortcutSection() {
      const locale = useActiveLocale();
      const zh = /^zh/i.test(locale);
      const t = zh ? TEXTS.zh : TEXTS.en;
      const service = useShortcutsService();
      const catalog = useServiceStore(service, 'catalog');
      const config = useServiceStore(service, 'config');
      const fixedCatalog = useServiceStore(service, 'fixedCatalog');
      const [query, setQuery] = React.useState('');
      const [recordingId, setRecordingId] = React.useState(null);
      const [notice, setNotice] = React.useState(null);
      const [busy, setBusy] = React.useState(false);

      const rows = React.useMemo(() => {
        if (!Array.isArray(catalog)) return [];
        const needle = query.trim().toLowerCase();
        return catalog
          .filter((row) => {
            if (!needle) return true;
            const haystack = [row.label || '', row.id, (row.keys || []).join(' '), (row.aliases || []).join(' ')]
              .join(' ')
              .toLowerCase();
            return haystack.indexOf(needle) !== -1;
          })
          .sort((left, right) => String(left.label || left.id).localeCompare(String(right.label || right.id)));
      }, [catalog, query]);

      const labels = React.useMemo(() => {
        const map = new Map();
        (catalog || []).forEach((row) => map.set(row.id, row.label || row.id));
        (fixedCatalog || []).forEach((row) => map.set(row.id, row.label || row.id));
        return map;
      }, [catalog, fixedCatalog]);

      const modifiedCount = (catalog || []).filter((row) => row.modified).length;

      const submit = React.useCallback(
        async (edit) => {
          if (!service) return;
          const revision = config ? config.revision : undefined;
          if (revision === undefined) {
            setNotice({ kind: 'error', text: t.notReady });
            return;
          }
          setBusy(true);
          try {
            const result = await service.edit(edit, revision);
            const status = result && result.status;
            if (status === 'saved') {
              setNotice({ kind: 'ok', text: t.saved });
            } else if (status === 'conflict') {
              const names = (result.conflicts || []).map((id) => labels.get(id) || id);
              let text = t.failed;
              if (result.issue === 'modifier-required') text = t.needsModifier;
              else if (result.issue === 'reserved') text = t.refFix;
              else if (result.issue === 'unsupported-browser') text = t.refFix;
              else if (result.issue === 'unsupported-key') text = t.unsupportedKey;
              if (names.length > 0) text = text + ' ' + t.conflictWith(names);
              setNotice({ kind: 'error', text: text });
            } else if (status === 'stale') {
              setNotice({ kind: 'error', text: t.stale });
            } else if (status === 'unreadable') {
              setNotice({ kind: 'error', text: t.unreadable });
            } else if (status === 'not-ready') {
              setNotice({ kind: 'error', text: t.notReady });
            } else {
              setNotice({ kind: 'error', text: t.failed });
            }
          } catch (error) {
            console.error('shortcut-editor: edit failed', error);
            setNotice({ kind: 'error', text: t.failed });
          } finally {
            setBusy(false);
          }
        },
        [service, config, labels, t],
      );

      React.useEffect(() => {
        if (!service || recordingId === null) return undefined;
        const targets = [window, document];
        const capture = (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (event.repeat) return;
          if (event.key === 'Escape') {
            setRecordingId(null);
            setNotice(null);
            return;
          }
          if (MODIFIER_KEYS.indexOf(event.key) !== -1) return;
          const code = event.code;
          if (!isSupportedCode(code)) {
            setNotice({ kind: 'error', text: t.unsupportedKey });
            return;
          }
          const modifiers = [];
          MODIFIERS.forEach((pair) => {
            if (event[pair[1]]) modifiers.push(pair[0]);
          });
          setRecordingId(null);
          submit({ type: 'set', id: recordingId, binding: { code: code, modifiers: modifiers } });
        };
        const guard = (event) => {
          if (event.type === 'keydown' && event.key === 'Escape') return;
          event.stopPropagation();
        };
        targets.forEach((target) => {
          target.addEventListener('keydown', capture, true);
          target.addEventListener('keyup', guard, true);
          target.addEventListener('keypress', guard, true);
        });
        if (typeof service.recording === 'function') {
          try {
            service.recording(true);
          } catch (error) {
            console.error('shortcut-editor: recording(true) failed', error);
          }
        }
        return () => {
          targets.forEach((target) => {
            target.removeEventListener('keydown', capture, true);
            target.removeEventListener('keyup', guard, true);
            target.removeEventListener('keypress', guard, true);
          });
          if (typeof service.recording === 'function') {
            try {
              service.recording(false);
            } catch (error) {
              console.error('shortcut-editor: recording(false) failed', error);
            }
          }
        };
      }, [service, recordingId, submit, t]);

      const body = [];
      body.push(h('style', { key: 'dse-style' }, styles));
      body.push(
        h(
          'div',
          { key: 'dse-head', className: 'dse-head' },
          h(
            'div',
            { style: { minWidth: 0 } },
            h('h2', { className: 'dse-title' }, t.title),
            h('p', { className: 'dse-intro' }, t.intro),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dse-btn dse-btn-accent',
              disabled: busy || modifiedCount === 0,
              onClick: () => {
                setNotice(null);
                setRecordingId(null);
                submit({ type: 'reset-all' });
              },
            },
            t.resetAll,
          ),
        ),
      );

      if (!service) {
        body.push(h('p', { key: 'dse-unavailable', className: 'dse-note' }, t.unavailable));
        return h('div', { className: 'dse-root' }, body);
      }

      if (config && config.status === 'unreadable') {
        body.push(h('p', { key: 'dse-unreadable', className: 'dse-note' }, t.unreadable));
      }

      body.push(
        h(
          'div',
          { key: 'dse-toolbar', className: 'dse-toolbar' },
          h('input', {
            className: 'dse-search',
            type: 'search',
            value: query,
            placeholder: t.search,
            spellCheck: false,
            onChange: (event) => setQuery(event.target.value),
          }),
          h('span', { className: 'dse-id' }, t.modifiedCount(modifiedCount)),
        ),
      );

      if (notice) {
        body.push(
          h(
            'p',
            {
              key: 'dse-notice-' + notice.text,
              className: 'dse-note',
              style: {
                color:
                  notice.kind === 'ok'
                    ? 'var(--dsw-alias-state-success-primary)'
                    : 'var(--dsw-alias-state-error-primary)',
              },
            },
            notice.text,
          ),
        );
      }

      if (recordingId !== null) {
        body.push(h('p', { key: 'dse-recording', className: 'dse-note' }, t.recordingHint));
      }

      const list = [];
      if (!Array.isArray(catalog)) {
        list.push(h('div', { key: 'dse-loading', className: 'dse-empty' }, t.loading));
      } else if (rows.length === 0) {
        const emptyText = query.trim() === '' && catalog.length === 0 ? t.loading : t.noMatch;
        list.push(h('div', { key: 'dse-empty', className: 'dse-empty' }, emptyText));
      } else {
        list.push(
          h(
            'div',
            { key: 'dse-thead', className: 'dse-thead' },
            h('span', { className: 'dse-th' }, t.commandHeader),
            h('span', { className: 'dse-th' }, t.defaultHeader),
            h('span', { className: 'dse-th' }, t.currentHeader),
            h('span', {}),
          ),
        );
        rows.forEach((row) => {
          const active = recordingId === row.id;
          const fallback = defaultBindingOf(service, row.id);
          const tags = [];
          if (row.modified) tags.push(h('span', { key: 'm', className: 'dse-tag' }, t.modified));
          if (Array.isArray(row.conflicts) && row.conflicts.length > 0) {
            tags.push(h('span', { key: 'c', className: 'dse-tag dse-tag-error' }, t.conflict));
          } else if (row.issue) {
            tags.push(h('span', { key: 'i', className: 'dse-tag dse-tag-warn' }, t.issue));
          }
          list.push(
            h(
              'div',
              { key: row.id, className: active ? 'dse-row dse-row-on' : 'dse-row' },
              h(
                'div',
                { className: 'dse-main' },
                h('span', { className: 'dse-label', title: row.label || row.id }, row.label || row.id),
                h(
                  'div',
                  { className: 'dse-meta' },
                  h('span', { className: 'dse-id', title: row.id }, row.id),
                  tags,
                ),
              ),
              h(
                'div',
                { className: 'dse-cell' },
                h(Keycaps, {
                  binding: fallback,
                  platform: service.platform,
                  dim: true,
                  emptyLabel: t.defaultsUnknown,
                }),
              ),
              h(
                'div',
                { className: 'dse-cell' },
                active
                  ? h('span', { className: 'dse-recording' }, t.recording)
                  : h(Keycaps, { binding: row.binding, platform: service.platform }),
              ),
              h(
                'div',
                { className: 'dse-actions' },
                active
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'dse-btn',
                        onClick: () => {
                          setRecordingId(null);
                          setNotice(null);
                        },
                      },
                      t.cancel,
                    )
                  : h(
                      'button',
                      {
                        type: 'button',
                        className: 'dse-btn',
                        disabled: busy,
                        onClick: () => {
                          setNotice(null);
                          setRecordingId(row.id);
                        },
                      },
                      t.edit,
                    ),
                row.modified && !active
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'dse-btn',
                        disabled: busy,
                        onClick: () => {
                          setNotice(null);
                          submit({ type: 'reset', id: row.id });
                        },
                      },
                      t.reset,
                    )
                  : null,
              ),
            ),
          );
        });
      }

      if (Array.isArray(fixedCatalog) && fixedCatalog.length > 0) {
        list.push(h('div', { key: 'dse-fixed-title', className: 'dse-section' }, t.fixedTitle));
        fixedCatalog.forEach((row) => {
          list.push(
            h(
              'div',
              { key: 'fixed-' + row.id, className: 'dse-row dse-row-fixed' },
              h(
                'div',
                { className: 'dse-main' },
                h('span', { className: 'dse-label' }, row.label || row.id),
                h('span', { className: 'dse-id' }, row.group ? row.group + ' · ' + row.id : row.id),
              ),
              h(
                'span',
                { className: 'dse-keys' },
                (row.keys || []).map((cap, index) =>
                  h('kbd', { key: String(index) + cap, className: 'dse-kbd dse-kbd-dim' }, cap),
                ),
              ),
            ),
          );
        });
      }

      body.push(h('div', { key: 'dse-list', className: 'dse-list' }, list));
      return h('div', { className: 'dse-root' }, body);
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        fallbackState.ctx = ctx;
        try {
          localeState.service = ctx.get('locale');
        } catch (error) {
          localeState.service = undefined;
        }

        ctx.effect(() =>
          ctx.slots.inject('settings.section', () =>
            ctx.slots.register(
              {
                name: 'settings.section',
                id: 'shortcut-editor',
                order: 30,
                label: () => {
                  const zh = /^zh/i.test(readActiveLocale());
                  return zh ? TEXTS.zh.title : TEXTS.en.title;
                },
              },
              ShortcutSection,
            ),
          ),
        );

        const attach = (shortcutCtx) => {
          try {
            publishService(shortcutCtx.shortcuts);
          } catch (error) {
            publishService(undefined);
          }
          return () => publishService(undefined);
        };

        if (typeof ctx.inject === 'function') {
          ctx.effect(() => ctx.inject(['shortcuts'], attach));
        } else {
          try {
            publishService(ctx.shortcuts);
          } catch (error) {
            publishService(undefined);
          }
        }
      },
    };
  },
});
