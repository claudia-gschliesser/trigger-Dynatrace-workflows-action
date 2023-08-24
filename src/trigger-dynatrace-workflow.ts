import { Outputs } from './constants';
import { info, setOutput, setFailed } from '@actions/core';
import { getInputs, validateInputs } from './input-validation';
import { DynatraceClient } from './dynatrace-client';

export const run = async (): Promise<void> => {
  try {
    const inputs = getInputs();
    validateInputs(inputs);

    const dynatraceClient = new DynatraceClient();

    info(`Triggering Dynatrace workflow...`);
    const responseBody = await dynatraceClient.triggerWorkflow(inputs);
    info(`Workflow successfully triggered.`);
    setOutput(Outputs.responseBody, responseBody);
  } catch (e) {
    setFailed(`Error: ${e.message}`);
  }
};

run();
