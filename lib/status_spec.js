"use strict";

var _mocha = require("mocha");

var _chai = require("chai");

var _status = _interopRequireWildcard(require("./status"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

(0, _mocha.describe)('Status', () => {
  (0, _mocha.describe)('constants', () => {
    (0, _mocha.it)('exposes the proper constants', () => {
      (0, _chai.expect)(_status.default).to.include.keys(['AMBIGUOUS', 'FAILED', 'PASSED', 'PENDING', 'SKIPPED', 'UNDEFINED']);
    });
  });
  (0, _mocha.describe)('getStatusMapping', () => {
    (0, _mocha.it)('returns a mapping of the statuses with the given initial value', () => {
      const result = (0, _status.getStatusMapping)(0);
      (0, _chai.expect)(result).to.eql({
        [_status.default.AMBIGUOUS]: 0,
        [_status.default.FAILED]: 0,
        [_status.default.PASSED]: 0,
        [_status.default.PENDING]: 0,
        [_status.default.SKIPPED]: 0,
        [_status.default.UNDEFINED]: 0
      });
    });
  });
});