@app
webappstack

@http
# NOTE: These routes are /generally/ for APIs. Most pages are statically rendered using `../client`, which is built and deployed to `./public`
get  /api/echo
post /api/echo
get  /auth/redirect/:provider
post /auth/redirect/:provider
get  /auth/login/:provider
get  /auth/me
get  /auth/csrf

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