#! /usr/bin/env node
var cp = require('child_process');
var fs = require('fs');
var md5 = require('blueimp-md5');
var progress = require('cli-progress');
var findCacheDir = require('find-cache-dir');

function median(arr) {
  arr = arr.slice(0);
  var middle = (arr.length + 1) / 2,
    sorted = arr.sort(function(a,b) { return a - b });
  return (sorted.length % 2) ? sorted[middle - 1] : (sorted[middle - 1.5] + sorted[middle - 0.5]) / 2;
};

var bar = new progress.Bar({
  format: 'progress [{bar}] {percentage}%',
  clearOnComplete: true
}, progress.Presets.shades_classic);
var cacheThunk = findCacheDir({ name: 'script-progress', create: true, thunk: true });

var args = process.argv.slice(2);
var cmd = args.shift();

if (!process.stdout.isTTY) {
  var res = cp.spawnSync(cmd, args, { env: process.env, stdio: [process.stdin, process.stdout, process.stderr] });
  process.exit(res.status);
}

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

var med = median(cache.intervals);

var eta = med ? Math.max.apply(Math, cache.intervals.filter(function(val) {
  return val / med < 1.5;
})) : 0;

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

  if (code) {
    process.exit(code);
  }

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
