'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { FullPageLoader } from '@/components/ui/page-states';
import { useRedirectAuthenticated } from '@/features/system/auth/hooks';
import { setAccessToken } from '@/features/system/auth/utils/auth-storage';
import { login } from '@/features/system/auth/api/auth-service';
import { AppBrand } from '@/components/layout/app-brand';
import { useAppForm } from '@/lib/hooks/use-app-form';
import { FormField, FormInput } from '@/components/ui/form-controls';
import { AppButton } from '@/components/ui/app-button';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const checkingAuth = useRedirectAuthenticated();

  const form = useAppForm({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = form;

  if (checkingAuth) {
    return <FullPageLoader label="Đang kiểm tra phiên đăng nhập..." />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const payload = await login(values);
      setAccessToken(payload.accessToken);
      router.push(redirect || '/jira');
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Đăng nhập thất bại';
      setError('root', { message });
    }
  };

  return (
    <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
      <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 p-10 shadow-inner backdrop-blur-3xl">
        {/* Physical noise texture */}
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-noise" />

        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-8 p-4 bg-slate-950 rounded-xl shadow-inner border border-white/10">
            <AppBrand subtitle="Neural_Entry" variant="dark" />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white uppercase leading-tight mb-2 text-glow">
            SuperBoard Terminal
          </h1>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-10">
            Secure_Access_Gateway_v4.2
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6 text-left">
            <FormField label="Identity Email" error={errors.email?.message} required>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                  <Mail size={16} />
                </div>
                <FormInput
                  {...register('email')}
                  type="email"
                  placeholder="name@company.com"
                  className="pl-12 h-14"
                  error={!!errors.email}
                  autoComplete="email"
                />
              </div>
            </FormField>

            <FormField label="Access Secret" error={errors.password?.message} required>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                  <Lock size={16} />
                </div>
                <FormInput
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="pl-12 h-14"
                  error={!!errors.password}
                  autoComplete="current-password"
                />
              </div>
            </FormField>

            <AppButton
              type="submit"
              variant="white"
              size="xl"
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck size={14} />}
              className="w-full mt-4"
            >
              Establish Connection
            </AppButton>
          </form>

          {errors.root && (
            <div className="mt-6 flex items-center gap-3 text-rose-400 bg-rose-500/5 border border-rose-500/20 px-5 py-4 rounded-xl animate-in slide-in-from-top-2 duration-300 w-full shadow-glow-rose/5">
              <ShieldCheck size={16} className="shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                {errors.root.message}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoader label="Đang tải..." />}>
      <LoginContent />
    </Suspense>
  );
}
