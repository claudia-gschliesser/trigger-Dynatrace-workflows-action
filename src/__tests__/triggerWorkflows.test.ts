import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { InputProps, OAuth2Response, generateBearerToken, getInputs, triggerWorkflow, validateInputs } from '../helper';
import { run } from '..';

jest.mock('@actions/core', () => ({
  __esModule: true,
  getInput: jest.fn(),
  getMultilineInput: jest.fn(),
  info: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
}));

let inputs: InputProps = {
  clientId: '',
  clientSecret: '',
  tenant: 'abc',
  endpoint: 'test.apps.com',
  workflowId: 'id-235-13',
  payload: ['{', '"input": {', '"test_msg": "hello world"', '},', '"params": {},', '"uniqueQualifier": ""', '}'],
};

enableFetchMocks();
describe('trigger Dynatrace workflows', () => {
  const { getInput, getMultilineInput, setOutput, setFailed } = require('@actions/core');
  getInput.mockImplementation((name: string) => {
    switch (name) {
      case 'client_id':
        return inputs.clientId;
      case 'client_secret':
        return inputs.clientSecret;
      case 'tenant':
        return inputs.tenant;
      case 'endpoint':
        return inputs.endpoint;
      case 'workflow_id':
        return inputs.workflowId;
      case 'payload':
        return inputs.payload;
      default:
        return '';
    }
  });

  getMultilineInput.mockImplementation((name: string) => {
    if (name === 'payload') {
      return inputs.payload;
    }
    return '';
  });

  setOutput.mockImplementation((name: string, data: any) => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data);
  });

  setFailed.mockImplementation((msg: string) => {
    throw new Error(msg);
  });

  beforeEach(() => {
    fetchMock.mockClear();
    getInput.mockClear();
    setOutput.mockClear();
    inputs = {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      tenant: 'abc',
      endpoint: 'test.apps.com',
      workflowId: 'id-235-13',
      payload: ['{', '"input": {', '"test_msg": "hello world"', '},', '"params": {},', '"uniqueQualifier": ""', '}'],
    };
  });
  it('given no client id, throws error', () => {
    inputs.clientId = '';
    const receivedInputs = getInputs();
    expect(() => validateInputs(receivedInputs)).toThrow('clientId is undefined.');
  });
  it('given no client secret, throws error', () => {
    inputs.clientSecret = '';
    const receivedInputs = getInputs();
    expect(() => validateInputs(receivedInputs)).toThrow('clientSecret is undefined.');
  });
  it('given no tenant, throws error', () => {
    inputs.tenant = '';
    const receivedInputs = getInputs();
    expect(() => validateInputs(receivedInputs)).toThrow('tenant is undefined.');
  });
  it('given no workflowId, throws error', () => {
    inputs.workflowId = '';
    const receivedInputs = getInputs();
    expect(() => validateInputs(receivedInputs)).toThrow('workflowId is undefined.');
  });
  it('given valid inputs, sets them', () => {
    const receivedInputs = getInputs();
    expect(receivedInputs.clientId).toStrictEqual('client-id');
    expect(receivedInputs.clientSecret).toStrictEqual('client-secret');
    expect(receivedInputs.tenant).toStrictEqual('abc');
    expect(receivedInputs.endpoint).toStrictEqual('test.apps.com');
    expect(receivedInputs.workflowId).toStrictEqual('id-235-13');
    expect(receivedInputs.payload).toStrictEqual([
      '{',
      '"input": {',
      '"test_msg": "hello world"',
      '},',
      '"params": {},',
      '"uniqueQualifier": ""',
      '}',
    ]);
  });
  it('given valid inputs, returns OAuth credentials', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ scope: 'some-scope', token_type: 'Bearer', expires_in: 300, access_token: 'jwt-token-1234' }),
      { status: 200 },
    );
    const response = await generateBearerToken(inputs.endpoint, inputs.clientId, inputs.clientSecret);
    expect(fetchMock).toHaveBeenCalled();
    expect(response).toStrictEqual({
      scope: 'some-scope',
      token_type: 'Bearer',
      expires_in: 300,
      access_token: 'jwt-token-1234',
    });
  });

  it('given valid bearer token and payload, triggers workflow', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ dt_workflow_triggered: true }));
    const response = await triggerWorkflow(inputs, 'jwt-token-1234');
    expect(fetchMock).toHaveBeenCalledWith('https://abc.test.apps.com/platform/automation/v1/workflows/id-235-13/run', {
      body: '{"input":{"test_msg":"hello world"},"params":{},"uniqueQualifier":""}',
      headers: { 'Authorization': 'Bearer jwt-token-1234', 'Content-Type': 'application/json' },
      method: 'POST',
    });
  });
  it('given valid inputs, runs successfully', async () => {
    fetchMock.mockResponses(
      [
        JSON.stringify({ scope: 'some-scope', token_type: 'Bearer', expires_in: 300, access_token: 'jwt-token-1234' }),
        { status: 200 },
      ],
      [JSON.stringify({ dt_workflow_triggered: true }), { status: 200 }],
    );
    expect(() => run()).not.toThrow();
  });
});
