import {execFile} from "node:child_process";
import {Buffer} from "node:buffer";
import {mkdir, readFile, rename, rm, writeFile} from "node:fs/promises";
import {dirname, join, resolve} from "node:path";
import {URL} from "node:url";
import {promisify} from "node:util";

const execFileAsync = promisify(execFile);

const root = resolve(new URL("..", import.meta.url).pathname);
const buildDir = join(root, "build");
const iconsetDir = join(buildDir, "icon.iconset");
const sourceSvg = join(buildDir, "icon.svg");
const sourcePng = join(buildDir, "icon.png");

const pngSizes = [16, 32, 64, 128, 256, 512, 1024];
const iconsetFiles = [
  ["icon_16x16.png", 16],
  ["icon_16x16@2x.png", 32],
  ["icon_32x32.png", 32],
  ["icon_32x32@2x.png", 64],
  ["icon_128x128.png", 128],
  ["icon_128x128@2x.png", 256],
  ["icon_256x256.png", 256],
  ["icon_256x256@2x.png", 512],
  ["icon_512x512.png", 512],
  ["icon_512x512@2x.png", 1024],
];

await mkdir(buildDir, {recursive: true});
await rm(iconsetDir, {recursive: true, force: true});
await mkdir(iconsetDir, {recursive: true});

await execFileAsync("qlmanage", [
  "-t",
  "-s",
  "1024",
  "-o",
  buildDir,
  sourceSvg,
]);
await rename(join(buildDir, "icon.svg.png"), sourcePng);

for (const size of pngSizes) {
  await resize(sourcePng, join(buildDir, `icon-${size}.png`), size);
}

for (const [fileName, size] of iconsetFiles) {
  await resize(sourcePng, join(iconsetDir, fileName), size);
}

await execFileAsync("iconutil", [
  "-c",
  "icns",
  iconsetDir,
  "-o",
  join(buildDir, "icon.icns"),
]);
await writeIco(join(buildDir, "icon-256.png"), join(buildDir, "icon.ico"));
await rm(iconsetDir, {recursive: true, force: true});

async function resize(input, output, size) {
  await mkdir(dirname(output), {recursive: true});
  await execFileAsync("sips", [
    "-s",
    "format",
    "png",
    "-z",
    String(size),
    String(size),
    input,
    "--out",
    output,
  ]);
}

async function writeIco(pngPath, icoPath) {
  const png = await readFile(pngPath);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(0, 6);
  header.writeUInt8(0, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  await writeFile(icoPath, Buffer.concat([header, png]));
}
