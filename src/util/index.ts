export * from "./env";
export * from "./errors";

export function removeDuplicates(
  value: string,
  index: number,
  array: string[]
) {
  return array.indexOf(value) === index;
}
