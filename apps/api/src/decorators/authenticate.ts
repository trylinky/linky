import fastify from '@/index';
import { auth } from '@/lib/auth';
import { HttpError } from '@fastify/sensible';
import { captureException } from '@sentry/node';
import { fromNodeHeaders } from 'better-auth/node';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function authenticateDecorator(
  request: FastifyRequest,
  reply: FastifyReply,
  options: {
    throwError?: boolean;
  } = {
    throwError: true,
  }
): Promise<
  | {
      user: { id: string };
      activeOrganizationId: string;
    }
  | HttpError
  | null
> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    const user = session?.user;

    if (!user) {
      if (options.throwError) {
        throw fastify.httpErrors.unauthorized();
      } else {
        return null;
      }
    }

    return {
      user: {
        id: user.id,
      },
      activeOrganizationId:
        (session as any).session?.activeOrganizationId || '',
    };
  } catch (error) {
    captureException(error);
    if (options.throwError) {
      throw fastify.httpErrors.unauthorized();
    } else {
      return null;
    }
  }
}
