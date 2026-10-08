import { redirect } from 'next/navigation';

// Entry point — the dashboard guard handles auth (redirects to /login if needed).
export default function Home() {
  redirect('/dashboard');
}
