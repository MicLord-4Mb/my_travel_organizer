import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sparkles, LogIn } from 'lucide-react';
import { Input, Button, Checkbox, useToast } from '@shared/ui';
import {type LoginFormData, loginSchema} from '@features/auth/model/authSchema';
import { useLoginMutation } from '@shared/api/apiSlice';
import { useAppDispatch } from '@app/hooks';
import { setCredentials } from '@entities/session';
import styles from './LoginForm.module.css';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [loginApi, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const rememberMe = useWatch({ control, name: 'rememberMe' });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await loginApi(data).unwrap();
      dispatch(setCredentials(response));
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${response.user.name}`,
        variant: 'success',
      });

      const state = location.state as LocationState;
      const redirectPath = state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      const message = err?.data?.message || err?.error || 'Failed to sign in. Please check your credentials.';
      setServerError(message);
    }
  };

  const handleFillDemo = () => {
    setValue('email', 'alex.rivers@wanderflow.app', { shouldValidate: true });
    setValue('password', 'wanderflow2026', { shouldValidate: true });
    setServerError(null);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.titleGroup}>
        <h2 className={styles.title}>Sign in to WanderFlow</h2>
        <p className={styles.subtitle}>Enter your details to access your itineraries and budgets</p>
      </div>

      {serverError && <div className={styles.errorMessage}>{serverError}</div>}

      <div className={styles.demoBox}>
        <div className={styles.demoInfo}>
          Demo account: <strong>alex.rivers@wanderflow.app</strong>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Sparkles size={14} />}
          onClick={handleFillDemo}
        >
          Quick Fill
        </Button>
      </div>

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
        placeholder="••••••••"
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

      <div className={styles.rowBetween}>
        <label className={styles.rememberGroup}>
          <Checkbox
            checked={Boolean(rememberMe)}
            onCheckedChange={(checked) => setValue('rememberMe', checked)}
          />
          <span>Keep me signed in</span>
        </label>
        <Link to="/login" className={styles.forgotLink} onClick={() => toast({ title: 'Password Reset', description: 'Demo password reset link simulated.' })}>
          Forgot password?
        </Link>
      </div>

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isLoading}
          leftIcon={<LogIn size={18} />}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </div>

      <p className={styles.footerText}>
        Don't have an account yet?
        <Link to="/register" className={styles.switchLink}>
          Sign up
        </Link>
      </p>
    </form>
  );
};
