'use client';

import CustomFormField, { FormFieldType } from '@/components/shared/custom-form-field';
import { SocialButtons } from '@/components/shared/social-button';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldSeparator,
} from '@/components/ui/field';
import { signUp } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import z from 'zod';

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required.'),
    email: z.email('Please enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // Sets the error path
  });

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  async function onSubmit(data: z.infer<typeof signupSchema>) {
    setLoading(true);
    await signUp.email(
      {
        name: data.name,
        email: data.email.trim().toLowerCase(),
        password: data.password,
        callbackURL: '/onboarding',
      },
      {
        onSuccess: () => {
          toast.success('Sign up successful!');
          router.replace('/onboarding');
        },
        onError: (error) => {
          toast.error(error.error.message || 'Something went wrong.');
        },
      },
    );
    setLoading(false);
  }

  return (
    <form
      className={cn('p-6 md:p-8', className)}
      {...props}
      id='sign-up-form'
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <div className='flex flex-col items-center gap-2 text-center'>
          <h1 className='text-2xl font-bold'>Get Started Today</h1>
          <p className='text-balance text-muted-foreground'>
            Create an account in just a few steps and begin your journey with
            us.
          </p>
        </div>

        <CustomFormField
          control={form.control}
          name='name'
          placeholder='Full Name'
          type='text'
          fieldType={FormFieldType.INPUT}

        />
        <CustomFormField
          control={form.control}
          name='email'
          placeholder='Email Address'
          type='email'
          fieldType={FormFieldType.INPUT}
        />
        <FieldGroup className='grid gap-2 grid-cols-2'>
          <CustomFormField
            control={form.control}
            name='password'
            placeholder='Password'
            type='password'
            fieldType={FormFieldType.INPUT}
          />
          <CustomFormField
            control={form.control}
            name='confirmPassword'
            placeholder='Confirm Password'
            type='password'
            fieldType={FormFieldType.INPUT}
          />
        </FieldGroup>
        <Field>
          <Button type='submit'>
            {loading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <UserPlus className='h-4 w-4 transition-transform group-hover:-translate-x-0.5' />
            )}

            <span>{loading ? 'Signing up...' : 'Sign Up'}</span>
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
