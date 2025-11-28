import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center flex-col">
      <h1 className="text-5xl font-black tracking-tight mb-4">Access Denied</h1>
      <span className="text-xl max-w-96 text-center">
        If you think this was a mistake, please reach out to us on{' '}
        <Link href="https://x.com/trylinky">Twitter / X (@trylinky)</Link>
      </span>
    </div>
  );
}
