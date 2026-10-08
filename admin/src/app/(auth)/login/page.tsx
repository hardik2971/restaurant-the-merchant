'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/schemas/auth';

const HIGHLIGHTS = [
  'Real-time orders, POS & reservations',
  'Live analytics across every outlet',
  'Menu, staff & inventory in one place',
];

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[#140d09] lg:block">
      {/* Looping cook/food video background (poster shows while it loads) */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1400&q=80"
      >
        <source src="/images/login-bg.mp4" type="video/mp4" />
      </video>

      {/* Warm dark wash for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#140d09] via-[#140d09]/70 to-[#140d09]/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#140d09]/40" />

      <div className="relative flex h-full flex-col justify-between p-12 text-white">
        {/* Brand */}
        <div>
          <Image
            src="/images/logo_merchant.png"
            alt="The Merchant Boston"
            width={150}
            height={84}
            priority
            className="h-20 w-auto"
          />
          
        </div>

        {/* Quote */}
        <div className="max-w-lg">
          <span className="font-display text-6xl leading-none text-accent">&ldquo;</span>
          <blockquote className="-mt-6 font-display text-4xl font-medium leading-tight">
            Great restaurants are run in the details — every plate, every table, every shift.
          </blockquote>
          <p className="mt-5 text-sm text-white/70">
            Your kitchen has the craft. This is where you run the business behind it.
          </p>
        </div>

        {/* Highlights */}
        <ul className="space-y-3">
          {HIGHLIGHTS.map((h) => (
            <li key={h} className="flex items-center gap-3 text-sm text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {h}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const fieldWrap = 'relative';
const fieldInput =
  'w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10';
const fieldIcon = 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/dashboard';
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const res = await signIn('credentials', { ...data, redirect: false });
    if (res?.error) {
      setServerError('Invalid email or password.');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="flex items-center justify-center px-6 py-12 sm:px-10">
      <div className="w-full max-w-sm">
        {/* Mobile brand */}
        <div className="mb-8 lg:hidden">
          <span className="inline-flex rounded-xl bg-[#140d09] px-3.5 py-2.5">
            <Image
              src="/images/logo_merchant.png"
              alt="The Merchant Boston"
              width={120}
              height={67}
              className="h-8 w-auto"
            />
          </span>
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Welcome back</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Sign in to your dashboard</h1>
        <p className="mt-2 text-sm text-fg-muted">Manage your restaurant &amp; team from one place.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {serverError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {serverError}
            </p>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <div className={fieldWrap}>
              <Mail className={fieldIcon} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={fieldInput}
                placeholder="you@restaurant.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <div className={fieldWrap}>
              <Lock className={fieldIcon} />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={fieldInput}
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-deep hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 rounded-lg border border-border bg-surface-2 px-3 py-2 text-center text-xs text-fg-muted">
          Demo · <span className="font-medium text-fg">george@merchant.test</span> / admin123
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-bg lg:grid-cols-2">
      <BrandPanel />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
