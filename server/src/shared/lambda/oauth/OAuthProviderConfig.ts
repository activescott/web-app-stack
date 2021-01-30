/**
 * Reads configuration for a OAuth provider.
 */
export class OAuthProviderConfig {
  public constructor(private readonly providerName: string) {
    if (!providerName) throw new Error("providerName must be specified")
  }

  /**
   * Returns the name of the config setting for this provider.
   */
  public name(template: Config): string {
    return template.replace(PROVIDER_PLACEHOLDER, this.providerName)
  }

  /**
   * Returns the value of the config setting for this provider.
   */
  public value(template: Config): string {
    return process.env[this.name(template)] || ""
  }

  /**
   * Returns true if the configuration appears to be for Sign In with Apple.
   */
  public isSignInWithApple(): boolean {
    const APPLE_TOKEN_ENDPOINT = "https://appleid.apple.com/auth/token"
    return this.value(Config.TokenEndpoint) === APPLE_TOKEN_ENDPOINT
  }

  /**
   * Validates that all the configuration settings are in the environment.
   * If validation succeeds, returns an empty string.
   * If validation fails, returns a string ot be used as an error message.
   */
  public validate(): string {
    const missingConfigs = this.getMissingConfigNames()
    if (missingConfigs.length > 0) {
      return (
        `Provider "${this.providerName}" is not configured properly. Missing configuration: ` +
        missingConfigs.join(", ")
      )
    } else {
      return ""
    }
  }

  private getMissingConfigNames(): Array<string> {
    let requiredConfigs = [
      Config.ClientID,
      Config.ClientSecret,
      Config.AuthorizationEndpoint,
      Config.TokenEndpoint,
      Config.RedirectEndpoint,
      // NOTE: Scope is optional.
    ]

    if (this.isSignInWithApple()) {
      // Apple keys only needed when this is for Sign in with Apple (SIWA):
      requiredConfigs = requiredConfigs.concat([
        Config.AppleTeamID,
        Config.AppleKeyID,
        Config.ApplePrivateKey,
      ])
      // SIWA has a funky algorithm to generate ClientSecret, so its not longer required:
      requiredConfigs.splice(requiredConfigs.indexOf(Config.ClientSecret), 1)
    }
    const missing: Array<string> = []
    for (const cname of requiredConfigs) {
      const val = this.value(cname)
      if (!val) {
        missing.push(this.name(cname))
      }
    }
    if (missing.length > 0) return missing
    else return []
  }
}

export enum Config {
  AuthorizationEndpoint = "OAUTH_{{PROVIDER}}_ENDPOINT_AUTH",
  TokenEndpoint = "OAUTH_{{PROVIDER}}_ENDPOINT_TOKEN",
  ClientID = "OAUTH_{{PROVIDER}}_CLIENT_ID",
  ClientSecret = "OAUTH_{{PROVIDER}}_CLIENT_SECRET",
  RedirectEndpoint = "OAUTH_{{PROVIDER}}_ENDPOINT_REDIRECT",
  Scope = "OAUTH_{{PROVIDER}}_SCOPE",
  // The Apple keys are optional and only used if they're using "Sign in with Apple".
  AppleTeamID = "OAUTH_{{PROVIDER}}_APPLE_TEAM_ID",
  AppleKeyID = "OAUTH_{{PROVIDER}}_APPLE_KEY_ID",
  ApplePrivateKey = "OAUTH_{{PROVIDER}}_APPLE_PRIVATE_KEY",
}

const PROVIDER_PLACEHOLDER = "{{PROVIDER}}"
