
import { TooltipProvider } from '@/components/ui/tooltip';
import * as React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './theme-provider';

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <>

      <TooltipProvider>{children}</TooltipProvider>
      <ToastContainer />
    </>
  );
}
