import { redirect } from 'next/navigation';
import { PUBLIC_ROUTES } from '@/lib/navigation';

export default function HomePage() {
  redirect(PUBLIC_ROUTES.login);
}
