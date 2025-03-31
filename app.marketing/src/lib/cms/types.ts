export interface BlogPost {
  title: string;
  content: {
    html: string;
  };
  slug: string;
  author: 'alex' | 'jack';
  displayedPublishedAt: string;
  description: string;
}
