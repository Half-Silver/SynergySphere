import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const AuthLayout = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="container mx-auto py-10 px-4">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="hidden lg:block">
            <h2 className="text-3xl font-bold tracking-tight">SynergySphere</h2>
            <p className="mt-3 text-muted-foreground max-w-prose">
              Plan, collaborate, and deliver. A modern workspace for teams to manage
              projects, tasks, and communication in one place.
            </p>
            <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-card">
              <p className="text-sm text-muted-foreground">
                Tip: You can switch themes anytime from the user menu.
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-xl">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold">Welcome</h1>
                <p className="text-sm text-muted-foreground">Sign in or create an account to continue</p>
              </div>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
