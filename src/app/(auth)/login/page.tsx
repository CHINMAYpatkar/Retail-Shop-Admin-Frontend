'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, KeyRound, ArrowLeft, Mail } from 'lucide-react';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginFormValues,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from '@/lib/validations/auth.schema';
import { useLogin, useForgotPassword, useResetPassword } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';

type Mode = 'login' | 'forgot' | 'reset';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-lg border border-ink-800 bg-ink-900 p-8 shadow-popover"
      >
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-600 text-sm font-bold text-ink-950">
            RS
          </span>
          <div>
            <p className="font-display text-base font-semibold text-white">Retail Shop</p>
            <p className="text-xs text-ink-400">Admin Console</p>
          </div>
        </div>
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </motion.div>
    </div>
  );
}

const fieldMotion = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { duration: 0.18 },
};

function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  return (
    <motion.div key="login" {...fieldMotion}>
      <form onSubmit={handleSubmit((values) => login.mutate(values))} className="space-y-4">
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="you@retailshop.com"
            autoComplete="email"
            invalid={!!errors.email}
            className="bg-ink-800 border-ink-700 text-white placeholder:text-ink-500"
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            invalid={!!errors.password}
            className="bg-ink-800 border-ink-700 text-white placeholder:text-ink-500"
            {...register('password')}
          />
        </FormField>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-gold-500 hover:text-gold-400 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" variant="gold" className="w-full" loading={login.isPending}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </form>
    </motion.div>
  );
}

function ForgotPasswordForm({
  onBack,
  onSent,
}: {
  onBack: () => void;
  onSent: (email: string) => void;
}) {
  const forgotPassword = useForgotPassword();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  return (
    <motion.div key="forgot" {...fieldMotion}>
      <p className="mb-4 text-sm text-ink-400">
        Enter your admin email and we&apos;ll send a 6-digit code to reset your password.
      </p>
      <form
        onSubmit={handleSubmit((values) =>
          forgotPassword.mutate(values, { onSuccess: () => onSent(getValues('email')) }),
        )}
        className="space-y-4"
      >
        <FormField label="Email" htmlFor="forgot-email" error={errors.email?.message}>
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@retailshop.com"
            autoComplete="email"
            invalid={!!errors.email}
            className="bg-ink-800 border-ink-700 text-white placeholder:text-ink-500"
            {...register('email')}
          />
        </FormField>

        <Button type="submit" variant="gold" className="w-full" loading={forgotPassword.isPending}>
          <Mail className="h-4 w-4" />
          Send reset code
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center justify-center gap-1.5 text-xs text-ink-400 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </button>
      </form>
    </motion.div>
  );
}

function ResetPasswordForm({ email, onBack }: { email: string; onBack: () => void }) {
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email },
  });

  return (
    <motion.div key="reset" {...fieldMotion}>
      <p className="mb-4 text-sm text-ink-400">
        Enter the code sent to <span className="text-white">{email}</span> and choose a new password.
      </p>
      <form
        onSubmit={handleSubmit((values) => resetPassword.mutate(values))}
        className="space-y-4"
      >
        <input type="hidden" {...register('email')} />

        <FormField label="6-digit code" htmlFor="code" error={errors.code?.message}>
          <Input
            id="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            invalid={!!errors.code}
            className="bg-ink-800 border-ink-700 text-white placeholder:text-ink-500 font-data tracking-widest"
            {...register('code')}
          />
        </FormField>

        <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
          <Input
            id="newPassword"
            type="password"
            invalid={!!errors.newPassword}
            className="bg-ink-800 border-ink-700 text-white placeholder:text-ink-500"
            {...register('newPassword')}
          />
        </FormField>

        <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <Input
            id="confirmPassword"
            type="password"
            invalid={!!errors.confirmPassword}
            className="bg-ink-800 border-ink-700 text-white placeholder:text-ink-500"
            {...register('confirmPassword')}
          />
        </FormField>

        <Button type="submit" variant="gold" className="w-full" loading={resetPassword.isPending}>
          <KeyRound className="h-4 w-4" />
          Reset password
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center justify-center gap-1.5 text-xs text-ink-400 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </button>
      </form>
    </motion.div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = React.useState<Mode>('login');
  const [resetEmail, setResetEmail] = React.useState('');

  return (
    <Shell>
      {mode === 'login' && <LoginForm onForgotPassword={() => setMode('forgot')} />}
      {mode === 'forgot' && (
        <ForgotPasswordForm
          onBack={() => setMode('login')}
          onSent={(email) => {
            setResetEmail(email);
            setMode('reset');
          }}
        />
      )}
      {mode === 'reset' && <ResetPasswordForm email={resetEmail} onBack={() => setMode('login')} />}
    </Shell>
  );
}
