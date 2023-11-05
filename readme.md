# kompiler

A framework agnostic compiler/transpiler. For personal use and for friends. Forever work
in progress.

## Options

In package json at the key `kompiler` you may use the following options

```
{
  "kompiler": {
    // an array of "node scripts" to run, watch and automatically restart
    "node": [
      {
        "input": "socket/index.js", // the dirname of "input" is automatically watched for restarting the node script
        "legacyToEs6": true, // for old node versions, to use "esm" (require vs imports)
        "watch": [] // in case you have a folder or file you want to watch that is outside "input" folder to restart the script. Useful for developing npm packages using "npm link"
      }
    ],
    "map": [
      // for mapping paths served by the static server
      ["S:/www/aa/client/npm/package/", "S:/www/npm/package/"]
    ],
    // similar to node property is for running rollup, as many as you want
    "builds": [
      {
        "input": ["client/index.js"], // input file to process, a "static file server" is fired on this folder
        // to use in place of "input" for using dynamic imports
        "dir": "dist/", // use for dynamic imports, multi-entry.js should be included in the html
        "output": "client/dist/index.m.js", // where to put the output
        // "root": "./", // if you place to serve a diferent directory than the dirname of input set this
        "minified": false, // if output should be minified and treeshaked
        "express": false, // useful for when testing video that chrome does 206 requests, express is slow the compiler use a faster server but doesnt support 206
        "root": "./", // server document root
        // for opening a special page when loading the server
        "page": "index.kompiler.html",
        "hostname":"localhost",
        "babel": {
          // babel config
          "presets": ["solid"]
        },
        "watch": [], // in case you have a folder or file you want to watch that is outside "input" folder. Useful for developing npm packages using "npm link". It will trigger a rebuild and possible an update on the browser if anything changes
        "map": [
          // for mapping paths served by the static server
          ["S:/www/aa/client/npm/package/", "S:/www/npm/package/"]
        ]
      }
    ],
    // legacy stuff, if you need a file from the web and you want to automatically update it this will do it. It checks at most 1 time per day and only if the compiler is running
    "autoupdates": [["https://www.example.net/jquery@3", "client/js/jquery.js"]]
  }
}
```

## TODO

- when an exec command fails it displays ugly messages
- handle merge conflicts
- npm versioning when publishing
- treeshake is not dynamic
- node-replace is not dynamic
- set env production automatically?
- make export conditions customizable
