import { useQuery } from '@tanstack/react-query';
import { spaceApi } from '../services';

export function useSpace(slug: string | undefined) {
  return useQuery({
    queryKey: ['space', slug],
    queryFn: () => spaceApi.getSpaceBySlug(slug as string),
    enabled: !!slug,
  });
}
