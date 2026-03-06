'use client';

import { useEffect, useRef, useState } from 'react';

export default function Section({
  children,
  className = '',
  id,
  immediate = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(immediate);

  useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.04, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <section
      ref={ref}
      id={id}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        filter: visible ? 'blur(0px)' : 'blur(8px)',
        transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1), filter 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </section>
  );
}
