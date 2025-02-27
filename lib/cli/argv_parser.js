"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _commander = require("commander");

var _package = require("../../package.json");

var _path = _interopRequireDefault(require("path"));

var _gherkin = _interopRequireDefault(require("gherkin"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ArgvParser {
  static collect(val, memo) {
    memo.push(val);
    return memo;
  }

  static mergeJson(option) {
    return function (str, memo) {
      let val;

      try {
        val = JSON.parse(str);
      } catch (error) {
        throw new Error(`${option} passed invalid JSON: ${error.message}: ${str}`);
      }

      if (!_lodash.default.isPlainObject(val)) {
        throw new Error(`${option} must be passed JSON of an object: ${str}`);
      }

      return _lodash.default.merge(memo, val);
    };
  }

  static mergeTags(val, memo) {
    return memo === '' ? `(${val})` : `${memo} and (${val})`;
  }

  static validateLanguage(val) {
    if (!_lodash.default.includes(_lodash.default.keys(_gherkin.default.DIALECTS), val)) {
      throw new Error(`Unsupported ISO 639-1: ${val}`);
    }

    return val;
  }

  static parse(argv) {
    const program = new _commander.Command(_path.default.basename(argv[1]));
    program.usage('[options] [<GLOB|DIR|FILE[:LINE]>...]').version(_package.version, '-v, --version').option('-b, --backtrace', 'show full backtrace for errors').option('-d, --dry-run', 'invoke formatters without executing steps').option('--exit', 'force shutdown of the event loop when the test run has finished: cucumber will call process.exit').option('--fail-fast', 'abort the run on first failure').option('-f, --format <TYPE[:PATH]>', 'specify the output format, optionally supply PATH to redirect formatter output (repeatable)', ArgvParser.collect, []).option('--format-options <JSON>', 'provide options for formatters (repeatable)', ArgvParser.mergeJson('--format-options'), {}).option('--i18n-keywords <ISO 639-1>', 'list language keywords', ArgvParser.validateLanguage, '').option('--i18n-languages', 'list languages').option('--language <ISO 639-1>', 'provide the default language for feature files', '').option('--name <REGEXP>', 'only execute the scenarios with name matching the expression (repeatable)', ArgvParser.collect, []).option('--no-strict', 'succeed even if there are pending steps').option('--order <TYPE[:SEED]>', 'run scenarios in the specified order. Type should be `defined` or `random`', 'defined').option('-p, --profile <NAME>', 'specify the profile to use (repeatable)', ArgvParser.collect, []).option('--parallel <NUMBER_OF_SLAVES>', 'run in parallel with the given number of slaves', parseInt, 0).option('-r, --require <GLOB|DIR|FILE>', 'require files before executing features (repeatable)', ArgvParser.collect, []).option('--require-module <NODE_MODULE>', 'require node modules before requiring files (repeatable)', ArgvParser.collect, []).option('-t, --tags <EXPRESSION>', 'only execute the features or scenarios with tags matching the expression (repeatable)', ArgvParser.mergeTags, '').option('--world-parameters <JSON>', 'provide parameters that will be passed to the world constructor (repeatable)', ArgvParser.mergeJson('--world-parameters'), {});
    program.on('--help', () => {
      /* eslint-disable no-console */
      console.log('  For more details please visit https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md\n');
      /* eslint-enable no-console */
    });
    program.parse(argv);
    return {
      options: program.opts(),
      args: program.args
    };
  }

}

exports.default = ArgvParser;