import { getInput } from '@actions/core';
import { Inputs, Outputs } from './constants';
import { setOutput } from '@actions/core';

interface OAuth2Response {
  scope: string;
  token_type: string;
  expires_in: number;
  access_token: string;
}

interface InputProps {
  clientId: string;
  clientSecret: string;
  tenant: string;
  endpoint: string;
  workflowId: string;
  payload?: string;
}

const getDtEndpoint = (endpoint: string): string => {
  if (endpoint.includes('dev.apps.dynatracelabs.com')) {
    return 'https://sso-dev.dynatracelabs.com';
  } else if (endpoint.includes('sprint.apps.dynatracelabs.com')) {
    return 'https://sso-sprint.dynatracelabs.com';
  }
  return 'https://sso.dynatrace.com';
};

export const getInputs = (): InputProps => {
  return {
    clientId: getInput(Inputs.clientId, { trimWhitespace: false }),
    clientSecret: getInput(Inputs.clientSecret, { trimWhitespace: false }),
    tenant: getInput(Inputs.tenant, { trimWhitespace: false }),
    endpoint: getInput(Inputs.endpoint, { trimWhitespace: false }),
    workflowId: getInput(Inputs.workflowId, { trimWhitespace: false }),
    payload: getInput(Inputs.payload, { trimWhitespace: false }),
  };
};

export const validateInputs = (inputs: InputProps) => {
  if (!inputs.clientId) {
    throw new Error('clientId is undefined.');
  }
  if (!inputs.clientSecret) {
    throw new Error('clientSecret is undefined.');
  }
  if (!inputs.tenant) {
    throw new Error('tenant is undefined.');
  }
  if (!inputs.endpoint) {
    throw new Error('endpoint is undefined.');
  }
  if (!inputs.workflowId) {
    throw new Error('workflowId is undefined.');
  }
};

export const generateBearerToken = async (
  endpoint: string,
  clientId: string,
  clientSecret: string,
): Promise<OAuth2Response> => {
  const request = await fetch(`${getDtEndpoint(endpoint)}/sso/oauth2/token/`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'automation:workflows:run',
    }),
    method: 'POST',
  });

  const response = await request.json();

  if (!request.ok) {
    throw new Error(`Get bearer token error: ${JSON.stringify(response)}`);
  }

  return {
    scope: response.scope,
    token_type: response.token_type,
    expires_in: response.expires_in,
    access_token: response.access_token,
  };
};

export const triggerWorkflow = async (inputs: InputProps, accessToken: string): Promise<void> => {
  const payload = inputs.payload;
  payload!.replace(payload!.charAt(0), '');
  payload!.replace(payload!.charAt(payload!.length), '');

  const request = await fetch(
    `https://${inputs.tenant}.${inputs.endpoint}/platform/automation/v1/workflows/${inputs.workflowId}/run`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: inputs.payload,
      method: 'POST',
    },
  );
  const response = await request.json();
  if (!request.ok) {
    throw new Error(
      `Triggering workflow error: ${JSON.stringify(response)}\npayload: ${
        inputs.payload
      }\npayload stringified: ${JSON.stringify(inputs.payload)}\npayload parse-stringified: ${JSON.parse(
        JSON.stringify(inputs.payload),
      )}`,
    );
  }
  setOutput(Outputs.responseBody, response);
};
