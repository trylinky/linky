import type { FaqEntry } from '@/components/pseo/pseo-faq';

export interface ContentSection {
  heading: string;
  body: string; // 1-3 paragraphs of unique, answer-first prose
}

export interface IntegrationContent {
  slug: string; // matches integrationType, e.g. 'spotify'
  integrationType: string;
  name: string; // 'Spotify'
  h1: string; // answer-first, mirrors the target query
  answer: string; // one-sentence direct answer
  targetKeyword: string;
  blockCopy: Record<string, { name: string; description: string }>;
  sections: ContentSection[];
  faqs: FaqEntry[];
}

export interface TemplateContent {
  slug: string;
  name: string;
  h1: string;
  answer: string;
  targetKeyword: string;
  font?: string;
  palette: import('@/components/pseo/theme-mock').ThemePalette;
  sections: ContentSection[];
  faqs: FaqEntry[];
}

/** Quality gate (anti-thin-content): only publishable pages get prerendered + sitemapped. */
export function isPublishableIntegration(c: IntegrationContent): boolean {
  return (
    c.h1.trim() !== '' &&
    c.answer.trim() !== '' &&
    c.sections.length >= 4 &&
    c.faqs.length >= 3 &&
    Object.keys(c.blockCopy).length >= 1
  );
}

export function isPublishableTemplate(c: TemplateContent): boolean {
  return c.h1.trim() !== '' && c.answer.trim() !== '' && c.sections.length >= 4 && c.faqs.length >= 3;
}

export interface ComparisonRow {
  feature: string;
  linky: string;
  competitor: string;
}

export interface NicheContent {
  slug: string;
  name: string;
  h1: string;
  answer: string;
  targetKeyword: string;
  sections: ContentSection[];
  faqs: FaqEntry[];
  recommendedBlocks?: string[];
  relatedIntegrations?: string[];
  recommendedTemplate?: string;
}

export interface AlternativeContent {
  slug: string;
  competitor: string;
  h1: string;
  answer: string;
  targetKeyword: string;
  sections: ContentSection[];
  faqs: FaqEntry[];
  comparison: ComparisonRow[];
}

/** Strictest gate (editorial): richer content than Spec 2's data-driven pages. */
export function isPublishableNiche(c: NicheContent): boolean {
  return (
    c.h1.trim() !== '' &&
    c.answer.trim() !== '' &&
    c.sections.length >= 5 &&
    c.faqs.length >= 4 &&
    ((c.recommendedBlocks?.length ?? 0) >= 1 ||
      (c.relatedIntegrations?.length ?? 0) >= 1 ||
      Boolean(c.recommendedTemplate))
  );
}

export function isPublishableAlternative(c: AlternativeContent): boolean {
  return (
    c.h1.trim() !== '' &&
    c.answer.trim() !== '' &&
    c.sections.length >= 5 &&
    c.faqs.length >= 4 &&
    c.comparison.length >= 4
  );
}
