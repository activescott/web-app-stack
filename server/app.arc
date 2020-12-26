@app
webappstack

@http
# NOTE: These routes are /generally/ for APIs. Most pages are statically rendered using `src/react-app`
get  /api/echo
post /api/echo

@aws
region us-west-2
profile web_app_stack

@static
folder public
