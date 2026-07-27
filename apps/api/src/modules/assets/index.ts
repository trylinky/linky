'use strict';

import { canUploadAsset } from '@/modules/assets/authorization';
import { assetContexts } from '@/modules/assets/constants';
import { uploadAsset } from '@/modules/assets/service';
import { isObjKey } from '@/modules/assets/utils';
import { MultipartFile, MultipartValue } from '@fastify/multipart';
import { FastifyInstance, FastifyReply } from 'fastify';
import { FastifyRequest } from 'fastify';

export default async function assetsRoutes(fastify: FastifyInstance) {
  fastify.post('/upload', postUploadAssetHandler);
}

async function postUploadAssetHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const data = await request.file();

  if (!data) {
    return response.status(400).send({
      error: {
        message: 'No file uploaded',
      },
    });
  }

  const referenceIdField = data.fields.referenceId as MultipartValue<string>;
  const contextField = data.fields.assetContext as MultipartValue<string>;
  const referenceId = referenceIdField?.value;
  const context = contextField?.value;

  if (!referenceId) {
    return response.status(400).send({
      error: {
        message: 'Missing referenceId field',
      },
    });
  }

  if (!isObjKey(context, assetContexts)) {
    return response.status(400).send({
      error: {
        message: 'Invalid asset context',
      },
    });
  }

  // referenceId chooses the S3 key prefix, so it has to be something the
  // caller actually owns.
  const isAllowed = await canUploadAsset({
    context,
    referenceId,
    userId: session.user.id,
    organizationId: session.activeOrganizationId,
  });

  if (!isAllowed) {
    return response.status(403).send({
      error: {
        message: 'You do not have access to upload against this reference',
      },
    });
  }

  // Create a MultipartFile object from the file data
  const multipartFile: MultipartFile = {
    type: 'file',
    fieldname: data.fieldname,
    filename: data.filename,
    encoding: data.encoding,
    mimetype: data.mimetype,
    file: data.file,
    fields: data.fields,
    toBuffer: async () => {
      const chunks = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    },
  };

  const uploadResult = await uploadAsset({
    context,
    multipartFile,
    referenceId,
  });

  if (uploadResult?.error) {
    return response.status(500).send({
      error: uploadResult.error,
    });
  }

  if (!uploadResult.data) {
    return response.status(500).send({
      error: {
        message: 'Failed to upload asset',
      },
    });
  }

  return response.status(200).send({
    message: 'success',
    url: uploadResult.data.url,
  });
}
