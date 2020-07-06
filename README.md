# activescott-web-app-stack

This project is intended to be a template for using [Architect](https://arc.codes/) on the server and React on the client for a web application. It uses TypeScript on both the server and the client.


## Goals

The goal is to make it quick and easy to start a new web application with the most basic functionality that any application needs set up and ready to go.


## Stack

**[Architect](https://arc.codes/)** provides lightweight infrastructure as code (IaC) deployment for an AWS-based backend. It provides support for TypeScript-based serverless functions on Lambda/APIG, DynamoDB, SQS, Static assets, and more. It's really a lightweight facade over cloudformation and provides [IaC extensibility via macros](https://arc.codes/primitives/macros).
Architect also supports multiple environments and local development.

**React** needs no introduction. This repo basically integrates [Create React App's TypeScript template](https://create-react-app.dev/docs/adding-typescript/) (including [a router](https://create-react-app.dev/docs/adding-a-router)) into Architect's deployments.

**Bootstrap** for styling - because even though it is old, it's not dated :)

**Policy Structure** [Osano's Cookie Consent library](https://github.com/osano/cookieconsent/) is built in to ensure users are aware of cookies and a placeholder for your Terms of Service (see `src/react-app/src/pages/policy/terms.tsx`) and Privacy Policy (`src/react-app/src/pages/policy/privacy.tsx`) pages are included.

**Layout** There is a basic layout pattern implemented in react. See `src/react-app/src/components/layout.tsx`. Also incorporates [react-helmet](https://github.com/nfl/react-helmet) to handle `head`.

**Hygene** Linting of all files is handled with a combo of eslint & prettier. See `lint*` scripts in `package.json`.


## Getting Started

To run the base stack as is, run the following commands:

    npm run install-all
    npm start


## Usage

### To add a new page

1. *Add it to `src/react-app/src/pages` as `mypage.tsx`
2. *Add a route for the page in `src/react-app/src/App.tsx` (this allows react-router to handle it)
3. *Add a serverless function for the route's path in `app.arc` that returns react-app's `index.html` OR copy `index.html` to that path in `src/react-app/public/...` so that index.html is always returned if someone navigates directly to the route's path on the server (see https://create-react-app.dev/docs/deployment#serving-apps-with-client-side-routing for details)

**NOTE**: We use the `spa` support in Architect to force all 404s to just return `index.html` which supports our react-client-app (where client routing shows the right thing based on the route). This has a couple side-effects:
1. You don't get clean 404 when it should be a 404. Instead the client routing just kind of poops a blank page out.
2. If we used static assets (just put a copy of index.html) then it would be possible to leverage cloudfront for much faster support of the non-404 files. See fingerprinting at https://arc.codes/reference/arc/static and then you could front-end it with cloudfront and more at https://docs.begin.com/en/static-assets/working-with-static-assets 
For info on `spa` and how to turn off the "return index.html by default" behavior see https://arc.codes/reference/functions/http/node/proxy


## Roadmap

* [+] Bootstrap
* [+] Get two pages working and routing between them.
* [+] Layout:
  * [+] Add components for Layout & Head (ala [next/head](https://nextjs.org/docs/api-reference/next/head)) to make it easy to have a common layout across all pages.

* [+] Document the steps to add a new page.

* [x] demo of a client-side fetching api data in the `/data` page
* [ ] Footer has ugly links
* [ ] Basic unit tests
* [ ] Git hooks for linting
* [ ] Git hooks for unit tests

* Allow adding multiple OAuth Authorization servers to allow a user to authenticate.

  * [ ] Configuration: Client ID & Secret
  * [ ] DDB tables to store user and table to store tokens by provider.
  * [ ] A user can use one or more providers.

* UserContext:
  * [ ] Add a UserContext as a react context so that the client side app always has access to user/auth when authenticated (see alert genie, but no need for auth0)
  * [ ] When serving index.html always return a signed cookie that also has an accessToken claim in it.
  * [ ] Use the accessToken as part of all API requests in `src/react-app/src/lib/useApiHooks.ts`
  * [ ] Add an avatar and login/logout/profile stuff to header
  * [ ] login/logout pages.

* [ ] Fix the path to `/static/vendor/cookieconsent/cookieconsent.min.js`; is it deployed? Is SVGInjector deployed?
* [ ] Fix the console warnings. Add a puppeteer to detect console warnings?

### Future
* [ ] HMR for react-app while using architect's sandbox 🤔
* [ ] Integration tests for pages (puppeteer)
* [ ] Integration tests for api
* [ ] Server-side rendering for react like Next.js
  * [ ] See https://reacttraining.com/react-router/web/guides/server-rendering
