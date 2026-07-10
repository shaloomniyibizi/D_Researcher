'use client';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldSeparator,
} from '@/components/ui/field';
import { signIn } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import z from 'zod';
import CustomFormField, { FormFieldType } from '@/components/shared/custom-form-field';
import { SocialButtons } from '@/components/shared/social-button';

const SignInSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  rememberMe: z.boolean(),
});

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
  async function onSubmit(data: z.infer<typeof SignInSchema>) {
    setLoading(true);
    await signIn.email(
      {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        callbackURL: '/onboarding',
        rememberMe: data.rememberMe,
      },
      {
        onSuccess: () => {
          toast.success('Signed in successfully.');
          router.replace('/onboarding');
          setLoading(false);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || 'Invalid email or password.');
          setLoading(false);
        },
      },
    );
  }

  return (
    <form
      className={cn('p-6 md:p-8', className)}
      {...props}
      id='sign-in-form'
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <div className='flex flex-col items-center gap-2 text-center'>
          <h1 className='text-2xl font-bold'>Good to See You Again</h1>
          <p className='text-balance text-muted-foreground'>
            Enter your credentials to securely access your account.
          </p>
        </div>
        <CustomFormField
          control={form.control}
          name='email'
          placeholder='Email'
          type='email'
          fieldType={FormFieldType.INPUT}
        />
        <CustomFormField
          control={form.control}
          name='password'
          placeholder='Password'
          type='password'
          fieldType={FormFieldType.INPUT}
        />

        <CustomFormField
          control={form.control}
          name='rememberMe'
          label='Remember me'
          placeholder='Remember me'
          type='checkbox'
          fieldType={FormFieldType.CHECKBOX}
        />
        <Field>
          <Button type='submit'>
            {loading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <LogIn className='h-4 w-4 transition-transform group-hover:-translate-x-0.5' />
            )}

            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </Button>
        </Field>
        <FieldSeparator className='*:data-[slot=field-separator-content]:bg-card'>
          Or continue with
        </FieldSeparator>
        <SocialButtons />
      </FieldGroup>
    </form>
  );
}
