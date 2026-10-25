/**
 * Copies the static website into public/ after TypeScript compiles.
 * Vercel serves that folder, and the pages themselves stay at the repo root.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const publishDirectory = path.join(projectRoot, "public");

/** Copies one file and creates any missing parent folders. */
function copyFile(sourcePath, destinationPath) {
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}

/** Copies a folder, including nested files, into the publish directory. */
function copyDirectory(sourceDirectory, destinationDirectory) {
  fs.mkdirSync(destinationDirectory, { recursive: true });

  for (const directoryEntry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDirectory, directoryEntry.name);
    const destinationPath = path.join(destinationDirectory, directoryEntry.name);

    if (directoryEntry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else {
      copyFile(sourcePath, destinationPath);
    }
  }
}

fs.rmSync(publishDirectory, { recursive: true, force: true });
fs.mkdirSync(publishDirectory, { recursive: true });

copyFile(path.join(projectRoot, "index.html"), path.join(publishDirectory, "index.html"));
copyFile(path.join(projectRoot, "styles.css"), path.join(publishDirectory, "styles.css"));
copyDirectory(path.join(projectRoot, "images"), path.join(publishDirectory, "images"));
copyDirectory(path.join(projectRoot, "dist"), path.join(publishDirectory, "dist"));
