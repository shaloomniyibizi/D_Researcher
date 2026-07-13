import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { AuthMode, AuthTabs } from '@/components/web/auth-tabs';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

function resolveAuthMode(value: string | string[] | undefined): AuthMode {
  const mode = Array.isArray(value) ? value[0] : value;

  return mode === 'sign-up' ? 'sign-up' : 'sign-in';
}

export default async function AuthPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const mode = resolveAuthMode(resolvedParams.mode);

  return (
    <div className='flex flex-col gap-6'>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <div className='flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10'>
            <div className='w-full max-w-lg md:max-w-4xl bg-card'>
              <AuthTabs initialMode={mode} />
            </div>
          </div>
          <div className='relative hidden bg-background md:block'>
            <Image
              src='/images/placeholder.jpg'
              alt='Image'
              priority
              loading='eager'
              className='absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale'
              width={0}
              height={0}
              sizes='100vw'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
