'use client';

import { useActiveHeading } from '@/app/blog/[blogPostSlug]/rich-text-hooks';
import { cn } from '@trylinky/ui';
import Link from 'next/link';
import { ReactNode } from 'react';

type LabelProps = {
  children: ReactNode;
};

export function Label({ children }: LabelProps) {
  return (
    <h4 className="text-haiti mb-4 pl-2 text-xs font-medium uppercase tracking-wider">
      {children}
    </h4>
  );
}

type TOCProps = {
  links: {
    id: string;
    title: string;
    level: number;
  }[];

  className?: string;
  labelText?: string;
};

export function TableOfContents({ links, className, labelText }: TOCProps) {
  const { currentIndex } = useActiveHeading();

  return (
    <nav className={cn('relative w-full max-w-[208px] rounded-md', className)}>
      <Label>{labelText || `Table of contents`}</Label>

      <ul className="w-full pl-2">
        {links.map(({ id, title, level }, index) => {
          const isActive = currentIndex === index;

          return (
            <li
              key={id}
              className={cn([
                `rounded-r transition`,
                level === 3 && `pl-4`,
                level === 4 && `pl-6`,
                isActive && `border-l-2 border-indigo-700`,
                !isActive && `border-l border-gray-300`,
              ])}
            >
              <Link
                className={cn([
                  `block h-full w-full py-1 px-4 text-[13px] leading-5 transition`,
                  isActive && `font-semibold text-gray-900`,
                  !isActive && `text-gray-700`,
                ])}
                href={`#${id}`}
              >
                {title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
