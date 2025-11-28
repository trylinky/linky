export function isObjKey<T extends Object>(
  key: PropertyKey,
  obj: T
): key is keyof T {
  return key in obj;
}
