import { execSync } from 'child_process';
import fs from 'fs';

const manifest = JSON.parse(fs.readFileSync('manifest.json'));
const version = manifest.version;
const zipName = manifest.id + '-' + version + '.zip';

execSync('tar -a -c -f ' + zipName + ' manifest.json main.js styles.css', { stdio: 'inherit' });

console.log('Release built:', zipName);
