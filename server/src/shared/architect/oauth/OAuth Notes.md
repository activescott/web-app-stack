# OAuth Configuration Notes

1. Choose a name for your provider. The provider name can be any text and is not interpreted. It is used only as part of the prefix in the environment variables defined below. Below examples are using the name `GOOGLE`, but it could be anything.

2. Get a OAuth Client ID and OAuth Client Secret from the provider. For example, here are [instructions for Google](https://developers.google.com/identity/protocols/oauth2/openid-connect).

   Use the redirect url of `https://<API_GATEWAY_ID>.execute-api.<REGION>.amazonaws.com/<ENVIRONMENT?>/auth/redirect/<PROVIDER_NAME>` like `https://o92pvgjal2.execute-api.us-west-2.amazonaws.com/staging/auth/redirect/GOOGLE`

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
arc env staging OAUTH_GOOGLE_ENDPOINT_TOKEN 'https://oauth2.googleapis.com/token'
```

7. Add environment variable for OAuth 2 [Redirection Endpoint](https://tools.ietf.org/html/rfc6749#section-3.1.2):
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_ENDPOINT_REDIRECT` where `<PROVIDER_NAME>` is the name of the provider you used above. The value should be `http://localhost:3333/auth/redirect/<PROVIDER_NAME>` or `http://localhost:3333/staging/auth/redirect/<PROVIDER_NAME>` for the staging environment (testing and production have no `staging` root in Architect).

```sh
./arc env staging OAUTH_GOOGLE_ENDPOINT_REDIRECT http://localhost:3333/auth/redirect/GOOGLE
```

8. (OPTIONAL): Add environment variable for [OAuth 2 Access Token Scopes](https://tools.ietf.org/html/rfc6749#section-3.3):
   The environment variable is named like `OAUTH_<PROVIDER_NAME>_SCOPE` where `<PROVIDER_NAME>` is the name of the provider you used above. The value is a list of space-delimited, case-sensitive strings.
   If none are included the default value is `openid`.
   If you don't include `openid` in your list, then something bad will happen! TODO: Fix that!

```sh
arc env staging OAUTH_GOOGLE_SCOPE 'openid https://www.googleapis.com/auth/userinfo.email'
```

## Known OAuth 2 Provider Endpoints

### Google

- OIDC compliant
- Docs: https://developers.google.com/identity/protocols/oauth2/web-server
- Authorization Endpoint & Token Endpoint available at https://accounts.google.com/.well-known/openid-configuration
- Scopes: No scope configuration needed (the standard `"openid email"` scopes allow getting the id_token and email address claim inside of it).

### Apple:

- OIDC compliant
- Docs: https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/authenticating_users_with_sign_in_with_apple
- Authorization Endpoint & Token Endpoint available at https://appleid.apple.com/.well-known/openid-configuration
- Scopes: No scope configuration needed (the standard `"openid email"` scopes allow getting the id_token and email address claim inside of it).

### Github


- NOT OIDC complaint @#$%$#@ 
- Docs: https://docs.github.com/en/free-pro-team@latest/developers/apps/authorizing-oauth-apps
- Authorization Endpoint: https://github.com/login/oauth/authorize
- Token Endpoint: https://github.com/login/oauth/access_token
- OIDC NOT SUPPORTED
- Get User's Email:
  - SCOPE: user
  - EMAIL_ENDPOINT: https://api.github.com/user

### Microsoft (Azure, M365, Azure Active Directory, etc.)

TODO
