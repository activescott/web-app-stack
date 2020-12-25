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

1. Add it to `src/react-app/src/pages` as `mypage.tsx`
2. Add a route for the page in `src/react-app/src/App.tsx` (this allows react-router to handle it)
3. Add a serverless function for the route's path in `app.arc` that returns react-app's `index.html` OR copy `index.html` to that path in `src/react-app/public/...` so that index.html is always returned if someone navigates directly to the route's path on the server (see https://create-react-app.dev/docs/deployment#serving-apps-with-client-side-routing for details)

**NOTE**: We use the `spa` support in Architect to force all 404s to just return `index.html` which supports our react-client-app (where client routing shows the right thing based on the route). This has a couple side-effects:

1. You don't get clean 404 when it should be a 404. Instead the client routing just kind of poops a blank page out.
2. If we used static assets (just put a copy of index.html) then it would be possible to leverage cloudfront for much faster support of the non-404 files. See fingerprinting at https://arc.codes/reference/arc/static and then you could front-end it with cloudfront and more at https://docs.begin.com/en/static-assets/working-with-static-assets and https://arc.codes/primitives/cdn
   For info on `spa` and how to turn off the "return index.html by default" behavior see https://arc.codes/reference/functions/http/node/proxy

### To add new configuration - via environment variable

See architects [`arc env` docs](https://arc.codes/docs/en/reference/cli/env#the-arc-env-file). Note `testing` is local dev. As is typical the [Begin Docs on Environment Variables](https://docs.begin.com/en/getting-started/environments) are also more helpful.

To add a new variable to test name `FOO` with value `myvalue`:

```
arc env staging FOO myvalue
```

## Roadmap

- [+] Bootstrap
- [+] Get two pages working and routing between them.
- [+] Layout:

  - [+] Add components for Layout & Head (ala [next/head](https://nextjs.org/docs/api-reference/next/head)) to make it easy to have a common layout across all pages.

- [+] Document the steps to add a new page.

- [+] demo of a client-side fetching api data in the `/data` page
- [+] fix: footer policy link color
- [+] fix: path for cookieconsent `/static/vendor/cookieconsent/cookieconsent.min.js` (is it deployed? Is SVGInjector deployed?)
- [+] fix: no more console warnings
- [+] fix: hamburger menu dropdown in a responsive view for narrow mobile clients

- Allow adding multiple OAuth Authorization servers to allow a user to authenticate:

  - [ ] feat(authentication): configuration for client ID & secret for google
  - [ ] CSRF tokens to protect against login attacks: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern
  - [ ] feat: DDB tables to store user and table to store tokens by provider
  - [ ] feat: user can use one or more OAuth providers

- [ ] feat: CSRF token middleware in all state-changing APIs:

  - [ ] CSRF server support: automatic detection/rejection
  - [ ] CSRF client support: Automatic inclusion of the token

- [ ] feat: bundle static assets (js, css, images) instead of using PUBLIC_URL as described at https://create-react-app.dev/docs/using-the-public-folder/#when-to-use-the-public-folder
- [ ] chore: basic unit tests
- [ ] chore: git hooks for linting
- [ ] chore: git hooks for unit tests
- [ ] chore: move useApiHooks and useScript hooks into new package @activescott/react-hooks

- UserContext:
  - [ ] feat: UserContext available as a react context so that client side app always has access to user/auth when authenticated (see alert genie, but no need for auth0)
  - [ ] feat: when serving index.html always return a signed cookie that also has an accessToken claim in it (HOW??)
    - See the session stuff [here](https://arc.codes/reference/functions/http/node/session) and [here](https://docs.begin.com/en/http-functions/sessions) (which one??) the `requireLogin` example at https://arc.codes/reference/functions/http/node/async
    - The "Greedy Root" behavior means we can inject cookies: https://docs.begin.com/en/http-functions/provisioning#greedy-root. Should we?
    - CSRF: See https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#xmlhttprequest-native-javascript to include it in the fetch client by default. See https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#hmac-based-token-pattern for HMAC-based CRSF. Needed on all "state changing requests".
  - [ ] feat: all local API requests in `src/react-app/src/lib/useApiHooks.ts` use accessToken
  - [ ] feat: login/logout pages
  - [ ] feat: Avatar and login/logout/profile stuff in header

### Future

- [ ] feat: HMR for react-app while using architect's sandbox (so API's still work) 🤔
- [ ] chore: Integration tests for pages (see puppeteer, https://arc.codes/guides/testing)
- [ ] chore: Automated test to detect console warnings (puppeteer? part of unit test fixture?)
- [ ] chore: Integration tests for api (see https://arc.codes/guides/testing)
- [ ] feat: server-side rendering for react (like Next.js, see https://reacttraining.com/react-router/web/guides/server-rendering)
- [ ]
