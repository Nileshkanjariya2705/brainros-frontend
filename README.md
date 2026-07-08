# react-ts-boilerplate

## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [Create](https://docs.gitlab.com/user/project/repository/web_editor/#create-a-file) or [upload](https://docs.gitlab.com/user/project/repository/web_editor/#upload-a-file) files
- [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.taskgrids.com/vivek.jalondhara/react-ts-boilerplate.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [Set up project integrations](https://gitlab.taskgrids.com/vivek.jalondhara/react-ts-boilerplate/-/settings/integrations)

## Collaborate with your team

- [Invite team members and collaborators](https://docs.gitlab.com/user/project/members/)
- [Create a new merge request](https://docs.gitlab.com/user/project/merge_requests/creating_merge_requests/)
- [Automatically close issues from merge requests](https://docs.gitlab.com/user/project/issues/managing_issues/#closing-issues-automatically)
- [Enable merge request approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/)
- [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [Get started with GitLab CI/CD](https://docs.gitlab.com/ci/quick_start/)
- [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/user/application_security/sast/)
- [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/topics/autodevops/requirements/)
- [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/user/clusters/agent/)
- [Set up protected environments](https://docs.gitlab.com/ci/environments/protected_environments/)

---

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name

Choose a self-explaining name for your project.

## Description

Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges

On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals

Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation

Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage

Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support

Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap

If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing

State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment

Show your appreciation to those who have contributed to the project.

## License

For open source projects, say how it is licensed.

## Project status

If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.

<<<<<<< HEAD

# React + Vite + TypeScript Boilerplate

Production starter that mirrors the **`frontend-v2.0` conventions** end-to-end:
singleton `Axios` + `useAxios` hooks + `use*API` service hooks, Redux Toolkit +
redux-persist slices, **Yup** validation with register-based **FormField**
components, `*.constant.ts` message files, **SVG (svgr) + lucide** icons,
**CSS-variable Tailwind tokens** (class dark mode), `@config` env module with
dev/prod files, granular **path aliases**, and a **single common route file** using
`lazyRoute` + `PUBLIC_NAVIGATION` / `PRIVATE_NAVIGATION`.

## Code style (matches the repo — important)

- **Arrow functions only.** Components/pages/layouts/guards are
  `const X = () => { ... }` with a separate **`export default X`** at the bottom.
  Hooks/services/utils are **`export const useX = () => {}`** (named). No
  `function` declarations anywhere.
- **Import banners**: group imports with `// ** Packages **`, `// ** Components **`,
  `// ** Hooks **`, `// ** Redux **`, `// ** Services **`, `// ** Constants **`,
  `// ** Config **`, `// ** Types **`, `// ** Validation **`.
- **API consumption**: always `const { data, error } = await callApi(...)` and
  branch on `if (!error && data)`.
- **Validation = Yup**, **class composition = classnames (`cn`)**, **icons = lucide-react**.

## Stack

| Concern            | Tool                                                                |
| ------------------ | ------------------------------------------------------------------- |
| Build / dev server | Vite                                                                |
| Language           | TypeScript (strict)                                                 |
| Routing            | react-router-dom v6 (`createBrowserRouter`, one route file, guards) |
| Global state       | Redux Toolkit + redux-persist                                       |
| HTTP               | axios — single `Axios` instance + interceptors                      |
| Data fetching      | `useAxios` hooks → `use*API` service hooks                          |
| Forms              | react-hook-form + **Yup** + `FormField` components                  |
| Icons              | **lucide-react** + SVG-as-component (`vite-plugin-svgr`)            |
| Class composition  | **classnames**                                                      |
| Styling            | Tailwind (CSS-variable tokens, `darkMode: 'class'`)                 |
| Lint / format      | ESLint + Prettier                                                   |
| Git hooks          | Husky + lint-staged + commitlint                                    |
| Tests              | Vitest + Testing Library                                            |

## Getting started

```bash
git init                 # husky needs a git repo to install hooks
npm install              # runs `husky` via the prepare script
npm run dev              # http://localhost:3000  (loads .env.development)
```

## Scripts

| Command                     | Does                        |
| --------------------------- | --------------------------- |
| `dev` / `build` / `preview` | run / build / preview       |
| `lint` / `lint:fix`         | ESLint (`--max-warnings 0`) |
| `format` / `typecheck`      | Prettier / `tsc --noEmit`   |
| `test` / `test:watch`       | Vitest                      |

## Folder structure

```
src/
├── main.tsx · App.tsx          # entry; App = <AppProviders> + <AppRouter>
│
├── config/index.ts             # @config — env read ONCE (API_URL, IS_DEV…)
│
├── base-axios/                 # ⭐ single HTTP instance
│   ├── index.ts                #   `Axios` + request/response interceptors
│   └── types.ts                #   ExtendedResponse, ApiErrorResponse
│
├── constants/                  # ⭐ *.constant.ts
│   ├── navigation.constant.ts  #   PUBLIC_NAVIGATION / PRIVATE_NAVIGATION (paths)
│   ├── commonMessage.constant.ts · toast.constants.ts
│   ├── formErrorMessage.constant.ts (EmailError/PasswordError enums)
│   ├── regex.constant.ts · apiError.constant.ts
│
├── redux/                      # ⭐ Redux Toolkit + redux-persist
│   ├── store.ts                #   configureStore + persist; useAppDispatch, RootStateType, persistor
│   ├── rootReducer.ts          #   { reducer as xReducer }
│   ├── hooks.ts                #   typed useAppSelector
│   └── slices/authSlice.ts     #   actions + selectors + reducer
│
├── providers/AppProviders.tsx  # Redux Provider + PersistGate
│
├── routes/                     # ⭐ ONE common route file + guards
│   ├── index.tsx               #   all routes + createBrowserRouter + <AppRouter>
│   ├── ProtectedRoute.tsx      #   guard: must be logged IN
│   └── PublicRoute.tsx         #   guard: must be logged OUT
│
├── components/                 # ⭐ SHARED components
│   ├── ui/                     #   Button, Input (primitives)
│   ├── feedback/               #   Loader, PageLoader, NotFoundPage
│   ├── layout/                 #   AppLayout, AuthLayout
│   └── FormField/              #   ⭐ react-hook-form fields (register-based)
│       ├── index.tsx           #     barrel: InputField, PasswordField, Label, HelperText
│       ├── components/common/  ·   types/formField.types.ts
│
├── hooks/                      # GLOBAL hooks: useAxios, useAuth
├── utils/                      # GLOBAL utils: token.ts, lazyRoute.tsx
├── assets/icons/               # SVGs imported via `?react`
├── styles/index.css            # tailwind entry + CSS-variable tokens (:root / .dark)
│
└── modules/                    # ⭐ FEATURES — self-contained
    ├── Auth/                   #   the reference module (copy it to add a feature)
    │   ├── components/LoginForm.tsx
    │   ├── pages/LoginPage.tsx
    │   ├── services/index.ts            (use*API hooks + AUTH_API_BASE_PATH)
    │   ├── hooks/useLogin.ts            (form → redux → navigate)
    │   ├── validation-schema/login.schema.ts (Yup)
    │   ├── types/auth.types.ts
    │   └── index.ts
    └── Dashboard/
        ├── pages/DashboardPage.tsx
        └── services/index.ts            (GET example + DASHBOARD_API_BASE_PATH)
```

A **module** holds `components/ pages/ services/ hooks/ types/ validation-schema/`
(+ `constants/` when needed). Copy `Auth/` to scaffold a new feature.

## Path aliases

`tsconfig.json` + `vite-tsconfig-paths`: `@/*` (catch-all), `@config`,
`@components/*`, `@modules/*`, `@redux/*`, `@hooks/*`, `@constants/*`, `@utils/*`,
`@assets/*`.

## API call pattern (Axios → useAxios → service hook → custom hook → component)

1. **`base-axios/index.ts`** — one `Axios` instance; request interceptor adds the
   bearer token, response interceptor hard-logs-out on `401`.
2. **`hooks/useAxios.ts`** — `useAxiosGet/Post/Put/Patch/Delete`, each returns
   `[callFn, { isLoading, isError, isSuccess }]`; `callFn` → `ExtendedResponse`
   (never throws), with `data` already unwrapped from the envelope.
3. **`modules/<F>/services/index.ts`** — `use*API` hooks, with a top-level
   `<MODULE>_API_BASE_PATH` constant (repo convention), `callApi` naming, a
   `(data, config)` signature, and an explicit state return:

   ```ts
   const AUTH_API_BASE_PATH = '/auth';

   export const useLoginAPI = () => {
     const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
     const loginAPI = async (data: object, config: AxiosRequestConfig<object> = {}) =>
       callApi<LoginResponse>(`${AUTH_API_BASE_PATH}/login`, data, config);
     return { loginAPI, isLoading, isError, isSuccess };
   };
   ```

4. **`modules/<F>/hooks/*.ts`** — orchestrate; **always destructure `{ data, error }`**:

   ```ts
   const { loginAPI, isLoading } = useLoginAPI();
   const { data, error } = await loginAPI(credentials);
   if (!error && data) {
     dispatch(setCredentials(data));
     navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
   } else {
     setError(error ?? 'Login failed');
   }
   ```

5. **Component** — consumes the custom hook and renders `isLoading / error`.

## Login flow (the full reference)

`LoginForm` (react-hook-form + `yupResolver(loginSchema)` + `InputField` /
`PasswordField`) → `useLogin` (custom hook: calls the service, dispatches
`setCredentials`, navigates) → `useLoginAPI` (service hook over `useAxiosPost`) →
`Axios`. Every layer is typed: `LoginFormValues` (Yup `InferType`) →
`LoginCredentials` → `LoginResponse`.

```tsx
const { register, handleSubmit, formState: { errors } } =
  useForm<LoginFormValues>({ resolver: yupResolver(loginSchema) });

<InputField<LoginFormValues> name="email" label="Email" register={register} errors={errors} required />
<PasswordField<LoginFormValues> name="password" label="Password" register={register} errors={errors} required />
```

Schemas → `modules/<F>/validation-schema/*.schema.ts`; messages →
`constants/formErrorMessage.constant.ts`.

## Routing

One file (`routes/index.tsx`) lazy-imports pages with `lazyRoute`, declares the
`publicRoutes` / `protectedRoutes` arrays, and composes them with
`createBrowserRouter` under `PublicRoute → AuthLayout` and
`ProtectedRoute → AppLayout`. A single `<Suspense fallback={<PageLoader/>}>`
covers all lazy chunks. Paths come from `constants/navigation.constant.ts`.

## Redux

- One slice per feature in `redux/slices/<feature>Slice.ts`: named **actions**,
  **selectors** (`getX = (s: RootStateType) => …`), a named **`reducer`**, default slice.
- `rootReducer.ts` imports each as `{ reducer as xReducer }`.
- `store.ts` adds redux-persist (`whitelist`) and exports `useAppDispatch`,
  `RootStateType`, `persistor`. Use typed `useAppDispatch` + `useAppSelector`.

## Icons & SVG · Styling

- Icons: `lucide-react`. Custom SVGs: `import Logo from '@/assets/icons/x.svg?react'`
  (component) — typings in `src/vite-env.d.ts`.
- Tailwind colors are **CSS variables** (`styles/index.css` `:root` + `.dark`);
  `darkMode: 'class'`; **max-width** breakpoints (desktop-first); compose with `cn(...)`.

## Env / config (dev vs prod)

`@config` reads `import.meta.env` once → `API_URL`, `API_TIMEOUT`, `APP_NAME`,
`APP_ENV`, `IS_DEV`, `IS_PROD`. Vite loads `.env`, then `.env.development` (dev) /
`.env.production` (build). Only `VITE_`-prefixed vars reach the client.

## Husky

- `pre-commit` → `lint-staged`; `commit-msg` → `commitlint` (Conventional Commits).
  Installed via `prepare` on `npm install` inside a git repo.
  =======

# react-ts-boilerplate

## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [Create](https://docs.gitlab.com/user/project/repository/web_editor/#create-a-file) or [upload](https://docs.gitlab.com/user/project/repository/web_editor/#upload-a-file) files
- [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.taskgrids.com/vivek.jalondhara/react-ts-boilerplate.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [Set up project integrations](https://gitlab.taskgrids.com/vivek.jalondhara/react-ts-boilerplate/-/settings/integrations)

## Collaborate with your team

- [Invite team members and collaborators](https://docs.gitlab.com/user/project/members/)
- [Create a new merge request](https://docs.gitlab.com/user/project/merge_requests/creating_merge_requests/)
- [Automatically close issues from merge requests](https://docs.gitlab.com/user/project/issues/managing_issues/#closing-issues-automatically)
- [Enable merge request approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/)
- [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [Get started with GitLab CI/CD](https://docs.gitlab.com/ci/quick_start/)
- [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/user/application_security/sast/)
- [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/topics/autodevops/requirements/)
- [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/user/clusters/agent/)
- [Set up protected environments](https://docs.gitlab.com/ci/environments/protected_environments/)

---

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name

Choose a self-explaining name for your project.

## Description

Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges

On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals

Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation

Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage

Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support

Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap

If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing

State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment

Show your appreciation to those who have contributed to the project.

## License

For open source projects, say how it is licensed.

## Project status

If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
