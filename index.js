#! /usr/bin/env node
var cp = require('child_process');
var fs = require('fs');
var md5 = require('blueimp-md5');
var progress = require('cli-progress');
var findCacheDir = require('find-cache-dir');

var bar = new progress.Bar({
  format: 'progress [{bar}] {percentage}%',
  clearOnComplete: true
}, progress.Presets.shades_classic);
var cacheThunk = findCacheDir({ name: 'script-progress', create: true, thunk: true });

var args = process.argv.slice(2);
var cmd = args.shift();
var cacheFileName = md5(args.join(' '));

var DEFAULT_CACHE = { intervals: [] };
var cacheFileContent = fs.readFileSync(cacheThunk(cacheFileName), { flag: 'a+' });
var cache;
try {
  cache = JSON.parse(cacheFileContent.toString() || JSON.stringify(DEFAULT_CACHE));
} catch (e) {}

if (!cache || !Array.isArray(cache.intervals)) {
  cache = DEFAULT_CACHE;
}

var eta = cache.intervals.reduce(function (acc, i) {
  return acc + i / cache.intervals.length;
}, 0);

var refreshInterval;

if (eta) {
  bar.start(eta, 0);

  refreshInterval = setInterval(function() {
    bar.update(getDiff());
  }, 200);
}

var time = process.hrtime();

process.env.FORCE_COLOR = true;
var ls = cp.spawn(cmd, args, { env: process.env });

function getDiff() {
  var diff = process.hrtime(time);
  return (diff[0] + diff[1] / 10E9);
}

function clear() {
  bar.terminal.cursorTo(0, null);
  bar.terminal.clearRight();
}

function redraw() {
  bar.value = getDiff();
  bar.lastDrawnString = '';
  bar.render();  
}

ls.stdout.on('data', function (data) {
  if (eta) {
    clear();
    bar.terminal.cursorSave();
  }
  process.stdout.write(data.toString());
  if (eta) redraw();
});

ls.stderr.on('data', function (data) {
  if (eta) {
    clear();
    bar.terminal.cursorSave();
  }
  process.stderr.write(data.toString());
  if (eta) redraw();
});

ls.on('close', (code) => {
  var diff = getDiff();
  if (!eta || diff / eta > 0.1) {
    cache.intervals.push(diff);
    if (cache.intervals.length > 5) {
      cache.intervals.shift();
    }
  }
  fs.writeFileSync(cacheThunk(cacheFileName), JSON.stringify(cache));

  clearInterval(refreshInterval);
  if (eta) {
    bar.terminal.cursorSave();
    bar.stop();
  }
});
