'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.equals = equals;
exports.fnNameFor = fnNameFor;
exports.hasProperty = hasProperty;
exports.isA = isA;
exports.isImmutableUnorderedKeyed = isImmutableUnorderedKeyed;
exports.isImmutableUnorderedSet = isImmutableUnorderedSet;
exports.isUndefined = isUndefined;

/*
Copyright (c) 2008-2016 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

/* eslint-disable */
// Extracted out of jasmine 2.5.2
function equals(a, b, customTesters, strictCheck) {
  customTesters = customTesters || [];
  return eq(a, b, [], [], customTesters, strictCheck ? hasKey : hasDefinedKey);
}

const functionToString = Function.prototype.toString;

function isAsymmetric(obj) {
  return !!obj && isA('Function', obj.asymmetricMatch);
}

function asymmetricMatch(a, b) {
  var asymmetricA = isAsymmetric(a),
    asymmetricB = isAsymmetric(b);

  if (asymmetricA && asymmetricB) {
    return undefined;
  }

  if (asymmetricA) {
    return a.asymmetricMatch(b);
  }

  if (asymmetricB) {
    return b.asymmetricMatch(a);
  }
} // Equality function lovingly adapted from isEqual in
//   [Underscore](http://underscorejs.org)

function eq(a, b, aStack, bStack, customTesters, hasKey) {
  var result = true;
  var asymmetricResult = asymmetricMatch(a, b);

  if (asymmetricResult !== undefined) {
    return asymmetricResult;
  }

  for (var i = 0; i < customTesters.length; i++) {
    var customTesterResult = customTesters[i](a, b);

    if (customTesterResult !== undefined) {
      return customTesterResult;
    }
  }

  if (a instanceof Error && b instanceof Error) {
    return a.message == b.message;
  }

  if (Object.is(a, b)) {
    return true;
  } // A strict comparison is necessary because `null == undefined`.

  if (a === null || b === null) {
    return a === b;
  }

  var className = Object.prototype.toString.call(a);

  if (className != Object.prototype.toString.call(b)) {
    return false;
  }

  switch (className) {
    case '[object Boolean]':
    case '[object String]':
    case '[object Number]':
      if (typeof a !== typeof b) {
        // One is a primitive, one a `new Primitive()`
        return false;
      } else if (typeof a !== 'object' && typeof b !== 'object') {
        // both are proper primitives
        return Object.is(a, b);
      } else {
        // both are `new Primitive()`s
        return Object.is(a.valueOf(), b.valueOf());
      }

    case '[object Date]':
      // Coerce dates to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a == +b;
    // RegExps are compared by their source patterns and flags.

    case '[object RegExp]':
      return a.source === b.source && a.flags === b.flags;
  }

  if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  } // Use DOM3 method isEqualNode (IE>=9)

  if (isDomNode(a) && isDomNode(b)) {
    return a.isEqualNode(b);
  } // Used to detect circular references.

  var length = aStack.length;

  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    // circular references at same depth are equal
    // circular reference is not equal to non-circular one
    if (aStack[length] === a) {
      return bStack[length] === b;
    } else if (bStack[length] === b) {
      return false;
    }
  } // Add the first object to the stack of traversed objects.

  aStack.push(a);
  bStack.push(b); // Recursively compare objects and arrays.
  // Compare array lengths to determine if a deep comparison is necessary.

  if (className == '[object Array]' && a.length !== b.length) {
    return false;
  } // Deep compare objects.

  var aKeys = keys(a, hasKey),
    key;
  var size = aKeys.length; // Ensure that both objects contain the same number of properties before comparing deep equality.

  if (keys(b, hasKey).length !== size) {
    return false;
  }

  while (size--) {
    key = aKeys[size]; // Deep compare each member

    result =
      hasKey(b, key) &&
      eq(a[key], b[key], aStack, bStack, customTesters, hasKey);

    if (!result) {
      return false;
    }
  } // Remove the first object from the stack of traversed objects.

  aStack.pop();
  bStack.pop();
  return result;
}

function keys(obj, hasKey) {
  var keys = [];

  for (var key in obj) {
    if (hasKey(obj, key)) {
      keys.push(key);
    }
  }

  return keys.concat(
    Object.getOwnPropertySymbols(obj).filter(
      symbol => Object.getOwnPropertyDescriptor(obj, symbol).enumerable
    )
  );
}

function hasDefinedKey(obj, key) {
  return hasKey(obj, key) && obj[key] !== undefined;
}

function hasKey(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isA(typeName, value) {
  return Object.prototype.toString.apply(value) === '[object ' + typeName + ']';
}

function isDomNode(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.nodeType === 'number' &&
    typeof obj.nodeName === 'string' &&
    typeof obj.isEqualNode === 'function'
  );
}

function fnNameFor(func) {
  if (func.name) {
    return func.name;
  }

  const matches = functionToString
    .call(func)
    .match(/^(?:async)?\s*function\s*\*?\s*([\w$]+)\s*\(/);
  return matches ? matches[1] : '<anonymous>';
}

function isUndefined(obj) {
  return obj === void 0;
}

function getPrototype(obj) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(obj);
  }

  if (obj.constructor.prototype == obj) {
    return null;
  }

  return obj.constructor.prototype;
}

function hasProperty(obj, property) {
  if (!obj) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(obj, property)) {
    return true;
  }

  return hasProperty(getPrototype(obj), property);
} // SENTINEL constants are from https://github.com/facebook/immutable-js

const IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
const IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';
const IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

function isImmutableUnorderedKeyed(maybeKeyed) {
  return !!(
    maybeKeyed &&
    maybeKeyed[IS_KEYED_SENTINEL] &&
    !maybeKeyed[IS_ORDERED_SENTINEL]
  );
}

function isImmutableUnorderedSet(maybeSet) {
  return !!(
    maybeSet &&
    maybeSet[IS_SET_SENTINEL] &&
    !maybeSet[IS_ORDERED_SENTINEL]
  );
}
