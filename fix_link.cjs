const fs = require('fs');
let txt = fs.readFileSync('issues.html', 'utf8');
txt = txt.replace('href="/issue/S1201-9712(26)X2006-9.html" data-groupid="d2020.v169" class="list-of-issues__group-expand js--load js--toggle"', 'href="/issue/S1201-9712(26)X2006-9.html" data-groupid="d2020.v169" class="list-of-issues__group-expand"');
fs.writeFileSync('issues.html', txt);
console.log('Replaced link classes.');
