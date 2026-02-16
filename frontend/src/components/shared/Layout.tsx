import type { ReactNode } from 'react';
import { Nav } from './Nav';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  wide?: boolean;
}

export function Layout({ children, wide }: LayoutProps) {
  return (
    <>
      <Nav />
      <main id="main" className={wide ? 'container-wide' : 'container'}>
        {children}
      </main>
      <Footer />
    </>
  );
}
