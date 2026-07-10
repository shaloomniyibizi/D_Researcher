'use client'

import { useState } from 'react';
import { toast } from 'react-toastify';

import { GithubIcon, GoogleIcon } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

type SocialProvider = 'google' | 'github';

export function SocialButtons({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);

  async function handleSocialSignIn(provider: SocialProvider) {
    setPendingProvider(provider);

    await signIn.social(
      {
        provider,
        callbackURL: '/onboarding',
        errorCallbackURL: '/auth?mode=sign-in',
      },
      {
        onError: (ctx) => {
          toast.error(ctx.error.message || `Unable to continue with ${provider}.`);
          setPendingProvider(null);
        },
      },
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-4', className)} {...props}>
      <Button
        variant='outline'
        type='button'
        aria-label='Continue with Google'
        disabled={pendingProvider !== null}
        onClick={() => handleSocialSignIn('google')}
      >
        <GoogleIcon />
        <span className='sr-only'> Google</span>
      </Button>
      <Button
        variant='outline'
        type='button'
        aria-label='Continue with Github'
        disabled={pendingProvider !== null}
        onClick={() => handleSocialSignIn('github')}
      >
        <GithubIcon />
        <span className='sr-only'> Github</span>
      </Button>
    </div>
  );
}
