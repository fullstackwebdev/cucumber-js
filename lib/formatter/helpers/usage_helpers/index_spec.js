"use strict";

var _mocha = require("mocha");

var _chai = require("chai");

var _ = require("./");

var _events = _interopRequireDefault(require("events"));

var _gherkin = _interopRequireDefault(require("gherkin"));

var _event_data_collector = _interopRequireDefault(require("../event_data_collector"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _mocha.describe)('Usage Helpers', () => {
  (0, _mocha.describe)('getUsage', () => {
    (0, _mocha.beforeEach)(function () {
      this.eventBroadcaster = new _events.default();
      this.eventDataCollector = new _event_data_collector.default(this.eventBroadcaster);
      this.stepDefinitions = [];

      this.getResult = () => (0, _.getUsage)({
        eventDataCollector: this.eventDataCollector,
        stepDefinitions: this.stepDefinitions
      });
    });
    (0, _mocha.describe)('no step definitions', () => {
      (0, _mocha.describe)('without steps', () => {
        (0, _mocha.beforeEach)(function () {
          this.eventBroadcaster.emit('test-run-finished');
        });
        (0, _mocha.it)('returns an empty array', function () {
          (0, _chai.expect)(this.getResult()).to.eql([]);
        });
      });
      (0, _mocha.describe)('with a step', () => {
        (0, _mocha.beforeEach)(function () {
          const events = _gherkin.default.generateEvents('Feature: a\nScenario: b\nWhen abc\nThen ab', 'a.feature');

          events.forEach(event => {
            this.eventBroadcaster.emit(event.type, event);

            if (event.type === 'pickle') {
              this.eventBroadcaster.emit('pickle-accepted', {
                type: 'pickle-accepted',
                pickle: event.pickle,
                uri: event.uri
              });
            }
          });
          const testCase = {
            sourceLocation: {
              uri: 'a.feature',
              line: 2
            }
          };
          this.eventBroadcaster.emit('test-case-prepared', { ...testCase,
            steps: [{
              sourceLocation: {
                uri: 'a.feature',
                line: 3
              }
            }, {
              sourceLocation: {
                uri: 'a.feature',
                line: 4
              }
            }]
          });
          this.eventBroadcaster.emit('test-step-finished', {
            index: 0,
            testCase: testCase,
            result: {}
          });
          this.eventBroadcaster.emit('test-step-finished', {
            index: 1,
            testCase: testCase,
            result: {}
          });
          this.eventBroadcaster.emit('test-run-finished');
        });
        (0, _mocha.it)('returns an empty array', function () {
          (0, _chai.expect)(this.getResult()).to.eql([]);
        });
      });
    });
  });
});