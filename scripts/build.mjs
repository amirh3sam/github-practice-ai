import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(path.join(root, 'dist', 'src'), { recursive: true });
for (const name of ['index.html', 'favicon.svg', 'src/styles.css', 'src/app.js', 'src/engine.js', 'src/curriculum.js']) {
  await copyFile(path.join(root, name), path.join(root, 'dist', name));
}
console.log('Built BranchLab 2.0 to dist/ (no dependencies required).');
