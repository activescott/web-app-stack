# OAuth Configuration Notes

1. Add a comma-delimited list of provider names to environment variable `OAUTH_PROVIDERS`. For example, the following adds two providers to the arc staging environment:

```sh
arc env staging OAUTH_PROVIDERS 'GOOGLE,GITHUB'
```

NOTE: The provider name can be any text and is not interpreted. It is used only as part of the prefix in the environment variables defined below:

2. Get a OAuth Client ID and OAuth Client Secret from the provider. Here are [instructions for Google](https://developers.google.com/identity/protocols/oauth2/openid-connect).
   Use the redirect url of `https://<API_GATEWAY_ID>.execute-api.<REGION>.amazonaws.com/<ENVIRONMENT?>/auth/redirection` like `https://o92pvgjal2.execute-api.us-west-2.amazonaws.com/staging/auth/redirection`

3. Add environment variable for Client ID:
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_CLIENT_ID` where `<PROVIDER_NAME>` is the name of the provider you used above.

```sh
arc env staging OAUTH_GOOGLE_CLIENT_ID '235329004997-qbmh6kacitf56jtscckadmvd0qu9sqi6.apps.googleusercontent.com'
```

4. Add environment variable for Client Secret
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_CLIENT_SECRET` where `<PROVIDER_NAME>` is the name of the provider you used above.

```sh
arc env staging OAUTH_GOOGLE_CLIENT_SECRET 'decafbad'
```

5. Add environment variable for OAuth 2 [Authorization Endpoint](https://tools.ietf.org/html/rfc6749#section-3.1):
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_ENDPOINT_AUTH` where `<PROVIDER_NAME>` is the name of the provider you used above.

```sh
arc env staging OAUTH_GOOGLE_ENDPOINT_AUTH 'https://accounts.google.com/o/oauth2/v2/auth'
```

6. Add environment variable for OAuth 2 [Token Endpoint](https://tools.ietf.org/html/rfc6749#section-3.2):
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_ENDPOINT_TOKEN` where `<PROVIDER_NAME>` is the name of the provider you used above.

```sh
arc env staging OAUTH_GOOGLE_ENDPOINT_TOKEN 'https://github.com/login/oauth/access_token'
```

7. (OPTIONAL): Add environment variable for [OAuth 2 Access Token Scopes](https://tools.ietf.org/html/rfc6749#section-3.3):
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_SCOPE` where `<PROVIDER_NAME>` is the name of the provider you used above. The value is a list of space-delimited, case-sensitive strings.
   If none are included the default value is `openid`.
   If you don't include `openid` in your list, then something bad will happen! TODO: Fix that!

```sh
arc env staging OAUTH_GOOGLE_SCOPE 'openid https://www.googleapis.com/auth/userinfo.email'
```

## Known OAuth 2 Provider Endpoints

### Google

- Docs: https://developers.google.com/identity/protocols/oauth2/web-server
- Authorization Endpoint: https://accounts.google.com/o/oauth2/v2/auth
- Token Endpoint: https://oauth2.googleapis.com/token
- OIDC
- Get User's Email:
  - SCOPE: https://www.googleapis.com/auth/userinfo.email
  - EMAIL_ENDPOINT: https://www.googleapis.com/oauth2/v2/userinfo?alt=json

### Apple:

- Supports OpenID Connect, but NOT an email API endpoint (their access_token doesn't even appear complete): https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/authenticating_users_with_sign_in_with_apple

### Github

@#$%$#@ Doesn't support OpenID Connect!

- Docs: https://docs.github.com/en/free-pro-team@latest/developers/apps/authorizing-oauth-apps
- Authorization Endpoint: https://github.com/login/oauth/authorize
- Token Endpoint: https://github.com/login/oauth/access_token
- OIDC NOT SUPPORTED
- Get User's Email:
  - SCOPE: user
  - EMAIL_ENDPOINT: https://api.github.com/user
