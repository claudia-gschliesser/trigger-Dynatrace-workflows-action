import { generateBearerToken, getInputs, triggerWorkflow, validateInputs } from './helper';
import { setFailed } from '@actions/core';

const run = async (): Promise<void> => {
  try {
    const inputs = getInputs();
    validateInputs(inputs);
    const tokenData = await generateBearerToken(inputs.endpoint, inputs.clientId, inputs.clientSecret);
    triggerWorkflow(inputs, tokenData.access_token);
  } catch (e) {
    setFailed(e.message);
  }
};

run();
