import { MarketingContainer } from '@/components/marketing-container';
import Link from 'next/link';

const BrandLogo = () => {
  return (
    <svg viewBox="0 0 321 321" width={20} height={20} fill="none">
      <path
        fill="#fff"
        d="M274.378 238.093c-5.317-1.294-9.643-2.294-15.133-.863 4.97 10.285 16.184 15.791 19.854 27.397-6.04 4.376-11.93 9.021-18.212 13.056-3.82 2.453-7.051-.443-9.629-2.957-16.22-15.814-32.313-31.76-48.464-47.645-4.872-4.793-3.234-8.289.77-13.301 9.452-11.834 19.807-16.768 35.501-12.938 20.746 5.063 42.184 7.223 63.11 11.646 12.161 2.57 12.144 5.498 4.462 15.158-8.402 10.564-18.83 13.018-32.259 10.447ZM256.64 122.137c16.457-11.519 31.325-23.9429 48.749-32.2715 18.235 28.4345-6.623 37.8945-24.382 53.5475 11.681 0 19.657-.317 27.597.09 7.856.403 12.585 8.04 11.212 16.275-1.202 7.205 1.862 13.824-11.702 13.54-23.025-.482-46.038 1.936-69.101.256-6.983-.508-9.661-3.031-10.418-10.17-1.456-13.748 1.684-24.56 14.544-31.554 4.581-2.492 8.564-6.082 13.501-9.713ZM166.97 319.516c-4.997.645-9.028.836-13.056 1.058-8.656.476-12.677-3.687-12.659-12.275.048-22.641.079-45.284-.083-67.925-.053-7.372 3.462-9.148 10.419-9.853 14.259-1.446 24.321 2.64 32.304 15.329 10.956 17.413 23.976 33.513 35.644 50.497 8.06 11.733 5.621 15.677-8.817 17.241-9.764 1.058-17.229-1.333-22.714-10.079-4.035-6.435-9.22-12.148-14.488-18.952-4.697 11.776 2.206 24.401-6.55 34.959ZM261.404 75.9306c-12.074 12.0203-23.605 23.363-34.994 34.8474-5.405 5.451-8.993 5.972-15.884.148-12.089-10.217-15.184-20.9447-11.443-36.0537 4.16-16.8019 5.799-34.2144 8.984-51.2776 1.123-6.0142 1.372-14.55294 10.861-12.765 8.767 1.6517 17.614 4.7972 18.139 16.2726.44 9.6238-3.744 18.9258-2.054 30.2879 6.363-5.6708 11.961-10.6758 17.578-15.6603 4.803-4.263 18.153-5.6158 21.876 2.0378 2.786 5.7285 4.506 4.0077 3.786 10.9767-.76 7.3672-8.053 11.7168-12.846 17.108-1.073 1.2073-2.265 2.3089-4.003 4.0782ZM67.9827 225.02c9.0189-8.653 17.4275-16.701 26.1004-25.003 14.8409 11.361 26.0949 21.912 19.9789 42.728-4.857 16.53-5.55 34.244-8.954 51.26-1.082 5.413-.239 15.128-10.4942 12.598-8.7499-2.158-18.8278-4.141-18.8279-16.881-.0001-8.716 4.3381-17.241 1.1824-26.827-9.6432 3.644-14.2525 17.084-24.9745 14.97-6.6682-1.316-12.1598-8.596-19.1925-13.974 9.8794-15.239 23.1016-25.999 35.1814-38.871ZM9.82011 222.99c-17.3096-24.272 6.51729-33.41 24.18899-46.337-8.0677-1.297-16.137-2.973-20.6931-2.943-9.50487.061-14.70859-1.321-12.991193-13.621C2.4411 144.932 2.23828 143.294 17.8476 143.054c17.7949-.274 35.6058.287 53.3939-.156 10.0974-.251 12.6486 3.984 13.3158 13.695.9123 13.279-3.2979 21.953-14.4876 29.145-15.969 10.264-30.9521 22.053-46.5388 32.928-3.8039 2.654-7.5104 6.522-13.71079 4.324ZM140.611 29.1981c.355-5.9558.837-11.2154.564-16.4356-.483-9.22454 3.156-12.864232 12.756-12.7603027C170.95.186258 171.518.0563117 171.684 17.4964c.186 19.3659-.102 38.7365.119 58.1016.083 7.257-1.717 9.8587-10.097 10.7627-16.223 1.7497-26.351-4.2449-34.718-17.5995-9.621-15.3567-21.158-29.5-31.2331-44.5905-6.1814-9.2582-4.0884-11.3508 6.5581-14.63792 12.713-3.92508 20.564.75942 27.494 10.71012 2.66 3.8201 4.034 9.8248 10.804 8.9552ZM66.5748 48.1218c14.1484 13.9315 27.5747 27.4046 41.1922 40.6815 5.513 5.3747 5.941 8.5622.303 15.6887-10.8346 13.693-22.789 14.785-38.2272 11.101-16.0584-3.833-32.7064-5.13-48.9356-8.348-5.5757-1.105-14.44328.213-14.31874-9.3687.12839-9.871 10.74244-20.4889 19.36684-19.8094 8.7969.6931 17.5302 2.1935 27.269 3.4683-2.223-9.7435-14.4668-13.2569-15.7476-24.5844 5.4968-5.2732 11.9725-22.0953 29.0981-8.829Z"
      />
    </svg>
  );
};

const XTwitterLogo = () => {
  return (
    <svg
      width="300"
      height="300"
      viewBox="0 0 300 300"
      className="p-px h-4 w-4 text-white/80 transition-colors group-hover:text-white"
    >
      <path
        fill="currentColor"
        d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
      />
    </svg>
  );
};

const GithubLogo = () => {
  return (
    <svg
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 24 24"
      className="h-4 w-4 text-white/80 transition-colors group-hover:text-white"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
    </svg>
  );
};

const InstagramLogo = () => {
  return (
    <svg
      fill="currentColor"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      className="h-4 w-4 text-white/80 transition-colors group-hover:text-white"
    >
      <path
        fillRule="evenodd"
        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const socialLinks = [
  {
    label: 'X / Twitter',
    href: 'https://x.com/trylinky',
    icon: XTwitterLogo,
  },
  {
    label: 'Github',
    href: 'https://github.com/trylinky/linky',
    icon: GithubLogo,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/trylinky',
    icon: InstagramLogo,
  },
];

export default function MarketingFooter() {
  return (
    <footer className="relative bg-gradient-to-b from-[#19191a] via-[#181817] to-[#131313] pt-0 text-white overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-72 w-96 -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#fff2] via-[#fff1] to-transparent blur-2xl opacity-40" />

      <div className="relative z-10 flex flex-col items-center justify-center py-16 space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <span className="scale-150 drop-shadow-lg">
            <BrandLogo />
          </span>
          <span className="font-extrabold text-3xl tracking-tight text-white drop-shadow">
            Linky
          </span>
        </div>
        <p className="max-w-xl text-center text-lg text-white/80 font-medium">
          The ultimate link-in-bio platform for creators. <br />
          <span className="text-white/60">
            Delightfully simple, delightfully fast.
          </span>
        </p>
        <Link
          href="/i/auth/signup"
          className="mt-2 rounded-full bg-gradient-to-r from-[#fff] to-[#eaeaea] px-8 py-3 text-base font-bold text-gray-900 shadow-lg transition-all hover:scale-105 hover:from-[#f3f3f3] hover:to-[#fff] focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          Get Started Free
        </Link>
      </div>
      <div className="relative z-10 border-t border-white/10 bg-transparent">
        <MarketingContainer>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-10 gap-10 lg:gap-0">
            <nav className="flex-1 flex flex-col items-center lg:items-start gap-6 lg:gap-2">
              <ul className="flex flex-col lg:flex-row gap-6 lg:gap-10 text-base font-medium">
                <li>
                  <Link
                    href="/"
                    className="transition-colors hover:text-white/90"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/i/pricing"
                    className="transition-colors hover:text-white/90"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/i/auth/signup"
                    className="transition-colors hover:text-white/90"
                  >
                    Get started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/i/learn/what-is-a-link-in-bio"
                    className="transition-colors hover:text-white/90"
                  >
                    What is a link in bio?
                  </Link>
                </li>
                <li>
                  <Link
                    href="/i/learn/what-is-linky"
                    className="transition-colors hover:text-white/90"
                  >
                    What is Linky?
                  </Link>
                </li>
                <li>
                  <Link
                    href="/i/blog"
                    className="transition-colors hover:text-white/90"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/i/terms"
                    className="transition-colors hover:text-white/90"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/i/privacy"
                    className="transition-colors hover:text-white/90"
                  >
                    Privacy
                  </Link>
                </li>
              </ul>
            </nav>
            {/* Social icons */}
            <div className="flex flex-col items-center gap-4 mt-8 lg:mt-0">
              <div className="flex items-center gap-4 rounded-full bg-white/10 px-6 py-2 shadow-inner backdrop-blur-md">
                {socialLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-full p-2 transition-all hover:bg-white/20 hover:scale-110"
                  >
                    <span className="sr-only">{link.label}</span>
                    {link.icon()}
                  </Link>
                ))}
              </div>
              <span className="text-xs text-white/40 mt-2">
                © 2023 - {new Date().getFullYear()} Linky – Hyperdusk Ltd
              </span>
            </div>
          </div>
        </MarketingContainer>
      </div>
    </footer>
  );
}
