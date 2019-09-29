"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _helpers = require("./helpers");

var _attachment_manager = _interopRequireDefault(require("./attachment_manager"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _status = _interopRequireDefault(require("../status"));

var _step_runner = _interopRequireDefault(require("./step_runner"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class TestCaseRunner {
  constructor({
    eventBroadcaster: eventBroadcaster,
    skip: skip,
    testCase: testCase,
    supportCodeLibrary: supportCodeLibrary,
    worldParameters: worldParameters
  }) {
    const attachmentManager = new _attachment_manager.default(({
      data: data,
      media: media
    }) => {
      if (this.testStepIndex > this.maxTestStepIndex) {
        throw new Error('Cannot attach after all steps/hooks have finished running. Ensure your step/hook waits for the attach to finish.');
      }

      this.emit('test-step-attachment', {
        index: this.testStepIndex,
        data: data,
        media: media
      });
    });
    this.eventBroadcaster = eventBroadcaster;
    this.skip = skip;
    this.testCase = testCase;
    this.supportCodeLibrary = supportCodeLibrary;
    this.world = new supportCodeLibrary.World({
      attach: attachmentManager.create.bind(attachmentManager),
      parameters: worldParameters
    });
    this.beforeHookDefinitions = this.getBeforeHookDefinitions();
    this.afterHookDefinitions = this.getAfterHookDefinitions();
    this.testStepIndex = 0;
    this.maxTestStepIndex = this.beforeHookDefinitions.length + this.testCase.pickle.steps.length + this.afterHookDefinitions.length - 1;
    this.result = {
      duration: 0,
      status: this.skip ? _status.default.SKIPPED : _status.default.PASSED
    };
    this.testCaseSourceLocation = {
      uri: this.testCase.uri,
      line: this.testCase.pickle.locations[0].line
    };
  }

  emit(name, data) {
    const eventData = { ...data
    };

    if (_lodash.default.startsWith(name, 'test-case')) {
      eventData.sourceLocation = this.testCaseSourceLocation;
    } else {
      eventData.testCase = {
        sourceLocation: this.testCaseSourceLocation
      };
    }

    this.eventBroadcaster.emit(name, eventData);
  }

  emitPrepared() {
    const steps = [];
    this.beforeHookDefinitions.forEach(definition => {
      const actionLocation = {
        uri: definition.uri,
        line: definition.line
      };
      steps.push({
        actionLocation: actionLocation
      });
    });
    this.testCase.pickle.steps.forEach(step => {
      const actionLocations = this.getStepDefinitions(step).map(definition => ({
        uri: definition.uri,
        line: definition.line
      }));
      const sourceLocation = {
        uri: this.testCase.uri,
        line: _lodash.default.last(step.locations).line
      };
      const data = {
        sourceLocation: sourceLocation
      };

      if (actionLocations.length === 1) {
        data.actionLocation = actionLocations[0];
      }

      steps.push(data);
    });
    this.afterHookDefinitions.forEach(definition => {
      const actionLocation = {
        uri: definition.uri,
        line: definition.line
      };
      steps.push({
        actionLocation: actionLocation
      });
    });
    this.emit('test-case-prepared', {
      steps: steps
    });
  }

  getAfterHookDefinitions() {
    return this.supportCodeLibrary.afterTestCaseHookDefinitions.filter(hookDefinition => hookDefinition.appliesToTestCase(this.testCase));
  }

  getBeforeHookDefinitions() {
    return this.supportCodeLibrary.beforeTestCaseHookDefinitions.filter(hookDefinition => hookDefinition.appliesToTestCase(this.testCase));
  }

  getStepDefinitions(step) {
    return this.supportCodeLibrary.stepDefinitions.filter(stepDefinition => stepDefinition.matchesStepName(step.text));
  }

  invokeStep(step, stepDefinition, hookParameter) {
    return _step_runner.default.run({
      defaultTimeout: this.supportCodeLibrary.defaultTimeout,
      hookParameter: hookParameter,
      step: step,
      stepDefinition: stepDefinition,
      world: this.world
    });
  }

  isSkippingSteps() {
    return this.result.status === _status.default.FAILED;
  }

  shouldSkipHook(isBeforeHook) {
    return this.skip || this.isSkippingSteps() && isBeforeHook;
  }

  shouldUpdateStatus(testStepResult) {
    switch (testStepResult.status) {
      // case Status.UNDEFINED:
      case _status.default.FAILED:
        // case Status.AMBIGUOUS:
        return !_lodash.default.some([_status.default.FAILED, _status.default.AMBIGUOUS, _status.default.UNDEFINED], this.result.status);

      default:
        return this.result.status === _status.default.PASSED;
    }
  }

  async aroundTestStep(runStepFn) {
    this.emit('test-step-started', {
      index: this.testStepIndex
    });
    const testStepResult = await runStepFn();

    if (testStepResult.duration) {
      this.result.duration += testStepResult.duration;
    }

    if (this.shouldUpdateStatus(testStepResult)) {
      this.result.status = testStepResult.status;
    }

    if (testStepResult.exception) {
      this.result.exception = testStepResult.exception;
    }

    this.emit('test-step-finished', {
      index: this.testStepIndex,
      result: testStepResult
    });
    this.testStepIndex += 1;
  }

  async run() {
    this.emitPrepared();
    this.emit('test-case-started', {});
    await this.runHooks(this.beforeHookDefinitions, {
      sourceLocation: this.testCaseSourceLocation,
      pickle: this.testCase.pickle
    }, true);
    await this.runSteps();
    await this.runHooks(this.afterHookDefinitions, {
      sourceLocation: this.testCaseSourceLocation,
      pickle: this.testCase.pickle,
      result: this.result
    }, false);
    this.emit('test-case-finished', {
      result: this.result
    });
    return this.result;
  }

  async runHook(hookDefinition, hookParameter, isBeforeHook) {
    if (this.shouldSkipHook(isBeforeHook)) {
      return {
        status: _status.default.SKIPPED
      };
    }

    return this.invokeStep(null, hookDefinition, hookParameter);
  }

  async runHooks(hookDefinitions, hookParameter, isBeforeHook) {
    await _bluebird.default.each(hookDefinitions, async hookDefinition => {
      await this.aroundTestStep(() => this.runHook(hookDefinition, hookParameter, isBeforeHook));
    });
  }

  async runStep(step) {
    const stepDefinitions = this.getStepDefinitions(step);

    if (stepDefinitions.length === 0) {
      return {
        status: _status.default.UNDEFINED
      }; // } else if (stepDefinitions.length > 1) {
      //   return {
      //     exception: getAmbiguousStepException(stepDefinitions),
      //     status: Status.AMBIGUOUS,
      //   }
    } else if (this.isSkippingSteps()) {
      return {
        status: _status.default.SKIPPED
      };
    }

    return this.invokeStep(step, stepDefinitions[0]);
  }

  async runSteps() {
    await _bluebird.default.each(this.testCase.pickle.steps, async step => {
      await this.aroundTestStep(() => this.runStep(step));
    });
  }

}

exports.default = TestCaseRunner;