export function isObjKey<T extends Object>(
  key: PropertyKey,
  obj: T
): key is keyof T {
  return key in obj;
}

type Procedure = (...args: any[]) => void;

export function debounce<F extends Procedure>(
  func: F,
  waitMilliseconds = 0,
  isImmediate = false
): F {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    const context = this;

    const doLater = function () {
      timeoutId = undefined;
      if (!isImmediate) func.apply(context, args);
    };

    const shouldCallNow = isImmediate && timeoutId === undefined;

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(doLater, waitMilliseconds);

    if (shouldCallNow) {
      func.apply(context, args);
    }
  } as F;
}
