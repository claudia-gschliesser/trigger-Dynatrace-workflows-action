# Trigger Dynatrace Workflows

This action triggers a Dynatrace workflow by making use of your OAuth2 Client.

- uses Node 20
- logs every step
- returns the response body received after triggering the workflow

# Usage

<!-- start usage -->

```yaml
- uses: danielp-dt/trigger-Dynatrace-workflows-action@v1.0.0
  with:
    # ID of your OAuth2 client
    # Required to run the action.
    client_id: ''

    # Secret of your OAuth2 client
    # Required to run the action.
    client_secret: ''

    # Tenant where the workflow is located.
    # Required to run the action.
    # Example: `tenant: 'vzx38435'`
    tenant: ''

    # Endpoint to decide in which environment the workflow is.
    # Default: 'https://sso.dynatrace.com'
    endpoint: ''

    # ID of the workflow that will be triggered.
    # Required to run the action.
    workflow_id: ''

    # Payload that will be used for the request.
    # Here you can pass all the parameters you want to use inside the workflow.
    # The payload has to be a JSON encoded string.
    # Default:
    # payload: |
    #    {
    #        "input": {},
    #        "params": {},
    #        "uniqueQualifier": ""
    #    }
    payload: ''
```

<!-- end usage -->
