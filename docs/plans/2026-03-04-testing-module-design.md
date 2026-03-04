# 测试模块设计方案

## 概述

为 GoodRest 项目添加轻量级测试模块，覆盖前端核心逻辑和后端定时逻辑。

## 技术选型

- **前端测试框架**：Vitest（Vite 内置，零配置）
- **后端测试框架**：Rust 原生 `#[test]` + `#[cfg(test)]`

## 测试覆盖

### 1. 前端测试

**测试文件位置**：`src/__tests__/`

| 测试文件 | 覆盖模块 | 测试内容 |
|----------|----------|----------|
| `reminderStore.test.ts` | stores/reminderStore.ts | 状态初始化、`showReminder`/`hideReminder` 逻辑 |
| `settingsStore.test.ts` | stores/settingsStore.ts | 设置状态、暂停/恢复、倒计时计算 |
| `constants.test.ts` | lib/constants.ts | 默认值导出验证 |

### 2. 后端测试

**测试文件位置**：`src-tauri/src/timer.rs` 同文件内（`#[cfg(test)]` 模块）

| 测试函数 | 覆盖模块 | 测试内容 |
|----------|----------|----------|
| `test_timer_state_default` | timer.rs TimerState | 默认值初始化、状态字段验证 |
| `test_work_mode_variants` | timer.rs WorkMode | 枚举值正确性 |

## 运行命令

### 前端
```bash
pnpm test          # 运行测试
pnpm test --watch  # 监听模式
```

### 后端
```bash
cd src-tauri && cargo test
```

## 设计原则

1. **轻量级**：零额外依赖，使用项目已有的工具
2. **聚焦核心**：只测试关键业务逻辑，不覆盖 UI 组件
3. **快速执行**：测试应在秒级完成
