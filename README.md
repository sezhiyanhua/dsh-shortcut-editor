# 快捷键编辑器 / Keyboard Shortcuts Editor

A DeepSeek Harness plugin that adds a **Keyboard shortcuts** page to Settings: see every shortcut the app registers, compare the current binding with its default, rebind it by pressing a key combination, and restore one item or all of them at once.

一个 DeepSeek Harness 插件，在设置里加一个「快捷键」页：列出应用注册的全部快捷键，与默认按键对照，按键直接重绑，并可按项或全部还原默认。

## 功能 / Features

- 列表 / List every registered command with its **default** binding and its **current** binding, side by side.
- 录制修改 / Click **修改 (Edit)** and press a combination; `Esc` cancels. The recorded key never reaches the app's own shortcut handler.
- 冲突与不可用提示 / Shows `已修改` (customized), `冲突` (conflicts with another command), and `不可用` (reserved by the system/browser, or unsupported on this platform).
- 还原 / **还原 (Restore)** puts one command back to its default; **全部还原默认 (Restore all defaults)** clears every customization.
- 固定按键 / Read-only list of the fixed key sequences that cannot be rebound.
- 搜索 / Search across labels, ids, key caps and aliases.
- 中英双语 / Follows the app language; Chinese and English are built in.

## 安装 / Install

```sh
dsh plugin --profile <profile> add <this-repo-or-package>
```

Or, from the plugin market / 或在插件市场里一键安装。

Restart or refresh the Web GUI, then open **Settings → 快捷键 / Keyboard shortcuts**.

## 说明 / How it works

- The page reads and writes through the client service `shortcuts` (`catalog`, `config`, `edit`, `registry`), the same store the app's own key router uses, so changes take effect without a restart.
- On Web the bindings live in `localStorage` under `dsh.keybindings.v1`, scoped per `runtime:platform` profile; the desktop client stores them through `window.dshDesktop.shortcuts`.
- Only combinations the host accepts can be saved: at least one modifier, not a reserved system/browser combination, and a supported key code. Rejected combinations are explained in place instead of being written.

## 限制 / Limitations

- Web 端录制由插件自己监听 `keydown`（宿主在 Web 上不做原生按键拦截），因此录制期间插件会接管键盘事件并在结束后释放。
- 桌面端宿主会额外调用 `recording(true/false)` 暂停自己的快捷键拦截。
- 快捷键列表只涵盖通过 `shortcuts` 服务注册的命令，未注册的命令不会被列出。

## 卸载 / Uninstall

```sh
dsh plugin --profile <profile> remove <package-name>
```

Custom bindings stay in `localStorage` unless you restore the defaults first.

## License

MIT
