const fs = require('fs');
let txt = fs.readFileSync('issues.html', 'utf8');
const searchStr = 'href="https://www.ijidonline.com/issues?publicationCode=ijid&amp;issueGroupId=d2020.v169"';
const replaceStr = 'href="/issue/S1201-9712(26)X2006-9.html"';
if (txt.includes(searchStr)) {
  txt = txt.replace(searchStr, replaceStr);
  fs.writeFileSync('issues.html', txt);
  console.log('Replaced successfully.');
} else {
  console.log('String not found.');
}
