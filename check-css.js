const fs = require('fs');
const css = fs.readFileSync('dist/assets/index-B1QjgTHr.css', 'utf8');
console.log('max-w-7xl', css.includes('max-w-7xl')); 
console.log('w-full', css.includes('w-full'));
console.log('text-4xl', css.includes('text-4xl'));
console.log('bg-blue-600', css.includes('bg-blue-600'));
console.log('max-w-[70%]', css.includes('max-w-[70%]'));
console.log('size', css.length);
