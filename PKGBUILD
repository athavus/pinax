# Maintainer: Pinax <pinax@localhost>
pkgname=pinax
pkgver=1.3.0
pkgrel=1
pkgdesc="Pinax Desktop App"
arch=('x86_64')
url="https://pinax.app"
license=('verbatim')
depends=('webkit2gtk' 'gtk3')
options=('!strip')
source=()
sha256sums=()

package() {
  msg2 "Copying files from local build..."
  
  # Ensure the source directory exists
  local _src_dir="$startdir/src-tauri/target/release/bundle/deb/pinax_${pkgver}_amd64/data/usr"
  
  if [ ! -d "$_src_dir" ]; then
    error "Could not find build artifacts at $_src_dir"
    return 1
  fi

  # Create destination directory
  mkdir -p "$pkgdir/usr"
  
  # Copy files recursively
  cp -r "$_src_dir/"* "$pkgdir/usr/"
  
  # Ensure permissions are correct
  chmod 755 "$pkgdir/usr/bin/pinax"
}
