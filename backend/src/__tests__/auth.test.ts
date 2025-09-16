import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from '../utils/auth';

describe('Auth Utils', () => {
  describe('Password hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    test('should verify password correctly', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('WrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT tokens', () => {
    test('should generate and verify token correctly', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser',
      };

      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.username).toBe(payload.username);
    });

    test('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid-token');
      }).toThrow('Invalid token');
    });
  });
});
