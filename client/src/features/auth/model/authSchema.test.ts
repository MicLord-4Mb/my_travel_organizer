import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from './authSchema';

describe('authSchema validation', () => {
  describe('loginSchema', () => {
    const validLogin: LoginFormData = {
      email: 'alex.rivers@wanderflow.app',
      password: 'secretPassword123',
      rememberMe: true,
    };

    it('passes validation for valid login credentials', () => {
      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('fails when email is invalid', () => {
      const result = loginSchema.safeParse({ ...validLogin, email: 'not-an-email' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });

    it('fails when password is fewer than 6 characters', () => {
      const result = loginSchema.safeParse({ ...validLogin, password: '123' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });
  });

  describe('registerSchema', () => {
    const validRegister: RegisterFormData = {
      name: 'Alex Rivers',
      email: 'alex.rivers@wanderflow.app',
      password: 'securePassword456',
      confirmPassword: 'securePassword456',
    };

    it('passes validation for valid registration data', () => {
      const result = registerSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });

    it('fails when passwords do not match', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        confirmPassword: 'differentPassword789',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
        expect(issue?.message).toBe('Passwords do not match');
      }
    });

    it('fails when name is too short', () => {
      const result = registerSchema.safeParse({ ...validRegister, name: 'A' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
      }
    });
  });
});
