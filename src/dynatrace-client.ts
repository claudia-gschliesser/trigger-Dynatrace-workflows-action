import { InputProps, getDtEndpoint } from './input-validation';

export interface OAuth2Response {
  scope: string;
  token_type: string;
  expires_in: number;
  access_token: string;
}

interface RequestProps {
  headers: HeadersInit;
  method: string;
  requestUrl: string;
  jsonBody?: string;
}

export class DynatraceClient {
  public generateBearerToken = async (
    endpoint: string,
    clientId: string,
    clientSecret: string,
  ): Promise<OAuth2Response> => {
    const response = await this.makeRequest({
      requestUrl: `${getDtEndpoint(endpoint)}/sso/oauth2/token/`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      jsonBody: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'automation:workflows:run',
      }),
    });

    return {
      scope: response.scope,
      token_type: response.token_type,
      expires_in: response.expires_in,
      access_token: response.access_token,
    };
  };

  public triggerWorkflow = async (inputs: InputProps, accessToken: string): Promise<any> => {
    const payloadString = inputs.payload.join('\n');
    const payloadObject = JSON.parse(payloadString);

    const response = await this.makeRequest({
      requestUrl: `https://${inputs.tenant}.${inputs.endpoint}/platform/automation/v1/workflows/${inputs.workflowId}/run`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      jsonBody: JSON.stringify(payloadObject),
    });

    return await response;
  };

  private makeRequest = async (props: RequestProps): Promise<any> => {
    let requestBody: {};

    if (props.jsonBody === undefined) {
      requestBody = {
        method: props.method,
        headers: props.headers,
      };
    } else {
      requestBody = {
        method: props.method,
        headers: props.headers,
        body: props.jsonBody,
      };
    }

    const request = await fetch(props.requestUrl, requestBody);
    const response = await request.json();

    if (!request.ok) {
      throw new Error(JSON.stringify(response));
    }

    return response;
  };
}
