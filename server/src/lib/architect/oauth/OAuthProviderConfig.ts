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
    return process.env[this.name(template)]
  }

  public getMissingConfigNames(): Array<string> {
    const requiredConfigs = [
      Config.ClientID,
      Config.ClientSecret,
      Config.AuthorizationEndpoint,
      Config.TokenEndpoint,
      Config.RedirectURL
    ]
    const missing: Array<string> = []
    for (const cname of requiredConfigs) {
      const val = this.value(cname)
      if (!val) {
        missing.push(this.name(cname))
      }
    }
    if (missing.length > 0) return missing
    else return null
  }
}

export enum Config {
  AuthorizationEndpoint = "OAUTH_{{PROVIDER}}_ENDPOINT_AUTH",
  TokenEndpoint = "OAUTH_{{PROVIDER}}_ENDPOINT_TOKEN",
  ClientID = "OAUTH_{{PROVIDER}}_CLIENT_ID",
  ClientSecret = "OAUTH_{{PROVIDER}}_CLIENT_SECRET",
  RedirectURL =  "OAUTH_{{PROVIDER}}_REDIRECT_URL",
}

const PROVIDER_PLACEHOLDER = "{{PROVIDER}}"
