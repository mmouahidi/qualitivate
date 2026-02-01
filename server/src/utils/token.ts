export const parseTokenExpiry = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    throw new Error('Invalid token expiry format. Use format like: 1h, 7d, 30m');
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  
  return value * multipliers[unit];
};
