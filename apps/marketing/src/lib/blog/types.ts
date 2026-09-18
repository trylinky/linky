export type AuthorIds = 'alex' | 'jack' | 'hana';

export type Author = {
  id: AuthorIds;
  name: string;
  position: string;
  avatar: string;
  link: string;
  linkyUsername: string;
  linkyLink: string;
};

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  author: AuthorIds;
  publishedAt: string;
  featuredImage?: string;
  draft: boolean;
  content: string;
}
