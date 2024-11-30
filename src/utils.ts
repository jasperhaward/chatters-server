import { differenceInSeconds } from "date-fns";
import { TConversationEventCommon } from "./schema";

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

export function areEventsWithinOneMinute(
  a: TConversationEventCommon,
  b: TConversationEventCommon
) {
  return (
    Math.abs(
      differenceInSeconds(new Date(a.createdAt), new Date(b.createdAt))
    ) <= 60
  );
}
