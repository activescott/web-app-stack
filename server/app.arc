@app
webappstack

@http
# NOTE: These routes are /generally/ for APIs. Most pages are statically rendered using `../client`, which is built and deployed to `./public`
get    /api/echo
post   /api/echo
get    /auth/login/:provider
get    /auth/redirect/:provider
post   /auth/redirect/:provider
get    /auth/logout
# Returns a csrf token as a text/plain response that should be included as a header for state-changing/unsafe operations.
get    /auth/csrf
# Returns information about the current user.
get    /auth/me
# Deletes the specified identity associated with the current user.
delete /auth/me/identities/:identityID
# Deletes the current user (and their identities).
delete /auth/me

@aws
region us-west-2
profile web_app_stack

@static
folder public

@tables
user
  id *String

identity
  id *String

@indexes
user
  email *String

identity
  provider_subject *String