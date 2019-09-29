"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _status = _interopRequireDefault(require("../status"));

var _time = _interopRequireDefault(require("../time"));

var _user_code_runner = _interopRequireDefault(require("../user_code_runner"));

var _bluebird = _interopRequireDefault(require("bluebird"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  beginTiming: beginTiming,
  endTiming: endTiming
} = _time.default;

async function run({
  defaultTimeout: defaultTimeout,
  hookParameter: hookParameter,
  step: step,
  stepDefinition: stepDefinition,
  world: world
}) {
  beginTiming();
  let error, result, parameters;

  try {
    parameters = await _bluebird.default.all(stepDefinition.getInvocationParameters({
      hookParameter: hookParameter,
      step: step,
      world: world
    }));
  } catch (err) {
    error = err;
  }

  if (!error) {
    const timeoutInMilliseconds = stepDefinition.options.timeout || defaultTimeout;
    const validCodeLengths = stepDefinition.getValidCodeLengths(parameters);

    if (_lodash.default.includes(validCodeLengths, stepDefinition.code.length)) {
      const data = await _user_code_runner.default.run({
        argsArray: parameters,
        fn: stepDefinition.code,
        thisArg: world,
        timeoutInMilliseconds: timeoutInMilliseconds
      });
      error = data.error;
      result = data.result;
    } else {
      error = stepDefinition.getInvalidCodeLengthMessage(parameters);
    }
  }

  const testStepResult = {
    duration: endTiming()
  };

  if (result === 'skipped') {
    testStepResult.status = _status.default.SKIPPED;
  } else if (result === 'pending') {
    testStepResult.status = _status.default.PENDING;
  } else if (error) {
    testStepResult.exception = error;
    testStepResult.status = _status.default.FAILED;
  } else {
    testStepResult.status = _status.default.PASSED;
  }

  return testStepResult;
}

var _default = {
  run: run
};
exports.default = _default;