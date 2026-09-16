import { sendSlackMessage } from './service';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sendSlackMessage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('posts to chat.postMessage with a bearer token', async () => {
    vi.stubEnv('SLACK_TOKEN', 'xoxb-test');
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify({ ok: true, ts: '1.2' }))
    );
    vi.stubGlobal('fetch', fetchMock);

    await sendSlackMessage({ text: 'hello' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://slack.com/api/chat.postMessage',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer xoxb-test',
        }),
      })
    );
    expect(
      JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)
    ).toMatchObject({
      channel: 'C08GWNF2MHV',
      text: 'hello',
    });
  });

  it('swallows a Slack API error rather than failing the caller', async () => {
    vi.stubEnv('SLACK_TOKEN', 'xoxb-test');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify({ ok: false, error: 'nope' }))
      )
    );

    // Slack notifications are incidental; a failure must never break signup.
    await expect(sendSlackMessage({ text: 'hello' })).resolves.toBeUndefined();
  });
});
