'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'dark' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-cyber-dark group-[.toaster]:text-white group-[.toaster]:border-cyber-blue/20 group-[.toaster]:shadow-cyber-glow',
          description: 'group-[.toast]:text-cyber-gray-400',
          actionButton:
            'group-[.toast]:bg-cyber-blue group-[.toast]:text-cyber-dark',
          cancelButton:
            'group-[.toast]:bg-cyber-gray-800 group-[.toast]:text-white',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
