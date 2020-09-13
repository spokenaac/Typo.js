(() => {
  "use strict";
  // Define your library strictly...
})();
module.exports = (grunt) => {
  //#region Grund setup
  const isWin = process.platform === "win32";
  const getNodeMajor = () => {
    // https://www.regexpal.com/?fam=108819
    const s = process.version;
    const major = s.replace(/v?(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)/, '$1');
    return parseInt(major, 10);
  }
  const pkg = grunt.file.readJSON('package.json');
  const nodeMajor = getNodeMajor();
  let isES6Plus = false;
  try {
    let es6Map = new Map();
    es6Map.set('a', 1);
    es6Map.set('b', 2);
    isES6Plus = true;
    grunt.log.writeln('ES6 (es2015) or greater');
    es6Map = null;
  } catch (err) {
    grunt.log.writeln("ES6 not supported :(");
  }
  //#endregion
 
  //#region Envrioment setting Default
  const envDefault = {
    //#region common
    PKG_MODULE: () => {
      return pkg.module;
    },
    PKG_TYPE: () => {
      return pkg.typings;
    },
    OUT: () => {
      return pkg._out;
    },
    PKG_JS_LEGACY: () => {
      return pkg._jsLegacyFile;
    },
    PKG_JS: () => {
      return pkg._jsLegacyFile;
    },
    JS_MIN: () => {
      return pkg._jsLegacyFile.replace('.js', '.min.js');
    },
    JS_DIR: () => {
      const s = pkg._jsLegacyFile;
      return s.substr(0, s.lastIndexOf('/') + 1);
    },
    //#endregion

    //#region dynamic
    NODE_ENV: 'production',
    SCRATCH: () => {
      return pkg._scratch;
    },
    SCRATCH_BUILD: () => {
      return pkg._scratchBuild.replace('{0}', pkg._scratch);
    },
    PKG_JS: () => {
      return pkg._jsEsFile;
    },
    JS_MIN: () => {
      return pkg._jsEsFile.replace('.js', '.min.js');
    },
    JS_DIR: () => {
      const s = pkg._jsEsFile;
      return s.substr(0, s.lastIndexOf('/') + 1);
    }
    //#endregion
  };
  //#endregion

  // #region grunt init config
  //#region init Optoins
  const config = {
    // pkg: packageData,
    env: {
      dev: {},
      build: {},
      test: {},
      test_legacy: {},
      test_orig: {},
      build_legacy: {}
    },
    clean: {
      scratch: ['<%= SCRATCH %>'],
      out: ['<%= OUT %>'],
      js: ['<%= JS_DIR %>/*.js'],
      test: ['<%= TEST_DIR %>'],
      test_html: ['<%= TEST_DIR %>/*.html']
    },

    tslint: {
      options: {
        configuration: 'tslint.json'
      },
      plugin: ['typo/**/*.ts']
    },
    remove_comments: {
      js: {
        options: {
          multiline: true, // Whether to remove multi-line block comments
          singleline: true, // Whether to remove the comment of a single line.
          keepSpecialComments: false, // Whether to keep special comments, like: /*! !*/
          linein: true, // Whether to remove a line-in comment that exists in the line of code, it can be interpreted as a single-line comment in the line of code with /* or //.
          isCssLinein: false // Whether the file currently being processed is a CSS file
        },
        src: '<%= SCRATCH_BUILD %>/index.js',
        dest: '<%= PKG_MODULE %>'
      },
    },
    shell: {
      tsc: 'tsc',
      tsc_es: 'tsc -p tsconfig.es.json',
      tsc_legacy: 'tsc -p tsconfig.legacy.json',
      rollup: 'rollup -c',
      rollup_legacy: 'rollup -c rollup.config.legacy.js',
      start: 'npm run  lite',
      start_orig: 'npm run  lite_orig',
      start_legacy: 'npm run  lite_legacy',
      typecheck: 'tsc --noEmit'
    },

    copy: {
      d: {
        files: [{
          src: './lib/main.d.ts',
          dest: './index.d.ts'
        }]
      },
      test_dir: {
        files: [{
          expand: true,
          cwd: 'tests/',
          src: '**/*',
          dest: '<%= TEST_DIR %>'
        }]
      },
      test_us_en: {
        files: [{
          expand: true,
          cwd: 'typo/dictionaries/en_US/',
          src: '**/*',
          dest: '<%= TEST_DIR %>/dictionaries/en_US/'
        }]
      },
      test_js: {
        files: [{
          expand: true,
          cwd: '<%= JS_DIR %>',
          src: '**/*',
          dest: '<%= TEST_DIR %>/js'
        }]
      },
      final: {
        files: [{
          src: '<%= SCRATCH_BUILD %>/index.d.ts',
          dest: '<%= PKG_TYPE %>'
        }]
      }
    },
    terser: {
      main: {
        options: {
          sourceMap: true
        },
        files: {
          '<%= JS_MIN %>': ['<%= PKG_JS %>']
        }
      },
      legacy: {
        options: {
          sourceMap: true
        },
        files: {
          '<%= JS_MIN %>': ['<%= PKG_JS_LEGACY %>']
        }
      }
    },
    replace: {
      test_orig: {
        options: {
          patterns: [
            {
              match: /src=\"js\/typo.js\"/g,
              replacement: 'src="https://cdn.jsdelivr.net/gh/cfinke/Typo.js@671b305b432d589d5467f4ee8cf69726aa5be336/typo/typo.js"'
            }
          ]
        },
        files: [{
          expand: true,
          cwd: 'tests/',
          src: '**/*html',
          dest: '<%= TEST_DIR %>'
        }]
      }
    },
    build_include: {
      legacy: {
        files: [{
          expand: true,
          cwd: '<%= SCRATCH %>/legacy/',
          src: '**/*.js',
          dest: '<%= SCRATCH_BUILD %>'
        }]
      }
    }
  };
  //#endregion
  //#region config adjust
  const setEnvironment = (env) => {
    switch (env) {
      case 'build':
        return createEnv({});
        break;
      case 'dev':
        return createEnv({
          NODE_ENV: 'development'
        });
        break;
      case 'test':
        return createEnv({
          NODE_ENV: 'test',
          TEST_DIR: () => {
            return pkg._scratch + "/tests";
          },
        });
        break;
      case 'test_legacy':
        return createEnv({
          NODE_ENV: 'test',
          TEST_DIR: () => {
            return pkg._scratch + "/legacy_tests";
          },
          JS_MIN: () => {
            return pkg._jsLegacyFile.replace('.js', '.min.js');
          },
          JS_DIR: () => {
            const s = pkg._jsLegacyFile;
            return s.substr(0, s.lastIndexOf('/') + 1);
          }
        });
        break;
      case 'test_orig':
        return createEnv({
          NODE_ENV: 'test',
          TEST_DIR: () => {
            return pkg._scratch + "/orig_tests";
          }
        });
        break;
        case 'build_legacy':
          return createEnv({
            NODE_ENV: 'legacy',
            SCRATCH_BUILD: () => {
              return pkg._scratchLegacy.replace('{0}', pkg._scratch);
            }
          });
          break;
      default:
        return createEnv({});
        break;
    }
  };
  const createEnv = (changes) => {
    const newEnv = {};
    for (const key in envDefault) {
      if (envDefault.hasOwnProperty(key)) {
        const setting = envDefault[key];
        if (typeof setting === 'function') {
          newEnv[key] = setting();
        } else {
          newEnv[key] = setting;
        }
      }
    }
    for (const key in changes) {
      if (changes.hasOwnProperty(key)) {
        const cSetting = changes[key];
        if (typeof cSetting === 'function') {
          newEnv[key] = cSetting();
        } else {
          newEnv[key] = cSetting;
        }
      }
    }
    return newEnv;
  };
  config.env.build = setEnvironment('build');
  config.env.test = setEnvironment('test');
  config.env.dev = setEnvironment('dev');
  config.env.test_legacy = setEnvironment('test_legacy');
  config.env.test_orig = setEnvironment('test_orig');
  config.env.build_legacy = setEnvironment('build_legacy');
  //
  //#endregion
  grunt.initConfig(config);
  // #endregion
  // #region grunt require and load npm task
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks("grunt-tslint");
  grunt.loadNpmTasks("grunt-remove-comments");
  grunt.loadNpmTasks('grunt-env');
  grunt.registerTask('default', 'replace');
  grunt.loadNpmTasks('grunt-build-include');
  // #endregion
  
  //#region RegisterTask Misc
  grunt.registerTask('loadconst', 'Load constants', function () {
    grunt.config('PKG_MODULE', process.env.PKG_MODULE);
    grunt.config('SCRATCH', process.env.SCRATCH);
    grunt.config('OUT', process.env.OUT);
    grunt.config('SCRATCH_BUILD', process.env.SCRATCH_BUILD);
    grunt.config('PKG_TYPE', process.env.PKG_TYPE);
    grunt.config('PKG_JS', process.env.PKG_JS);
    grunt.config('JS_MIN', process.env.JS_MIN);
    grunt.config('JS_DIR', process.env.JS_DIR);
    grunt.config('PKG_JS_LEGACY', process.env.PKG_JS_LEGACY);
  });

  grunt.registerTask('log-const', 'Logging constants', function () {
    grunt.log.writeln('NODE_ENV: ' + process.env.NODE_ENV);
    grunt.log.writeln('PKG_MODULE: ' + process.env.PKG_MODULE);
    grunt.log.writeln('SCRATCH: ' + process.env.SCRATCH);
    grunt.log.writeln('SCRATCH_BUILD: ' + process.env.SCRATCH_BUILD);
    grunt.log.writeln('PKG_TYPE: ' + process.env.PKG_TYPE);
    grunt.log.writeln('PKG_JS: ' + process.env.PKG_JS);
    grunt.log.writeln('JS_MIN: ' + process.env.JS_MIN);
    grunt.log.writeln('JS_DIR: ' + process.env.JS_DIR);
    grunt.log.writeln('PKG_JS_LEGACY: ' + process.env.PKG_JS_LEGACY);
  });

  grunt.registerTask('loadconst_test', 'Load constants', function () {
    grunt.config('TEST_DIR', process.env.TEST_DIR);
  });

  grunt.registerTask('default', [
    'build'
  ]);
  grunt.registerTask('envcheck', ['version_bump:build', 'env:dev', 'devtest']);
  grunt.registerTask('ver', () => {
    grunt.log.writeln('output from task ver');
    grunt.log.writeln("BUILD_VERSION:" + BUILD_VERSION);
    grunt.log.writeln("packageData.version:" + pkg.version);
  });
//#endregion

//#region build test start
  grunt.registerTask('build', [
    'env:build',
    'loadconst',
    'log-const',
    'clean:scratch',
    'clean:out',
    'clean:js',
    'tslint',
    'shell:tsc_es',
    'shell:rollup',
    'terser:main',
    'remove_comments:js',
    'copy:final'
  ]);

  grunt.registerTask('test', [
    'env:test',
    'loadconst',
    'loadconst_test',
    'log-const',
    'clean:test',
    'copy:test_dir',
    'copy:test_js',
    'copy:test_us_en'
  ]);

  grunt.registerTask('start', [
    'shell:start'
  ]);
  grunt.registerTask('tests', [
    'test',
    'start'
  ]);
//#endregion

//#region original build test start
  grunt.registerTask('testorig', [
    'env:test_orig',
    'loadconst',
    'loadconst_test',

    'clean:test',
    'copy:test_dir',
    'copy:test_js',
    'copy:test_us_en',
    "clean:test_html",
    'replace:test_orig'
  ]);

  grunt.registerTask('startorig', [
    'shell:start_orig'
  ]);

  grunt.registerTask('testorigs', [
    'testorig',
    'startorig',

  ]);

  //#endregion

  //#region Legacy Build test start
  grunt.registerTask('buildl', [
    'env:build_legacy',
    'loadconst',
    'log-const',
    'clean:scratch',
    'clean:js',
    'tslint',
    'shell:typecheck',
    'shell:tsc_legacy',
    'build_include:legacy',
    'shell:rollup_legacy',
    'terser:legacy'
  ]);

  grunt.registerTask('testl', [
    'env:test_legacy',
    'loadconst',
    'loadconst_test',
    'log-const',
    'clean:test',
    'copy:test_dir',
    'copy:test_js',
    'copy:test_us_en'
  ]);

  grunt.registerTask('startlegacy', [
    'shell:start_legacy'
  ]);
  grunt.registerTask('startlegacys', [
    'buildl',
    'testl',
    'startlegacy'
  ]);
//#endregion

};