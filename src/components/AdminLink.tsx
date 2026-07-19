'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Shows a small Admin link at the top of every page — but only in browsers
// that have signed in to /admin at least once (the token is persisted in
// localStorage under 'adminToken'). Hidden on the admin page itself.
export default function AdminLink() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      setShow(!!localStorage.getItem('adminToken'));
    } catch {
      setShow(false);
    }
  }, []);

  if (!show || pathname === '/admin') return null;

  return (
    <a
      href="/admin"
      title="Admin"
      className="fixed top-2 right-3 z-50 rounded-full border border-line bg-card/80 px-3 py-1 text-xs font-medium text-muted underline decoration-dotted underline-offset-2 backdrop-blur hover:text-clay"
    >
      Admin
    </a>
  );
}
