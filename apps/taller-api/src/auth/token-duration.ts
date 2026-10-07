const DURATION_MULTIPLIERS = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

export function tokenDurationMilliseconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Duración de token inválida: ${value}`);
  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof DURATION_MULTIPLIERS;
  const milliseconds = amount * DURATION_MULTIPLIERS[unit];
  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) {
    throw new Error(`Duración de token inválida: ${value}`);
  }
  return milliseconds;
}
