import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join, resolve } from 'path';

const portArg = process.argv.find((arg) => arg.startsWith('--port='));
const port = Number(portArg ? portArg.split('=')[1] : 8080);
const rootPath = resolve('.');

const contentTypes = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.svg': 'image/svg+xml',
};

const server = http.createServer((request, response) => {
	let requestPath = request.url?.split('?')[0] ?? '/';
	requestPath = requestPath == '/' ? '/benchmark/index.html' : requestPath;
	const fullPath = join(rootPath, requestPath);

	if (!fullPath.startsWith(rootPath) || !existsSync(fullPath)) {
		response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
		response.end('Not found');
		return;
	}

	try {
		const extension = extname(fullPath).toLowerCase();
		const file = readFileSync(fullPath);
		response.writeHead(200, { 'Content-Type': contentTypes[extension] ?? 'application/octet-stream' });
		response.end(file);
	} catch (error) {
		response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
		response.end('Server error: ' + error.message);
	}
});

server.listen(port, () => {
	console.log('Zeto benchmark server running at:');
	console.log(`http://localhost:${port}/benchmark/index.html`);
	console.log('Tip: add query params like ?seed=1337&spawnPerFrame=120&step=500');
});
