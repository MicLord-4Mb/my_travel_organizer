import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { Input, Button, useToast } from '@shared/ui';
import { registerSchema, type RegisterFormData } from '@features/auth';
import { useRegisterMutation } from '@shared/api/apiSlice';
import { useAppDispatch } from '@app/hooks';
import { setCredentials } from '@entities/session';
import styles from './RegisterForm.module.css';

export const RegisterForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [registerApi, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const response = await registerApi({
        name: data.name,
        email: data.email,
        password: data.password,
      }).unwrap();

      dispatch(setCredentials(response));
      toast({
        title: 'Account created!',
        description: `Welcome to WanderFlow, ${response.user.name}`,
        variant: 'success',
      });

      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err?.data?.message || err?.error || 'Registration failed. Please try again.';
      setServerError(message);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.titleGroup}>
        <h2 className={styles.title}>Create your account</h2>
        <p className={styles.subtitle}>Start planning trips with intelligent packing and budget tools</p>
      </div>

      {serverError && <div className={styles.errorMessage}>{serverError}</div>}

      <Input
        label="Full Name"
        type="text"
        placeholder="Alex Rivers"
        leftIcon={<User size={18} />}
        error={errors.name?.message}
        required
        {...register('name')}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="alex.rivers@wanderflow.app"
        leftIcon={<Mail size={18} />}
        error={errors.email?.message}
        required
        {...register('email')}
      />

      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="At least 6 characters"
        leftIcon={<Lock size={18} />}
        error={errors.password?.message}
        rightSlot={
          <button
            type="button"
            className={styles.togglePassBtn}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        required
        {...register('password')}
      />

      <Input
        label="Confirm Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Repeat password"
        leftIcon={<Lock size={18} />}
        error={errors.confirmPassword?.message}
        required
        {...register('confirmPassword')}
      />

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isLoading}
          leftIcon={<UserPlus size={18} />}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </div>

      <p className={styles.footerText}>
        Already have an account?
        <Link to="/login" className={styles.switchLink}>
          Sign in
        </Link>
      </p>
    </form>
  );
};
