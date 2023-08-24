import { getInput, getMultilineInput, info } from '@actions/core';
import { Inputs } from './constants';

export interface InputProps {
  clientId: string;
  clientSecret: string;
  tenant: string;
  endpoint: string;
  workflowId: string;
  payload: string[];
}

export const getDtEndpoint = (endpoint: string): string => {
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
