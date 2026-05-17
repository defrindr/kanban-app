type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function camelizeResponse<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => camelizeResponse(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value as T;
  }

  const camelizedEntries = Object.entries(value).map(([key, entryValue]) => {
    return [snakeToCamel(key), camelizeResponse(entryValue)];
  });

  return Object.fromEntries(camelizedEntries) as T;
}

export function snakeifyRequest<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => snakeifyRequest(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value as T;
  }

  const snakeEntries = Object.entries(value).map(([key, entryValue]) => {
    return [camelToSnake(key), snakeifyRequest(entryValue)];
  });

  return Object.fromEntries(snakeEntries) as T;
}
