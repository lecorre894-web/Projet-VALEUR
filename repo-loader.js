"use strict";

const fs = require("fs");
const path = require("path");

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "__pycache__"
]);

function safeStat(target){
  try {
    return fs.statSync(target);
  } catch {
    return null;
  }
}

function scan(dir, out = [], depth = 0, maxDepth = 12){
  if(depth > maxDepth) return out;

  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return out;
  }

  for(const entry of entries){
    const full = path.join(dir, entry);

    let stat = safeStat(full);
    if(!stat) continue;

    if(stat.isDirectory()){
      if(IGNORE_DIRS.has(entry)) continue;

      out.push({
        type: "dir",
        name: entry,
        path: full,
        depth
      });

      scan(full, out, depth + 1, maxDepth);
    } else {
      out.push({
        type: "file",
        name: entry,
        path: full,
        ext: path.extname(entry).toLowerCase(),
        bytes: stat.size,
        modified: stat.mtime.toISOString()
      });
    }
  }

  return out;
}

function classify(files){
  const stats = {
    total: files.length,
    js: 0,
    html: 0,
    json: 0,
    yaml: 0,
    txt: 0,
    mht: 0,
    images: 0
  };

  for(const f of files){
    if(f.type !== "file") continue;

    switch(f.ext){
      case ".js": stats.js++; break;
      case ".html": stats.html++; break;
      case ".json": stats.json++; break;
      case ".yml":
      case ".yaml": stats.yaml++; break;
      case ".txt": stats.txt++; break;
      case ".mht": stats.mht++; break;
      case ".png":
      case ".jpg":
      case ".jpeg":
      case ".webp":
      case ".gif":
        stats.images++;
        break;
    }
  }

  return stats;
}

function detectModules(files){
  const modules = {
    ai: false,
    blockchain: false,
    stratum: false,
    websocket: false,
    mining: false,
    ui: false
  };

  for(const f of files){
    const p = (f.path || "").toLowerCase();

    if(p.includes("pollinations") || p.includes("ai")) modules.ai = true;
    if(p.includes("blockchain") || p.includes("wallet")) modules.blockchain = true;
    if(p.includes("stratum")) modules.stratum = true;
    if(p.includes("socket") || p.includes("websocket")) modules.websocket = true;
    if(p.includes("mining") || p.includes("xmrig") || p.includes("pool")) modules.mining = true;
    if(p.includes("html") || p.includes("ui") || p.includes("cockpit")) modules.ui = true;
  }

  return modules;
}

module.exports = {
  scanRepository({
    root = process.cwd(),
    maxDepth = 12
  } = {}){

    const files = scan(root, [], 0, maxDepth);

    return {
      scannedAt: new Date().toISOString(),
      root,
      stats: classify(files),
      modules: detectModules(files),
      files
    };
  }
};
