import { readFileSync, writeFileSync } from "node:fs";

// 由 `npm version` 的 version 生命周期钩子调用。
// package.json 的 version 是唯一真相源，manifest.json 和 versions.json 从它派生。
// 见 docs/adr/0010-version-control-and-release.md

const targetVersion = process.env.npm_package_version;

if (!targetVersion) {
  console.error(
    "缺少 npm_package_version。请通过 `npm version <patch|minor|major>` 调用，不要直接运行本脚本。"
  );
  process.exit(1);
}

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

const manifest = readJson("manifest.json");
const { minAppVersion } = manifest;

manifest.version = targetVersion;
writeJson("manifest.json", manifest);

const versions = readJson("versions.json");
versions[targetVersion] = minAppVersion;
writeJson("versions.json", versions);

console.log(`已同步版本 ${targetVersion}（minAppVersion ${minAppVersion}）`);
