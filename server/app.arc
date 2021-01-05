@app
webappstack

@http
# NOTE: These routes are /generally/ for APIs. Most pages are statically rendered using `../client`, which is built and deployed to `./public`
get  /api/echo
post /api/echo
get /auth/redirect
get /auth/login

@aws
region us-west-2
profile web_app_stack

@static
folder public

@tables
users
  id *String

tokens
  id *String

@indexes
users
  email *String
