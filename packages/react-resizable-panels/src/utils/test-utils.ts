import { MixedSizes } from "../types";

const util = require("util");

export function expectToBeCloseToArray(
  actualNumbers: number[],
  expectedNumbers: number[]
) {
  expect(actualNumbers.length).toBe(expectedNumbers.length);

  try {
    actualNumbers.forEach((actualNumber, index) => {
      const expectedNumber = expectedNumbers[index];
      expect(actualNumber).toBeCloseTo(expectedNumber, 1);
    });
  } catch (error) {
    expect(actualNumbers).toEqual(expectedNumbers);
  }
}

export function mockPanelGroupOffsetWidthAndHeight(
  mockWidth = 1_000,
  mockHeight = 1_000
) {
  const offsetHeightPropertyDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetHeight"
  );

  const offsetWidthPropertyDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetWidth"
  );

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: function () {
      if (this.hasAttribute("data-resize-handle")) {
        return 0;
      } else if (this.hasAttribute("data-panel-group")) {
        return mockHeight;
      }
    },
  });

  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: function () {
      if (this.hasAttribute("data-resize-handle")) {
        return 0;
      } else if (this.hasAttribute("data-panel-group")) {
        return mockWidth;
      }
    },
  });

  return function uninstallMocks() {
    if (offsetHeightPropertyDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "offsetHeight",
        offsetHeightPropertyDescriptor
      );
    }

    if (offsetWidthPropertyDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "offsetWidth",
        offsetWidthPropertyDescriptor
      );
    }
  };
}

export function verifyExpandedPanelGroupLayout(
  actualLayout: MixedSizes[],
  expectedPercentages: number[]
) {
  expect(actualLayout).toHaveLength(expectedPercentages.length);
  expect(actualLayout.map(({ sizePercentage }) => sizePercentage)).toEqual(
    expectedPercentages
  );
}

export function verifyExpectedWarnings(
  callback: Function,
  ...expectedMessages: string[]
) {
  const consoleSpy = (format: any, ...args: any[]) => {
    const message = util.format(format, ...args);

    for (let index = 0; index < expectedMessages.length; index++) {
      const expectedMessage = expectedMessages[index];
      if (message.includes(expectedMessage)) {
        expectedMessages.splice(index, 1);
        return;
      }
    }

    if (expectedMessages.length === 0) {
      throw new Error(`Unexpected message recorded:\n\n${message}`);
    }
  };

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = consoleSpy;
  console.warn = consoleSpy;

  let caughtError;
  let didCatch = false;
  try {
    callback();
  } catch (error) {
    caughtError = error;
    didCatch = true;
  } finally {
    console.error = originalError;
    console.warn = originalWarn;

    if (didCatch) {
      throw caughtError;
    }

    // Any remaining messages indicate a failed expectations.
    if (expectedMessages.length > 0) {
      throw Error(
        `Expected message(s) not recorded:\n\n${expectedMessages.join("\n")}`
      );
    }

    return { pass: true };
  }
}
