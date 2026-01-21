#!/usr/bin/env bash
set -e

# ---------- Detect distro ----------
if [ -f /etc/os-release ]; then
  . /etc/os-release
else
  echo "cannot detect Linux distribution."
  exit 1
fi

PKG_MANAGER=""

case "$ID" in
  arch|manjaro|endeavouros)
    PKG_MANAGER="pacman"
    ;;
  ubuntu|debian|linuxmint|pop)
    PKG_MANAGER="apt"
    ;;
  fedora)
    PKG_MANAGER="dnf"
    ;;
  opensuse*|suse)
    PKG_MANAGER="zypper"
    ;;
  *)
    echo "unsupported distro ($ID). Install dependencies manually."
    exit 1
    ;;
esac

echo "detected distro: $PRETTY_NAME"

# ---------- Install System Dependencies (Tauri + AppImage) ----------
echo "Installing system dependencies..."
case "$PKG_MANAGER" in
  pacman)
    sudo pacman -Sy --needed --noconfirm \
      base-devel curl wget git \
      webkit2gtk openssl libayatana-appindicator librsvg \
      fuse2 libxcrypt-compat squashfs-tools file
    ;;
  apt)
    sudo apt update
    sudo apt install -y \
      build-essential \
      curl wget git \
      libssl-dev \
      libwebkit2gtk-4.0-dev \
      libayatana-appindicator3-dev \
      librsvg2-dev \
      libfuse2 \
      squashfs-tools file
    ;;
  dnf)
    sudo dnf groupinstall -y "Development Tools"
    sudo dnf install -y \
      curl wget git \
      webkit2gtk3-devel \
      openssl-devel \
      libayatana-appindicator-devel \
      librsvg2-devel
    ;;
  zypper)
    sudo zypper install -y -t pattern devel_basis
    sudo zypper install -y \
      curl wget git \
      webkit2gtk3-devel \
      libopenssl-devel \
      libayatana-appindicator3-devel \
      librsvg-devel
    ;;
esac

# ---------- Install Rust ----------
if ! command -v rustc >/dev/null 2>&1; then
  echo "Rust not found. Installing via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  echo "Rust is already installed."
fi

# ---------- Install Node.js & pnpm ----------
if ! command -v node >/dev/null 2>&1; then
  echo "node-js not found. Installing..."

  case "$PKG_MANAGER" in
    pacman)
      sudo pacman -S --needed --noconfirm nodejs npm
      ;;
    apt)
      sudo apt install -y nodejs npm
      ;;
    dnf)
      sudo dnf install -y nodejs npm
      ;;
    zypper)
      sudo zypper install -y nodejs npm
      ;;
  esac
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Installing..."
  if command -v corepack >/dev/null 2>&1; then
    sudo corepack enable
    sudo corepack prepare pnpm@latest --activate
  else
    sudo npm install -g pnpm
  fi
fi

# ---------- Install Project Dependencies ----------
pnpm install

pnpm tauri build --bundles deb

# ---------- Arch-only packaging (Optional) ----------
if [ "$PKG_MANAGER" == "pacman" ] && [ -f PKGBUILD ]; then
  echo "Detected PKGBUILD, creating Arch package..."
  makepkg -fsi --noconfirm
fi

echo "Done."
