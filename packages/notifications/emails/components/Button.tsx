import { Button as ReactEmailButton } from '@react-email/components';

export function Button({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <ReactEmailButton style={button} href={href}>
      {children}
    </ReactEmailButton>
  );
}

const button = {
  backgroundColor: '#111',
  borderRadius: '8px',
  fontWeight: '600',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '11px 23px',
};
