'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GroupSessionPublic } from '@/types';
import { rehydratePublicGroup } from '@/utils/groups';

// Load a group session (tokens are resolved server-side into a role and
// never returned). Reads on load / manual refresh — no live push, per spec.
export function useGroupData(groupId: string | null, token: string | null) {
  const [group, setGroup] = useState<GroupSessionPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!groupId) return;
    try {
      const url = token
        ? `/api/groups/${groupId}?token=${encodeURIComponent(token)}`
        : `/api/groups/${groupId}`;
      const response = await fetch(url);
      if (response.status === 404) {
        setError('Group not found');
        setGroup(null);
      } else if (!response.ok) {
        setError('Failed to load group');
      } else {
        const data = await response.json();
        setGroup(rehydratePublicGroup(data));
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error loading group:', err);
      setError('Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    load();
  }, [load]);

  return { group, loading, error, lastUpdated, refresh: load, setGroup };
}
