# GoodRest - Tauri 跨平台休息提醒应用

## 项目概述
GoodRest 是一款基于 Tauri + React + TypeScript 构建的跨平台休息提醒应用，旨在通过周期性全屏提醒帮助用户缓解眼疲劳。主要特性：
- 每 20 分钟触发一次全屏覆盖休息提醒（提醒间隔后期可自定义）
- 提醒界面包含动态文字提示（如“慢慢的向左看，然后向右看”）以及“稍后提醒”和“跳过”按钮
- 系统托盘图标常驻后台，支持应用退出、暂停提醒等操作
- 设置界面（规划中）允许用户自定义提醒间隔和提醒文案
- 支持 macOS、Linux、Windows 三大平台

## 技术栈
- **后端**：Rust (Tauri)
- **前端**：React 18 + TypeScript
- **构建工具**：Vite
- **包管理器**：bun
- **样式**：Tailwind CSS
- **状态管理**：Zustand（可选，建议用于管理提醒状态）
- **持久化**：Tauri Plugin Store（用于存储用户设置）
- **定时器**：Rust 侧使用 `tokio::time` 或 `std::thread::sleep` 配合 Tauri 事件

## 目录结构

GoodRest/
├── src-tauri/ # Tauri 后端代码
│ ├── src/
│ │ ├── main.rs # Rust 入口，初始化应用、托盘、定时器
│ │ ├── timer.rs # 定时提醒模块（可选拆分）
│ │ └── tray.rs # 系统托盘模块（可选拆分）
│ ├── Cargo.toml # Rust 依赖配置
│ ├── tauri.conf.json # Tauri 主配置文件
│ └── icons/ # 应用图标（各平台格式）
├── src/ # 前端源代码
│ ├── main.tsx # React 入口
│ ├── App.tsx # 主应用组件
│ ├── components/ # 通用组件
│ │ ├── ReminderWindow.tsx # 全屏提醒窗口组件
│ │ └── Settings.tsx # 设置页面（未来）
│ ├── stores/ # Zustand 状态管理
│ │ ├── reminderStore.ts # 提醒状态（是否正在提醒等）
│ │ └── settingsStore.ts # 设置存储（间隔、文案等）
│ ├── lib/ # 工具函数、常量
│ │ ├── constants.ts # 默认提醒间隔（20分钟）、默认文案
│ │ └── tauriEvents.ts # Tauri 事件监听/发送封装
│ └── styles/ # 全局样式（Tailwind 导入）
├── public/ # 静态资源（如托盘图标备用）
├── index.html
├── package.json
├── bun.lockb
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts

## 开发命令
```bash
# 安装依赖
bun install

# 启动前端开发服务器（仅用于前端调试）
bun run dev

# 启动 Tauri 开发应用（全栈）
bun run tauri dev

# 构建生产版本
bun run tauri build

# 代码格式化（前端）
bun run format

# Rust 代码格式化
cd src-tauri && cargo fmt

# Rust 代码检查
cd src-tauri && cargo clippy
```

## 代码风格
TypeScript：开启严格模式，避免使用 any，为所有函数和组件定义接口/类型。
- React：函数式组件 + Hooks，组件文件使用 .tsx 后缀。
- 样式：使用 Tailwind 工具类，避免自定义 CSS（除非必要）。主题色、字体等通过 Tailwind 配置文件统一管理。
- Rust：遵循 cargo fmt 和 clippy 规范，错误处理使用 anyhow 或自定义错误类型。
- 提交信息：遵循 Conventional Commits 规范（如 feat: add reminder window）。

