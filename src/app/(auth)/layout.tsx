// No special layout for auth pages — just render children directly
// This prevents the admin auth guard from intercepting /login and /register
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
