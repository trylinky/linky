export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="bg-slate-50 min-h-[calc(100vh-200px)]">
        <div className="relative z-10">{children}</div>
      </div>
    </>
  );
}
