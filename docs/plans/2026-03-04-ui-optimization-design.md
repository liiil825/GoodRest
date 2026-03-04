# UI 优化设计方案

## 概述

优化 GoodRest 应用的界面设计：
1. 休息模式背景色改为自然绿色系
2. 设置页面改为单页路由设计

## 设计决策

### 1. 休息模式背景色

**选择**：自然绿色渐变 - `from-green-400 to-emerald-600`

理由：绿色象征自然、放松，与休息主题契合

### 2. 设置页面路由

**选择**：使用 Zustand 状态管理实现页面切换

理由：
- 项目已有 Zustand，无需额外依赖
- 简单够用，符合当前项目复杂度
- 避免引入 React Router 的额外复杂性

## 改动清单

### 1. ReminderWindow.tsx

修改休息模式背景色：
```tsx
// 从
className="bg-gradient-to-br from-blue-500 to-indigo-600"
// 改为
className="bg-gradient-to-br from-green-400 to-emerald-600"
```

### 2. settingsStore.ts

添加页面路由状态：
```typescript
currentPage: 'home' | 'settings'
setCurrentPage: (page: 'home' | 'settings') => void
```

### 3. App.tsx

- 移除 Settings 弹窗组件
- 添加 HomePage 和 SettingsPage 组件
- 根据 currentPage 状态渲染不同页面

### 4. Settings.tsx

- 移除弹窗逻辑（isOpen, onClose）
- 添加返回按钮和页面样式
- 适配新的页面布局

## 页面结构

```
App
├── HomePage (currentPage === 'home')
│   ├── 状态显示
│   ├── 倒计时
│   └── 设置按钮 → setCurrentPage('settings')
├── SettingsPage (currentPage === 'settings')
│   ├── 返回按钮 → setCurrentPage('home')
│   └── 设置表单
└── ReminderWindow (休息模式时覆盖)
    └── 绿色渐变背景
```
