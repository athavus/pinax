#!/usr/bin/env bash
set -e

echo "Instalando Pinax 1.4.3..."
echo ""

# ---------- Detect distro ----------
if [ -f /etc/os-release ]; then
  . /etc/os-release
else
  echo "❌ Não foi possível detectar a distribuição Linux."
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
    echo "❌ Distribuição não suportada ($ID). Instale as dependências manualmente."
    exit 1
    ;;
esac

echo "✅ Distribuição detectada: $PRETTY_NAME"
echo ""

# ---------- Install System Dependencies ----------
echo "📦 Instalando dependências do sistema..."
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
echo "✅ Dependências do sistema instaladas!"
echo ""

# ---------- Install Rust ----------
if ! command -v rustc >/dev/null 2>&1; then
  echo "Rust não encontrado. Instalando via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
  echo "✅ Rust instalado!"
else
  echo "✅ Rust já está instalado."
fi
echo ""

# ---------- Install Node.js & pnpm ----------
if ! command -v node >/dev/null 2>&1; then
  echo "📦 Node.js não encontrado. Instalando..."
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
  echo "✅ Node.js instalado!"
else
  echo "✅ Node.js já está instalado."
fi
echo ""

if ! command -v pnpm >/dev/null 2>&1; then
  echo "📦 pnpm não encontrado. Instalando..."
  if command -v corepack >/dev/null 2>&1; then
    sudo corepack enable
    sudo corepack prepare pnpm@latest --activate
  else
    sudo npm install -g pnpm
  fi
  echo "✅ pnpm instalado!"
else
  echo "✅ pnpm já está instalado."
fi
echo ""

# ---------- Install Project Dependencies ----------
echo "📥 Instalando dependências do projeto..."
pnpm install
echo "✅ Dependências instaladas!"
echo ""

# ---------- Build ----------
echo "🔨 Compilando o projeto..."
NO_STRIP=true pnpm tauri build --bundles deb,appimage
echo "✅ Compilação concluída!"
echo ""

# ---------- Arch-only packaging (Optional) ----------
if [ "$PKG_MANAGER" == "pacman" ] && [ -f PKGBUILD ]; then
  echo "📦 Criando pacote Arch Linux..."
  makepkg -fsi --noconfirm
  echo "✅ Pacote Arch criado e instalado!"
fi

echo ""
echo "Pinax instalado com sucesso!"
echo ""
echo "Para executar em modo de desenvolvimento:"
echo "  pnpm tauri dev"
echo ""
echo "Para executar a versão compilada:"
echo "  ./src-tauri/target/release/pinax"
echo ""
