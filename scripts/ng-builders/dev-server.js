// `ng serve` builder (angular.json → serve): the regular @angular/build:dev-server, plus
// scripts/generate-docs.mjs in watch mode. So src/generated/ follows the variants/<slug>/ folders
// however the server is started (npm start, ng serve, the IDE) and whatever creates or deletes them
// (skills, by hand, git reset --hard, git checkout): no stale import breaks the build.
// schema.json is a copy of node_modules/@angular/build/src/builders/dev-server/schema.json (the CLI
// only reads schemas inside this folder): copy it again after upgrading @angular/build.
const { createBuilder } = require('@angular-devkit/architect');
const { executeDevServerBuilder } = require('@angular/build');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');

const GENERATOR = join(__dirname, '..', 'generate-docs.mjs');

module.exports = createBuilder((options, context) => {
  // Before the first build, so it never sees the registry of a previous checkout.
  execFileSync(process.execPath, [GENERATOR], { stdio: 'inherit' });

  const watcher = spawn(process.execPath, [GENERATOR, '--watch'], { stdio: 'inherit' });
  const stop = () => watcher.kill();
  context.addTeardown(stop);
  process.on('exit', stop);

  return executeDevServerBuilder(options, context);
});
