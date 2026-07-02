import { HistorySidebar } from '@/components/history-sidebar';
import { BrandSidebar } from '@/components/brand-sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrandSidebar />
      <HistorySidebar />
      <div className="mx-auto w-full max-w-2xl px-6 py-12">{children}</div>
    </>
  );
}
