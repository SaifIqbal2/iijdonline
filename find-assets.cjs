const fs = require('fs');
const path = require('path');
const https = require('https');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('public\\products') && !file.includes('public/products')) {
        results = results.concat(walk(file));
      } else if (file.endsWith('.css')) {
        results.push(file);
      }
    });
  } catch(e) {}
  return results;
}

const allMatches = new Set();
walk('.').forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const m = content.match(/\/products\/marlin\/releasedAssets\/images\/[^"') ]+/gi);
  if (m) m.forEach(x => allMatches.add(x));
});

console.log('Found ' + allMatches.size + ' unique assets:');
allMatches.forEach(x => console.log(x));

// Download them all
allMatches.forEach(urlPath => {
  const filename = path.basename(urlPath);
  const dir = path.join('public', path.dirname(urlPath).replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, filename);
  if (fs.existsSync(dest)) {
    console.log('Already exists: ' + filename);
    return;
  }
  const url = 'https://www.ijidonline.com' + urlPath;
  const fileStream = fs.createWriteStream(dest);
  https.get(url, res => {
    res.pipe(fileStream);
    fileStream.on('finish', () => { fileStream.close(); console.log('Downloaded: ' + filename); });
  }).on('error', err => {
    fs.unlink(dest, () => {});
    console.error('Error: ' + filename + ' - ' + err.message);
  });
});
