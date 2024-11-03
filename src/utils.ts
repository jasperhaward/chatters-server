export function parseEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable '${name}' is required`);
  }

  return value;
}

export function removeDuplicates(
  value: string,
  index: number,
  array: string[]
) {
  return array.indexOf(value) === index;
}
