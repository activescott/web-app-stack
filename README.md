# activescott-web-app-stack

This project is intended to be a template for using [Architect](https://arc.codes/) on the server and React on the client for a web application. It uses TypeScript on server and client.

## Stack

**[Architect](https://arc.codes/)** provides lightweight infrastructure as code (IaC) deployment for an AWS-based backend. It provides support for TypeScript-based serverless functions on Lambda/APIG, DynamoDB, SQS, Static assets, and more. It's really a lightweight facade over cloudformation and provides [IaC extensibility via macros](https://arc.codes/primitives/macros).
Architect also supports multiple environments and local development.

**React** needs no introduction. This repo basically integrates [Create React App's TypeScript template](https://create-react-app.dev/docs/adding-typescript/) (including [a router](https://create-react-app.dev/docs/adding-a-router)) into Architect's deployments.

**Bootstrap** for styling - because even though it is old, it's not dated :)

## Getting Started

To run the base stack as is, run the following commands:

    npm run install-all
    npm start

## Roadmap

- [+] Bootstrap
- [+] Get two pages working and routing between them.
- [+] Layout:
  - [+] Add components for Layout & Head (ala [next/head](https://nextjs.org/docs/api-reference/next/head)) to make it easy to have a common layout across all pages.

* Document the steps to add a new page.

  - [ ] Add it to `src/react-app/src/pages` as `mypage.tsx`
  - [ ] Add a route for the page in `src/react-app/src/App.tsx` (this allows react-router to handle it)
  - [ ] Add a serverless function for the route's path in `app.arc` that returns react-app's `index.html` OR copy `index.html` to that path in `src/react-app/public/...` so that index.html is always returned if someone navigates directly to the route's path on the server (see https://create-react-app.dev/docs/deployment#serving-apps-with-client-side-routing for details)

* [ ] Demonstrate a client-side fetch to data in the `/data` page.
* [ ] Footer has ugly links

* Allow adding multiple OAuth Authorization servers to allow a user to authenticate.

  - [ ] Configuration: Client ID & Secret
  - [ ] DDB tables to store user and table to store tokens by provider.
  - [ ] A user can use one or more providers.

* UserContext:
  - [ ] Add a UserContext as a react context so that the client side app always has access to user/auth when authenticated (see alert genie, but no need for auth0)
  - [ ] When serving index.html always return a signed cookie that also has an accessToken claim in it.
  - [ ] Use the accessToken as part of all API requests in `src/react-app/src/lib/useApiHooks.ts`
  - [ ] Add an avatar and login/logout/profile stuff to header
  - [ ] login/logout pages.

### Future

- [ ] Server-side rendering for react like Next.js
  - [ ] See https://reacttraining.com/react-router/web/guides/server-rendering
