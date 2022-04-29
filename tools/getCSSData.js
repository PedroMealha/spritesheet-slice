const fs = require('fs');
const fastGlob = require("fast-glob");
global.workPath = process.cwd(); // Local work path where we launch mb-cli.

let outputPath = '../common/slicesData.js';

var cssFiles = fastGlob.sync('*.css', {
	cwd: workPath,
	onlyFiles: true,
	absolute: false
});
console.log('cssFiles:', cssFiles);

let constTL = `\
const commonRoot = location.port != '' ? '../common/assets/' : '';
const formatRoot = location.port != '' ? './assets/' : '';

`;

fs.writeFile(outputPath, constTL, err => {
	if (err)
		return console.log(err);
});

for (const cssFile of cssFiles) {
	fs.readFile(cssFile, 'utf8', (err, data) => {

		if (err)
			return console.log(err);

		let name = cssFile.substring(0, cssFile.length - 4);

		let dataObj = getCSSData(data);

		const locPort = "`${commonRoot}";

		dataObj = {
			rgb: `${locPort}${name}.jpg\``,
			mask: `${locPort}${name}-mask.png\``,
			slices: dataObj
		};

		let output = `const ${name} = ${JSON.stringify(dataObj, null, 2)};\n\n`;
		output = output.replace(/"/g, '');

		fs.appendFile(outputPath, output, err => {
			if (err)
				return console.log(err);
		});
	});
}

let getCSSData = data => {
	let arr = [];
	let arrTemp = [];
	let dataObj = {};
	let valueCount = 0;
	data = data.replace(/[\r\n\t]/g, ' ').split(' ');

	data.forEach(string => {
		if (string.startsWith(`@`) || string.startsWith(`"`) === true)
			string = '';
		else if (string.startsWith('.') == true)
			string = string.replace('.', '');
		else
			string = string.replace(/\D/g, '');

		if (string.length != 0) {
			/^\d+$/.test(string) == true ? arrTemp.push(Number(string)) : arrTemp.push(string);
			valueCount++;

			if (valueCount % 5 == 0) {
				arr.push(arrTemp);
				arrTemp = [];
			}
		}
	});

	arr.forEach(val => {
		dataObj[val[0]] = {
			x: val[1],
			y: val[2],
			w: val[3],
			h: val[4]
		};
	});

	return dataObj;
};