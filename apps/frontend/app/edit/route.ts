import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  redirect(`/e${qs ? `?${qs}` : ''}`);
}
