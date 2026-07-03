import { useQuery, useMutation } from '@tanstack/react-query'
import { aiAPI } from '@/services/api'
import { useDebounce } from './useDebounce'

export function useAIAnalysis(title, description = '') {
  const debouncedTitle = useDebounce(title, 600)
  return useQuery({
    queryKey: ['ai-analyze', debouncedTitle, description],
    queryFn: () => aiAPI.analyze({ title: debouncedTitle, description }).then((r) => r.data),
    enabled: debouncedTitle.length > 3,
    staleTime: 1000 * 30,
    retry: false,
  })
}

export function useAISuggestions() {
  return useMutation({
    mutationFn: (data) => aiAPI.suggestions(data).then((r) => r.data),
  })
}

export function useInsights() {
  return useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiAPI.insights().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    retry: false,           // ← don't retry on fail
    refetchOnMount: true,
  })
}