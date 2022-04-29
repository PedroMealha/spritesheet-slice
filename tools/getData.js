const fs = require('fs');
const fastglob = require("fast-glob");

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const svgBoundings = require("svg-boundings");
const svgPathBBox = require("svg-path-bounding-box");

global.workPath = process.cwd(); // Local work path where we launch mb-cli.

const OUTPUT_PATH = '../common/sourceData.js';

const dataFiles = fastglob.sync('*.svg', {
	cwd: workPath,
	onlyFiles: true,
	absolute: false
});
console.log('dataFiles:', dataFiles);

const ROOTS = `\
const commonRoot = location.port != '' ? '../common/assets/' : '';
const formatRoot = location.port != '' ? './assets/' : '';

`;

const DEFAULT_LOCATION = "`${commonRoot}";

fs.writeFile(OUTPUT_PATH, ROOTS, err => {
	if (err) return console.log(err);
});

for (const FILE of dataFiles) {
	fs.readFile(FILE, 'utf8', (err, data) => {

		if (err) return console.log(err);

		const spriteName = FILE.substring(0, FILE.length - 4).replace(/-| /g, '_');

		let dataObj = getData(data, FILE);

		dataObj = {
			rgb: `${DEFAULT_LOCATION}${spriteName}.jpg\``,
			mask: `${DEFAULT_LOCATION}${spriteName}_mask.png\``,
			slices: dataObj
		};

		let output = `const ${spriteName} = ${JSON.stringify(dataObj, null, 2)};\n\n`;
		output = output.replace(/"/g, '');

		fs.appendFile(OUTPUT_PATH, output, err => {
			if (err) return console.log(err);
		});
	});
}

const getBindings = (el, tag, viewBox) => {
	let valuesFromSource = {};
	let values = {};
	Object.keys(svgBoundings).forEach((key, i) => {
		if (key == tag) {

			valuesFromSource = Object.values(svgBoundings)[i](el, true);

			if (key === 'path') {
				valuesFromSource = svgPathBBox(el.getAttribute('d'));
				values = {
					x: valuesFromSource.x1,
					y: valuesFromSource.y1,
					w: valuesFromSource.width,
					h: valuesFromSource.height,
					d: `'${el.getAttribute('d')}'`,
					viewBox: viewBox
				};
			}
			else if (key === 'circle') {
				values = {
					x: valuesFromSource.left,
					y: valuesFromSource.top,
					r: valuesFromSource.width / 2
				};
			}
			else {
				values = {
					x: valuesFromSource.left,
					y: valuesFromSource.top,
					w: valuesFromSource.width,
					h: valuesFromSource.height
				};

				if (tag === 'polygon') {
					let points = el.getAttribute('points').split(' ');
					let tempArr = [];
					points.forEach((point, i) => {
						let gap;
						if (i % 2 === 0) {
							point /= viewBox[2];
							gap = ' ';
						}
						else {
							point /= viewBox[3];
							gap = ', ';
						}
						if (i == points.length - 1) gap = '';
						point = `${Number(point) * 100}%${gap}`;
						tempArr.push(point);
						values.points = `'${tempArr.join('')}'`;
					});
				}
			}
		}
	});

	return values;
};

const getData = (data, FILE) => {
	const dom = new JSDOM(data);
	const SVG = dom.window.document.querySelector('svg');
	const SVG_VIEWBOX = SVG.getAttribute('viewBox').split(' ');
	const SVG_CHILDREN = SVG.children;

	let SVG_CHILDREN_LENGTH = SVG_CHILDREN.length;

	let dataObj = {};
	let i = 0;
	while (i < SVG_CHILDREN_LENGTH) {
		let child = SVG_CHILDREN[i];
		let childID = child.getAttribute('id');

		try {
			if (childID === null) throw child.outerHTML;
		}
		catch (err) {
			console.log(`\x1b[31mError:\x1b[0m \x1b[32m[ ${FILE} ]\x1b[0m NO ID FOUND AT: ${err}`);
			return;
		}

		let props = {
			id: childID.replace(/-| /g, '_'),
			tag: child.tagName,
			bBox: getBindings(child, child.tagName, SVG_VIEWBOX)
		};

		dataObj[props.id] = props.bBox;
		i++;
	}

	return dataObj;
};