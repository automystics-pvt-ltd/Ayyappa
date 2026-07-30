import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import AdminLogin from '@/pages/AdminLogin';
import Dashboard from '@/pages/admin/Dashboard';
import Donations from '@/pages/admin/Donations';
import NewsAdmin from '@/pages/admin/News';
import EventsAdmin from '@/pages/admin/Events';
import SettingsAdmin from '@/pages/admin/Settings';
import AdminManagement from '@/pages/admin/AdminManagement';
import ContentManager from '@/pages/admin/ContentManager';
import GalleryAdmin from '@/pages/admin/Gallery';
import ContributionsAdmin from '@/pages/admin/Contributions';
import Receipt from '@/pages/Receipt';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { AdminContext, useAdminState, useAdmin } from '@/hooks/useAdmin';
import { SiteSettingsProvider } from '@/hooks/useSiteSettings';

const queryClient = new QueryClient();

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdmin();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">ஏற்றுகிறது...</div>;
  }
  if (!admin) {
    return <Redirect to="/admin" />;
  }
  return <>{children}</>;
}

function AppContent() {
  const adminState = useAdminState();

  return (
    <AdminContext.Provider value={adminState}>
      <SiteSettingsProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={AdminLogin} />
        <Route path="/admin/dashboard">
          <AdminGuard><Dashboard /></AdminGuard>
        </Route>
        <Route path="/admin/donations">
          <AdminGuard><Donations /></AdminGuard>
        </Route>
        <Route path="/admin/news">
          <AdminGuard><NewsAdmin /></AdminGuard>
        </Route>
        <Route path="/admin/events">
          <AdminGuard><EventsAdmin /></AdminGuard>
        </Route>
        <Route path="/admin/settings">
          <AdminGuard><SettingsAdmin /></AdminGuard>
        </Route>
        <Route path="/admin/admins">
          <AdminGuard><AdminManagement /></AdminGuard>
        </Route>
        <Route path="/admin/content">
          <AdminGuard><ContentManager /></AdminGuard>
        </Route>
        <Route path="/admin/gallery">
          <AdminGuard><GalleryAdmin /></AdminGuard>
        </Route>
        <Route path="/admin/contributions">
          <AdminGuard><ContributionsAdmin /></AdminGuard>
        </Route>
        <Route path="/receipt/:token" component={Receipt} />
        <Route component={NotFound} />
      </Switch>
      </SiteSettingsProvider>
    </AdminContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppContent />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
