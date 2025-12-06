'use client';

import styles from './marketing-navigation.module.css';
import { useIsLoggedIn } from '@/hooks/use-is-logged-in';
import { Dialog } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import {
  Bars3Icon,
  XMarkIcon,
  PhotoIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@trylinky/ui';
import Link from 'next/link';
import { ReactNode, useState } from 'react';

interface Props {
  children: ReactNode;
}

export default function MarketingNavigation({ children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoggedIn = useIsLoggedIn();

  return (
    <>
      <header className="fixed top-4 w-full z-10">
        <div className="max-w-xl mx-auto px-4">
          <nav
            className={cn(
              'flex items-center justify-between gap-x-6 rounded-full bg-white backdrop-blur-sm py-2 px-3',
              styles.navigation
            )}
          >
            <div className="flex lg:flex-1">
              <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <FaceSmileIcon className="w-6 h-6 text-indigo-600" />
                <span className="font-bold text-sm">Kiko</span>
              </a>
            </div>
            <div className="flex flex-1 items-center justify-end gap-x-1">
              <Button asChild variant="ghost" className="hidden sm:flex">
                <Link href="/i/pricing">Preise</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden sm:flex">
                    Ressourcen <ChevronDownIcon className="w-5 h-5 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-96 rounded-2xl">
                  <DropdownMenuItem asChild className="items-start rounded-2xl">
                    <Link
                      href="/i/explore"
                      className="grid grid-cols-[40px_1fr] items-start"
                    >
                      <PhotoIcon className="w-5 h-5 mt-1" />
                      <div className="flex flex-col">
                        <span className="text-base font-semibold font-serf">
                          Entdecken
                        </span>
                        <span className="text-sm text-black/60">
                          Einige der besten Seiten der Kiko-Community.
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isLoggedIn ? (
                <Button asChild variant="ghost" className="hidden sm:flex">
                  <a href="/edit">Dashboard →</a>
                </Button>
              ) : (
                children
              )}
              <button
                type="button"
                className="-m-2.5 inline-flex sm:hidden items-center justify-center rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>
        <Dialog
          as="div"
          className="lg:hidden"
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
        >
          <div className="fixed inset-0 z-10" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-4 py-4 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center gap-x-3">
              <Link
                href="/"
                className="-m-1.5 p-1.5 flex items-center gap-2 flex-1"
              >
                <FaceSmileIcon className="w-6 h-6 text-indigo-600" />
                <span className="font-medium">Kiko</span>
              </Link>
              {children}

              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="py-6">
                  <Link
                    href="/i/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Preise
                  </Link>
                  <Link
                    href="/i/explore"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Entdecken
                  </Link>
                  <Link
                    href="https://x.com/trylinky"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Twitter / X
                  </Link>
                  <Link
                    href="https://github.com/trylinky/linky"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                     GitHub
                  </Link>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>
    </>
  );
}
