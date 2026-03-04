# UI Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize UI with green gradient for rest mode and implement SPA routing for settings page using Zustand.

**Architecture:** Use Zustand state to manage page navigation (home/settings), modify ReminderWindow for green theme.

**Tech Stack:** React, Zustand, Tailwind CSS

---

## Task 1: Update ReminderWindow background color

**Files:**
- Modify: `src/components/ReminderWindow.tsx`

**Step 1: Change background gradient**

Modify line 44 in `src/components/ReminderWindow.tsx`:
```tsx
// From
className="fixed inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col"
// To
className="fixed inset-0 bg-gradient-to-br from-green-400 to-emerald-600 flex flex-col"
```

**Step 2: Commit**

```bash
git add src/components/ReminderWindow.tsx
git commit -m "feat: change rest mode background to green gradient"
```

---

## Task 2: Add page routing state to settingsStore

**Files:**
- Modify: `src/stores/settingsStore.ts`

**Step 1: Add currentPage state**

Modify `src/stores/settingsStore.ts`:
```typescript
// Add to interface
currentPage: 'home' | 'settings';
setCurrentPage: (page: 'home' | 'settings') => void;

// Add to initial state
currentPage: 'home',
setCurrentPage: (page) => set({ currentPage: page }),
```

**Step 2: Commit**

```bash
git add src/stores/settingsStore.ts
git commit -m "feat: add currentPage state for routing"
```

---

## Task 3: Convert Settings component to page

**Files:**
- Modify: `src/components/Settings.tsx`

**Step 1: Remove modal logic**

Remove `isOpen` and `onClose` props from interface. Remove line:
```typescript
if (!isOpen) return null;
```

**Step 2: Add back button and page styles**

Replace the modal wrapper div with page layout:
```tsx
return (
  <div className="min-h-screen bg-gray-100 p-6">
    <div className="max-w-md mx-auto">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => window.history.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← 返回
        </button>
        <h2 className="text-xl font-bold text-gray-800 ml-4">设置</h2>
      </div>

      {/* Rest of the form... */}
```

**Step 3: Commit**

```bash
git add src/components/Settings.tsx
git commit -m "feat: convert Settings to page component"
```

---

## Task 4: Refactor App.tsx for SPA routing

**Files:**
- Modify: `src/App.tsx`

**Step 1: Remove Settings modal and add routing**

Replace the Settings component usage with conditional rendering based on currentPage:

```typescript
import { useSettingsStore } from './stores/settingsStore';

// Inside App component:
const { currentPage, setCurrentPage } = useSettingsStore();

// Remove: const [showSettings, setShowSettings] = useState(false);

// Replace the return statement:
return (
  <div className="min-h-screen bg-gray-100">
    {currentPage === 'settings' ? (
      <Settings
        workMinutes={workMinutes}
        restSeconds={restSeconds}
        onSave={handleSaveSettings}
      />
    ) : (
      /* Home page content */
      <div className="text-center">
        ...
        <button onClick={() => setCurrentPage('settings')}>
          设置
        </button>
        ...
      </div>
    )}
    {/* ReminderWindow still overlays when resting */}
  </div>
);
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: implement SPA routing for settings page"
```

---

## Task 5: Fix Settings back button navigation

**Files:**
- Modify: `src/components/Settings.tsx`

**Step 1: Use setCurrentPage for back button**

Modify the back button to use Zustand store:
```typescript
import { useSettingsStore } from '../stores/settingsStore';

function Settings({ workMinutes, restSeconds, onSave }: SettingsProps) {
  const setCurrentPage = useSettingsStore((state) => state.setCurrentPage);

  // Change back button:
  <button onClick={() => setCurrentPage('home')}>
    ← 返回
  </button>
}
```

**Step 2: Commit**

```bash
git add src/components/Settings.tsx
git commit -m "fix: use Zustand for back navigation"
```

---

## Task 6: Verify and test

**Step 1: Run frontend**

Run: `pnpm dev`
Expected: App starts, clicking "设置" navigates to settings page, back button works

**Step 2: Run tests**

Run: `pnpm test run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: complete UI optimization - green rest mode and SPA routing"
```
