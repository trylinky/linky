'use server';

import { captureException } from '@sentry/nextjs';
import { formatISO, sub } from 'date-fns';

export const fetchGithubData = async (githubUsername: string) => {
  const currentDate = new Date();
  const oneMonthAgo = formatISO(
    sub(currentDate, {
      months: 1,
    })
  );

  const twoMonthsAgo = formatISO(
    sub(currentDate, {
      months: 2,
    })
  );

  try {
    const res = await fetch('https://api.github.com/graphql', {
      next: {
        revalidate: 3600,
      },
      method: 'POST',
      body: JSON.stringify({
        query: `query {
            user(login: "${githubUsername}") {
              name
              thisMonth: contributionsCollection(from: "${oneMonthAgo}", to: "${formatISO(
                currentDate
              )}") {
                totalCommitContributions
              }
              previousMonth: contributionsCollection(from: "${twoMonthsAgo}", to: "${oneMonthAgo}") {
                totalCommitContributions
              }
            }
          }`,
      }),
      headers: {
        Authorization: `bearer ${process.env.GITHUB_AUTH_TOKEN}`,
      },
    });

    const data = await res.json();

    return data.data;
  } catch (error) {
    captureException(error);
    return null;
  }
};
