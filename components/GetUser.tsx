'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';

export function GetUser() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const firstName: string = user.firstName ?? '';
  const lastName: string = user.lastName ?? '';

  return {
    id: user.id,
    name: firstName + ' ' + lastName,
    email: user.email ?? '',
  };
}
