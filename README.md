# Pinax 🦀

**Pinax** is a keyboard-first Git Workbench built with Tauri, React, and TypeScript. It's designed for developers who prefer speed and efficiency, offering a Vim-inspired navigation experience and a clean, high-performance interface.

## 🚀 Quick Start

1. **Clone the repository**
2. **Install dependencies:** `npm install`
3. **Run in development mode:** `npm run tauri dev`
4. **Build for production:** `npm run tauri build`

## 🐧 Linux Dependencies

Building or running Pinax on Linux requires several system libraries (GTK, WebKit2GTK, etc.). 

### Ubuntu / Debian
```bash
sudo apt-get update
sudo apt-get install -y \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libssl-dev \
    build-essential \
    curl \
    wget \
    pkg-config
```

### Fedora
```bash
sudo dnf groupinstall "Development Tools"
sudo dnf install \
    gtk3-devel \
    webkit2gtk4.1-devel \
    libayatana-appindicator-devel \
    librsvg2-devel \
    openssl-devel
```

### Arch Linux
```bash
sudo pacman -S --needed \
    base-devel \
    curl \
    wget \
    gtk3 \
    webkit2gtk-4.1 \
    libayatana-appindicator \
    librsvg
```

## ✨ Key Features

- **Keyboard-First Design:** Full Vim-style navigation and shortcuts.
- **Git Workbench:** View branch status, staged/unstaged changes, and untracked files at a glance.
- **Modern UI:** Built with Tailwind CSS and Framer Motion for a premium, responsive feel.
- **Cross-Platform:** High-performance desktop experience powered by Tauri.

## ⌨️ Keybindings

- `j` / `k`: Navigate repositories in the sidebar.
- `Enter`: Select repository.
- `⌘P` / `Ctrl+P`: Open Command Palette.
- `Esc`: Close palette or clear focus.

---
*Built with ❤️ for the Git community.*
