#!/bin/bash
# GoodRest Linux launcher script
# 自动检测 Wayland/Hyprland 环境并设置兼容变量

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 检测 Linux 桌面环境
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Wayland 或 Hyprland 环境需要兼容性设置
    if [[ -n "$WAYLAND_DISPLAY" ]] || [[ "$XDG_SESSION_TYPE" == "wayland" ]] || [[ -n "$HYPRLAND_INSTANCE_SIGNATURE" ]]; then
        echo "Detected Wayland/Hyprland, setting compatibility variables..."
        export WEBKIT_DISABLE_COMPOSITING_MODE=1
        export GDK_BACKEND=x11
    fi
fi

"$SCRIPT_DIR/src-tauri/target/release/goodrest"
