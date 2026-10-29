#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null || { curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs; }
[ -d node_modules/ethers ] || npm install ethers
node app.js
