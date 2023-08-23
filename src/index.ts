import { generateBearerToken, getInputs, triggerWorkflow, validateInputs } from './helper';
import { setFailed } from '@actions/core';

export const run = async (): Promise<void> => {
  try {
    const inputs = getInputs();
    validateInputs(inputs);
    const tokenData = await generateBearerToken(inputs.endpoint, inputs.clientId, inputs.clientSecret);
    return await triggerWorkflow(inputs, tokenData.access_token);
  } catch (e) {
    setFailed(`Error: ${e.message}`);
  }
};

run();
