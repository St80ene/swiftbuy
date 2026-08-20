import * as bcrypt from 'bcrypt';

export const passwordHasher = async (
  password: string,
  salt_rounds = 12,
): Promise<string> => {
  return await bcrypt.hash(password, salt_rounds);
};
