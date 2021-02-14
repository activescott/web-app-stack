NOTE: This "shared" folder is specific to Architect to allow each http handler to be bundled (since in essence each http handler is it's own completely isolated module).
See https://arc.codes/docs/en/guides/developer-experience/sharing-code

NOTE: A potentially cleaner and less-specific approach to architect would be to put all code from shared into it's own package that is referenced by the web project itself (this is essentially what architect is doing but it kinda hides it).
