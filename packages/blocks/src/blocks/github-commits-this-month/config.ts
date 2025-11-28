import * as Yup from 'yup';

export interface GithubCommitsThisMonthBlockConfig {
  githubUsername: string;
}

export const githubCommitsThisMonthBlockDefaults: GithubCommitsThisMonthBlockConfig =
  {
    githubUsername: 'gaearon',
  };

export const GithubCommitsThisMonthSchema = Yup.object().shape({
  githubUsername: Yup.string().required('Please provide a GitHub username'),
});
