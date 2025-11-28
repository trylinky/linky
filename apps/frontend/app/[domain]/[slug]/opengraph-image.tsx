/* eslint-disable @next/next/no-img-element */
import { hslToHex } from '@/lib/theme';
import { ImageResponse } from 'next/og';
import { CSSProperties } from 'react';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const { data, error } = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/pages/${params.slug}/opengraph-image`
  ).then((res) => res.json());

  if (!data || error) {
    return new Response('Page not found', { status: 404 });
  }

  const {
    theme,
    headerTitle,
    headerDescription,
    avatarSrc,
    verifiedPageTitle,
  } = data;

  // Font
  const saansHeavy = fetch(
    new URL('../../SaansHeavy.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

  const saansRegular = fetch(
    new URL('../../SaansRegular.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 96,
          background: hslToHex({
            h: theme?.colorBgBase.h,
            s: theme?.colorBgBase.s * 100,
            l: theme?.colorBgBase.l * 100,
          }),
          color: hslToHex({
            h: theme?.colorLabelPrimary.h,
            s: theme?.colorLabelPrimary.s * 100,
            l: theme?.colorLabelPrimary.l * 100,
          }),
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            paddingLeft: 80,
            paddingRight: 80,
          }}
        >
          {avatarSrc && (
            <img
              src={avatarSrc}
              alt=""
              width={100}
              height={100}
              style={{
                borderRadius: '50%',
                marginBottom: 20,
              }}
            />
          )}
          <h1
            style={{
              fontSize: 88,
              margin: 0,
              marginBottom: 10,
            }}
          >
            {verifiedPageTitle ? (
              <>
                {verifiedPageTitle}
                <VerifiedBadge />
              </>
            ) : (
              headerTitle
            )}
          </h1>
          <span
            style={{
              fontSize: 40,
              fontFamily: 'SaansRegular',
              color: hslToHex({
                h: theme?.colorLabelSecondary.h,
                s: theme?.colorLabelSecondary.s * 100,
                l: theme?.colorLabelSecondary.l * 100,
              }),
            }}
          >
            {headerDescription}
          </span>
        </div>
        <LinkyLogo
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'SaansHeavy',
          data: await saansHeavy,
          style: 'normal',
          weight: 800,
        },
        {
          name: 'SaansRegular',
          data: await saansRegular,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}

const LinkyLogo = ({ style }: { style: CSSProperties }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={68}
      height={68}
      viewBox="0 0 503 503"
      fill="none"
      style={style}
    >
      <rect width="503" height="503" fill="#070708" rx="92" />
      <path
        fill="url(#a)"
        d="M351.633 317.737c-4.527-1.102-8.211-1.953-12.886-.735 4.233 8.757 13.781 13.446 16.906 23.329-5.142 3.726-10.158 7.681-15.507 11.116-3.253 2.089-6.004-.377-8.199-2.517-13.812-13.466-27.515-27.044-41.268-40.57-4.149-4.081-2.753-7.058.656-11.326 8.049-10.076 16.866-14.278 30.229-11.017 17.666 4.311 35.92 6.151 53.738 9.917 10.355 2.188 10.341 4.682 3.8 12.907-7.154 8.995-16.034 11.084-27.469 8.896Z"
      />
      <path
        fill="url(#b)"
        d="M336.529 219c14.013-9.809 26.674-20.388 41.51-27.48 15.528 24.212-5.639 32.268-20.761 45.596 9.946 0 16.738-.27 23.499.077 6.689.343 10.716 6.846 9.547 13.858-1.023 6.135 1.586 11.771-9.965 11.529-19.605-.41-39.201 1.649-58.839.219-5.946-.433-8.227-2.582-8.871-8.66-1.24-11.707 1.434-20.913 12.385-26.869 3.9-2.121 7.291-5.178 11.495-8.27Z"
      />
      <path
        fill="url(#c)"
        d="M260.176 387.068c-4.256.549-7.688.712-11.118.901-7.371.405-10.795-3.139-10.779-10.452.04-19.279.067-38.559-.071-57.838-.045-6.278 2.948-7.79 8.872-8.39 12.142-1.231 20.709 2.248 27.507 13.052 9.329 14.827 20.416 28.537 30.35 42.999 6.864 9.991 4.787 13.349-7.506 14.681-8.315.9-14.671-1.135-19.341-8.583-3.437-5.479-7.852-10.344-12.338-16.137-3.999 10.027 1.879 20.777-5.576 29.767Z"
      />
      <path
        fill="url(#d)"
        d="M340.586 179.654c-10.281 10.236-20.1 19.894-29.798 29.673-4.602 4.641-7.657 5.086-13.525.126-10.294-8.699-12.929-17.834-9.744-30.7 3.542-14.306 4.939-29.133 7.65-43.663.956-5.121 1.168-12.391 9.249-10.869 7.465 1.406 14.998 4.085 15.445 13.856.375 8.195-3.188 16.115-1.749 25.79 5.418-4.828 10.185-9.09 14.967-13.334 4.091-3.63 15.458-4.782 18.628 1.735 2.372 4.878 3.837 3.412 3.224 9.346-.647 6.274-6.857 9.977-10.938 14.568-.914 1.028-1.929 1.966-3.409 3.472Z"
      />
      <path
        fill="url(#e)"
        d="M175.887 306.604c7.68-7.367 14.84-14.221 22.225-21.289 12.637 9.673 22.22 18.657 17.012 36.383-4.135 14.074-4.726 29.158-7.624 43.648-.922 4.608-.204 12.881-8.936 10.727-7.451-1.838-16.032-3.526-16.032-14.375 0-7.422 3.694-14.681 1.007-22.843-8.212 3.103-12.136 14.547-21.266 12.747-5.678-1.12-10.354-7.319-16.343-11.898 8.413-12.977 19.671-22.139 29.957-33.1Z"
      />
      <path
        fill="url(#f)"
        d="M126.362 304.876c-14.739-20.667 5.549-28.449 20.597-39.456-6.87-1.104-13.741-2.531-17.62-2.506-8.094.053-12.525-1.124-11.062-11.598 1.802-12.906 1.629-14.301 14.92-14.505 15.153-.233 30.319.244 45.465-.133 8.598-.214 10.771 3.392 11.339 11.662.776 11.307-2.809 18.692-12.337 24.816-13.597 8.741-26.355 18.778-39.627 28.039-3.239 2.26-6.396 5.553-11.675 3.681Z"
      />
      <path
        fill="url(#g)"
        d="M237.73 139.862c.303-5.071.713-9.55.481-13.995-.411-7.855 2.687-10.954 10.862-10.865 14.491.156 14.975.046 15.117 14.896.157 16.49-.088 32.984.1 49.474.071 6.179-1.461 8.394-8.597 9.164-13.814 1.49-22.438-3.614-29.563-14.986-8.192-13.076-18.015-25.119-26.595-37.969-5.263-7.883-3.481-9.665 5.585-12.464 10.825-3.342 17.51.647 23.411 9.12 2.265 3.253 3.435 8.366 9.199 7.625Z"
      />
      <path
        fill="url(#h)"
        d="M174.688 155.976c12.048 11.862 23.48 23.335 35.076 34.64 4.694 4.577 5.059 7.291.257 13.359-9.225 11.659-19.404 12.59-32.55 9.452-13.674-3.263-27.849-4.367-41.669-7.107-4.747-.942-12.298.181-12.192-7.978.109-8.405 9.147-17.446 16.491-16.868 7.49.59 14.927 1.868 23.219 2.953-1.892-8.296-12.318-11.288-13.409-20.933 4.681-4.49 10.195-18.814 24.777-7.518Z"
      />
      <defs>
        <linearGradient
          id="a"
          x1="307.887"
          x2="342.753"
          y1="285.07"
          y2="364.584"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F3F3F3" />
          <stop offset="1" stop-color="#797979" />
        </linearGradient>
        <linearGradient
          id="b"
          x1="328.546"
          x2="372.106"
          y1="191.669"
          y2="267.892"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F3F3F3" />
          <stop offset="1" stop-color="#797979" />
        </linearGradient>
        <linearGradient
          id="c"
          x1="252.822"
          x2="303.161"
          y1="311.212"
          y2="385.464"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F3F3F3" />
          <stop offset="1" stop-color="#797979" />
        </linearGradient>
        <linearGradient
          id="d"
          x1="300.492"
          x2="361.697"
          y1="124.199"
          y2="200.296"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F3F3F3" />
          <stop offset="1" stop-color="#797979" />
        </linearGradient>
        <linearGradient
          id="e"
          x1="160.551"
          x2="223.19"
          y1="285.503"
          y2="363.567"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F3F3F3" />
          <stop offset="1" stop-color="#797979" />
        </linearGradient>
        <linearGradient
          id="f"
          x1="132.923"
          x2="175.423"
          y1="236.811"
          y2="308.445"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F3F3F3" />
          <stop offset="1" stop-color="#797979" />
        </linearGradient>
        <linearGradient
          id="g"
          x1="210.609"
          x2="258.887"
          y1="115.152"
          y2="186.343"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F3F3F3" />
          <stop offset="1" stop-color="#797979" />
        </linearGradient>
        <linearGradient
          id="h"
          x1="142.205"
          x2="174.936"
          y1="151.862"
          y2="226.605"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F3F3F3" />
          <stop offset="1" stop-color="#797979" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const VerifiedBadge = () => {
  return (
    <svg
      viewBox="0 0 22 22"
      width={56}
      height={56}
      style={{ marginLeft: 20, marginTop: 24 }}
    >
      <g>
        <path
          fill="#32a2ed"
          d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
        />
      </g>
    </svg>
  );
};
