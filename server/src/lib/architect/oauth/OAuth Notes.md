# OAuth Configuration Notes

1. Add a comma-delimited list of provider names to environment variable `OAUTH_PROVIDERS`. For example, the following adds two providers to the arc staging environment:

```sh
arc env staging OAUTH_PROVIDERS 'GOOGLE,GITHUB'
```

NOTE: THe provider names can be any thing. THey are used is a postfix in subsequent steps:

2. Get a OAuth Client ID and OAuth Client Secret from the provider. Here are [instructions for Google](https://developers.google.com/identity/protocols/oauth2/openid-connect).
   Use the redirect url of `https://<API_GATEWAY_ID>.execute-api.<REGION>.amazonaws.com/<ENVIRONMENT?>/auth/redirection` like `https://o92pvgjal2.execute-api.us-west-2.amazonaws.com/staging/auth/redirection`

3. Add environment variable for Client ID:
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_CLIENT_ID` where\_<PROVIDER_NAME> ` is the name of the provider you used above.

```sh
arc env staging OAUTH_GOOGLE_CLIENT_ID '235329004997-qbmh6kacitf56jtscckadmvd0qu9sqi6.apps.googleusercontent.com'
```

4. Add environment variable for Client Secret
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_CLIENT_SECRET` where\_<PROVIDER_NAME> ` is the name of the provider you used above.

```sh
arc env staging OAUTH_GOOGLE_CLIENT_SECRET '3maj6RZcZ1UqcbRv2zV0I782'
```

5. Add environment variable for OAuth 2 [Authorization Endpoint](https://tools.ietf.org/html/rfc6749#section-3.1):
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_ENDPOINT_AUTH` where\_<PROVIDER_NAME> ` is the name of the provider you used above.

```sh
arc env staging OAUTH_GOOGLE_ENDPOINT_AUTH 'https://accounts.google.com/o/oauth2/v2/auth'
```

6. Add environment variable for OAuth 2 [Token Endpoint](https://tools.ietf.org/html/rfc6749#section-3.2):
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_ENDPOINT_TOKEN` where\_<PROVIDER_NAME> ` is the name of the provider you used above.

```sh
arc env staging OAUTH_GOOGLE_ENDPOINT_TOKEN 'https://github.com/login/oauth/access_token'
```

## Known OAuth 2 Provider Endpoints

### Google

- Docs: https://developers.google.com/identity/protocols/oauth2/web-server
- Authorization Endpoint: https://accounts.google.com/o/oauth2/v2/auth
- Token Endpoint: https://oauth2.googleapis.com/token

### Github

- Docs: https://docs.github.com/en/free-pro-team@latest/developers/apps/authorizing-oauth-apps
- Authorization Endpoint: https://github.com/login/oauth/authorize
- Token Endpoint: https://github.com/login/oauth/access_token
