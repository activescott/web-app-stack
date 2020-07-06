@app
init

@http
# NOTE: These routes are /generally/ for APIs. Most pages are statically rendered using `src/react-app`
get  /api/echo
post /api/echo

@aws
region us-west-2

@static
folder public
