# GoodRest

GoodRest is a beautifully designed Pomodoro and rest reminder application built specifically for macOS. It helps you maintain a healthy balance between focused work and necessary breaks to prevent eye strain and fatigue.

## Features

- **Pomodoro Timer**: Customizable work and rest intervals to keep you productive.
- **Full-Screen Rest mode**: A smooth, distraction-free macOS full-screen overlay ensures you take your much-needed breaks.
- **System Integration**: Seamlessly integrates with macOS dock and system tray. Clicking the icon lets you quickly toggle, show, hide, or minimize the window.
- **Customizable Alerts**: Configurable sound and visual notifications for when it's time to rest or get back to work.
- **Modern UI**: Clean and intuitive settings panel with customizable Time and Sound adjustments.

## Tech Stack

GoodRest is built using modern web and desktop technologies:
- **[Tauri](https://tauri.app/)**: For a lightweight, fast, and secure desktop application backend (Rust).
- **[React](https://reactjs.org/)**: For building a dynamic and responsive user interface.
- **[Vite](https://vitejs.dev/)**: For lightning-fast frontend tooling and building.
- **[Tailwind CSS](https://tailwindcss.com/)**: For rapid, highly-customizable UI styling.
- **[Zustand](https://github.com/pmndrs/zustand)**: For simple and scalable state management.

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- Rust (latest stable)
- pnpm (recommended package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/liiil825/GoodRest.git
   cd GoodRest
   ```

2. Install frontend dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm tauri dev
   ```

### Building for Production

To build the application for release:
```bash
pnpm tauri build
```
The compiled macOS bundle will be located in `src-tauri/target/release/bundle/`.

## License

This project is licensed under the MIT License.
