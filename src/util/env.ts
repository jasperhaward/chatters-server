export type EnvVariableType = "string" | "number";

export type EnvVariableTypeMap<T> = T extends "string"
  ? string
  : T extends "number"
  ? number
  : never;

export function parseEnv<T extends EnvVariableType>(
  name: string,
  type: T
): EnvVariableTypeMap<T> {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable '${name}' is required`);
  }

  switch (type) {
    case "number":
      if (!/[0-9]+/.test(value)) {
        throw new Error(`Environment variable '${name}' must be an integer`);
      }

      return parseInt(value) as EnvVariableTypeMap<T>;
  }

  return value as EnvVariableTypeMap<T>;
}
