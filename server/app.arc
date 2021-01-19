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

@aws
region us-west-2
profile web_app_stack

@static
folder public

@tables
user
  id *String

token
  id *String

@indexes
user
  email *String
