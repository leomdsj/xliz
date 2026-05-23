import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { createJob, getJobById, getJobResults } from './routes/jobs';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { routeKey, pathParameters, body } = event;

  try {
    switch (routeKey) {
      case 'POST /jobs':
        return createJob(body ? JSON.parse(body) : {});

      case 'GET /jobs/{job_id}':
        return getJobById(pathParameters?.job_id ?? '');

      case 'GET /jobs/{job_id}/results':
        return getJobResults(pathParameters?.job_id ?? '');

      default:
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Route not found' }),
        };
    }
  } catch (err) {
    console.error('Unhandled error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
