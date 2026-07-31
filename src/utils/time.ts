import ms, { type StringValue } from "ms";

export const calculateExpiresAt = (expiresIn: StringValue | number): Date => {
  if (typeof expiresIn === "number") {
    return new Date(Date.now() + expiresIn);
  }

  const milliseconds = ms(expiresIn);
  if (!milliseconds) {
    throw new Error(
      `[TimeUtil] Invalid duration format: "${expiresIn}". Example of valid formats: "7d", "2h", "15m"`,
    );
  }

  return new Date(Date.now() + milliseconds);
};
