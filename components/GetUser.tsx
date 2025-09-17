'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';

import { GetUserReturn } from '@/convex/users';
import { AuthUserId } from '@/convex/utils';

export function GetUser(): GetUserReturn {
  const { user } = useAuth();

  if (!user) {
    throw new Error('Called GetUser without authentication present.');
  }

  const firstName: string = user.firstName ?? '';
  const lastName: string = user.lastName ?? '';

  return {
    _id: (user.externalId ?? '') as AuthUserId,
    workosId: user.id,
    name: firstName + ' ' + lastName,
    email: user.email ?? '',
    pfpUrl: user.profilePictureUrl ?? '',
  };
}
