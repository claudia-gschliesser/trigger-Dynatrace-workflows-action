import { Outputs } from './constants';
import { info, setOutput, setFailed } from '@actions/core';
import { getInputs, validateInputs } from './input-validation';
import { DynatraceClient } from './dynatrace-client';

export const run = async (): Promise<void> => {
  try {
    const inputs = getInputs();
    validateInputs(inputs);

    const dynatraceClient = new DynatraceClient();

    info(`Generating access token...`);
    const tokenData = await dynatraceClient.generateBearerToken(inputs.endpoint, inputs.clientId, inputs.clientSecret);
    info(`Access token successfully generated.`);

    info(`Triggering Dynatrace workflow...`);
    const responseBody = await dynatraceClient.triggerWorkflow(inputs, tokenData.access_token);
    info(`Workflow successfully triggered.`);
    setOutput(Outputs.responseBody, responseBody);
  } catch (e) {
    setFailed(`Error: ${e.message}`);
  }
};

run();
