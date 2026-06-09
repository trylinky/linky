import { EditModeContextProvider } from '@/app/contexts/Edit';
import { RenderPageTheme } from '@/app/[domain]/[slug]/render-page-theme';
import { EditorNavbar } from '@/app/e/[slug]/editor-navbar';
import { EditorMobileSidebar } from '@/app/e/[slug]/editor-mobile-sidebar';
import { LinkyProviders } from '@/app/components/LinkyProviders';
import { getEnabledBlocks } from '@/app/lib/actions/blocks';
import { getTeamIntegrations } from '@/app/lib/actions/integrations';
import {
  getPageBlocks,
  getPageIdBySlugOrDomain,
  getPageLayout,
  getPageSettings,
  getPageTheme,
} from '@/app/lib/actions/page-actions';
import { getSession } from '@/app/lib/auth';
import * as Catalyst from '@trylinky/ui/catalyst';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

export default async function EditorLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  // Auth gate (Spec §F). There is no standalone login route in this app — login
  // is a widget surfaced from the root domain, and today's editor entry
  // (app/edit/route.ts) redirects logged-out users to `/`. We mirror that, and
  // carry the return path as `redirectTo` (the param name LoginForm already uses).
  if (!session?.data?.user) {
    redirect(`/?redirectTo=/e/${slug}`);
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
  const page = await getPageIdBySlugOrDomain(slug, rootDomain);
  if (!page) notFound();

  if (session.data.session.activeOrganizationId !== page.organizationId) {
    redirect(`/${slug}`); // logged-in non-owner → public view
  }

  // Owner data (mirrors today's owner branch in app/[domain]/[slug]/layout.tsx)
  const [integrations, enabledBlocks, pageSettings] = await Promise.all([
    getTeamIntegrations(),
    getEnabledBlocks(),
    getPageSettings(page.id),
  ]);
  const [{ blocks }, pageLayout, pageTheme] = await Promise.all([
    getPageBlocks(page.id),
    getPageLayout(page.id),
    getPageTheme(page.id),
  ]);

  const initialData: Record<string, any> = {
    [`/pages/${page.id}/layout`]: pageLayout,
    [`/pages/${page.id}/theme`]: pageTheme,
    [`/integrations/me`]: integrations,
    [`/blocks/enabled-blocks`]: enabledBlocks,
    [`/pages/${page.id}/settings`]: pageSettings,
  };
  if (blocks && blocks.length > 0) {
    blocks.forEach((block: any) => {
      initialData[`/blocks/${block.id}`] = { blockData: block.data };
    });
  }

  return (
    <LinkyProviders currentUserIsOwner pageId={page.id} value={{ fallback: initialData }}>
      <EditModeContextProvider>
        <RenderPageTheme pageId={page.id} />
        <Catalyst.StackedLayout
          navbar={<EditorNavbar slug={slug} />}
          sidebar={<EditorMobileSidebar slug={slug} />}
        >
          {props.children}
        </Catalyst.StackedLayout>
      </EditModeContextProvider>
    </LinkyProviders>
  );
}
