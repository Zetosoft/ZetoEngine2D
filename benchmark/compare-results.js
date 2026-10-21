import { readFileSync } from 'fs';

const [beforePath, afterPath] = process.argv.slice(2);

if (!beforePath || !afterPath) {
	console.error('Usage: node ./benchmark/compare-results.js <before.json> <after.json>');
	process.exit(1);
}

function loadJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function asMap(results) {
	const map = {};
	for (let index = 0; index < results.length; index++) {
		const result = results[index];
		const key = `${result.scenario}:${result.targetCount}`;
		map[key] = result;
	}
	return map;
}

function formatDelta(before, after) {
	const delta = after - before;
	const sign = delta >= 0 ? '+' : '';
	return `${sign}${delta.toFixed(2)}`;
}

const before = loadJson(beforePath);
const after = loadJson(afterPath);

const beforeMap = asMap(before.results ?? []);
const afterMap = asMap(after.results ?? []);
const keys = Object.keys(beforeMap).filter((key) => afterMap[key]).sort();

if (keys.length <= 0) {
	console.log('No comparable checkpoints found.');
	process.exit(0);
}

console.log('scenario,count,before_avg_ms,after_avg_ms,delta_avg_ms,before_p95_ms,after_p95_ms,delta_p95_ms,before_p99_ms,after_p99_ms,delta_p99_ms');
for (let index = 0; index < keys.length; index++) {
	const key = keys[index];
	const beforeResult = beforeMap[key];
	const afterResult = afterMap[key];

	const beforeAvg = beforeResult.summary.frameMs.average;
	const afterAvg = afterResult.summary.frameMs.average;
	const beforeP95 = beforeResult.summary.frameMs.p95;
	const afterP95 = afterResult.summary.frameMs.p95;
	const beforeP99 = beforeResult.summary.frameMs.p99;
	const afterP99 = afterResult.summary.frameMs.p99;

	console.log(
		[
			beforeResult.scenario,
			beforeResult.targetCount,
			beforeAvg.toFixed(2),
			afterAvg.toFixed(2),
			formatDelta(beforeAvg, afterAvg),
			beforeP95.toFixed(2),
			afterP95.toFixed(2),
			formatDelta(beforeP95, afterP95),
			beforeP99.toFixed(2),
			afterP99.toFixed(2),
			formatDelta(beforeP99, afterP99),
		].join(',')
	);
}
