import { getInput, getMultilineInput } from '@actions/core';
import { Inputs, Outputs } from './constants';
import { setOutput, info } from '@actions/core';

export interface OAuth2Response {
  scope: string;
  token_type: string;
  expires_in: number;
  access_token: string;
}

export interface InputProps {
  clientId: string;
  clientSecret: string;
  tenant: string;
  endpoint: string;
  workflowId: string;
  payload: string[];
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
    payload: getMultilineInput(Inputs.payload),
  };
};

export const validateInputs = (inputs: InputProps) => {
  info(`Validating inputs...`);

  if (!inputs.clientId) {
    throw new Error('clientId is undefined.');
  }
  if (!inputs.clientSecret) {
    throw new Error('clientSecret is undefined.');
  }
  if (!inputs.tenant) {
    throw new Error('tenant is undefined.');
  }
  if (!inputs.workflowId) {
    throw new Error('workflowId is undefined.');
  }
  info(`Inputs are valid.`);
};

export const generateBearerToken = async (
  endpoint: string,
  clientId: string,
  clientSecret: string,
): Promise<OAuth2Response> => {
  info(`Generating access token...`);
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

  info(`Access token successfully generated.`);
  return {
    scope: response.scope,
    token_type: response.token_type,
    expires_in: response.expires_in,
    access_token: response.access_token,
  };
};

export const triggerWorkflow = async (inputs: InputProps, accessToken: string): Promise<void> => {
  const payloadString = inputs.payload.join('\n');
  const payloadObject = JSON.parse(payloadString);
  info(`Triggering Dynatrace workflow...`);

  const request = await fetch(
    `https://${inputs.tenant}.${inputs.endpoint}/platform/automation/v1/workflows/${inputs.workflowId}/run`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadObject),
      method: 'POST',
    },
  );
  const response = await request.json();
  if (!request.ok) {
    throw new Error(
      `Triggering workflow error: ${JSON.stringify(response)}\n
      payload: ${JSON.stringify(payloadObject)}`,
    );
  }
  info(`Workflow successfully triggered.`);
  setOutput(Outputs.responseBody, response);
};
