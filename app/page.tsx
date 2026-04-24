import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically redirect users to the login portal.
  redirect('/login');
}
