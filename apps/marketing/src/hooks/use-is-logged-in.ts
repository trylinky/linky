'use client';

import { useEffect, useState } from 'react';

export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const req = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/session/me`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        const res = await req.json();

        if (res?.session) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    fetchSession();
  }, []);

  return isLoggedIn;
}
