export type EnvVariableType = "string" | "number";

export type EnvVariableTypeMap<T> = T extends "string"
  ? string
  : T extends "number"
  ? number
  : never;

export function parseEnv<
  Type extends EnvVariableType,
  Value extends EnvVariableTypeMap<Type>
>(name: string, type: Type, defaultValue?: Value): Value {
  const value = process.env[name];

  if (!value) {
    if (defaultValue) {
      return defaultValue;
    } else {
      throw new Error(`Environment variable '${name}' is required`);
    }
  }

  switch (type) {
    case "number":
      if (!/[0-9]+/.test(value)) {
        throw new Error(`Environment variable '${name}' must be an integer`);
      }

      return parseInt(value) as Value;
    default:
      return value as Value;
  }
}

export function removeDuplicates(
  value: string,
  index: number,
  array: string[]
) {
  return array.indexOf(value) === index;
}
