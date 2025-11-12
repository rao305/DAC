// Dynamic import wrapper for react-markdown (heavy component)
// This reduces initial bundle size and improves TBT/TTI
import dynamic from 'next/dynamic';

// Lazy-load react-markdown with a loading skeleton
export const Markdown = dynamic(
  () => import('react-markdown').catch(() => {
    // Fallback if react-markdown is not installed
    return { default: ({ children }: { children: string }) => <div className="whitespace-pre-wrap">{children}</div> };
  }),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    ),
  }
);

// Export default for convenience
export default Markdown;
