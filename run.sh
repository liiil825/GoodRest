#!/bin/bash
# GoodRest Linux launcher script
# 自动检测 Wayland/Hyprland 环境并设置兼容变量

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 检测 Linux 桌面环境
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # 检查是否在 Wayland 环境中运行
    if [[ -n "$WAYLAND_DISPLAY" ]] || [[ -n "$XDG_SESSION_TYPE" ]] && [[ "$XDG_SESSION_TYPE" == "wayland" ]]; then
        echo "Detected Wayland environment, setting compatibility variables..."
        export WEBKIT_DISABLE_COMPOSITING_MODE=1
        export GDK_BACKEND=x11
    # 检查 Hyprland
    elif [[ -n "$HYPRLAND_INSTANCE_SIGNATURE" ]]; then
        echo "Detected Hyprland, setting compatibility variables..."
        export WEBKIT_DISABLE_COMPOSITING_MODE=1
        export GDK_BACKEND=x11
    fi
fi

"$SCRIPT_DIR/src-tauri/target/release/goodrest"
