# The "UbiquiBot"

Ubiquity DAO's GitHub Bot to automate DevPool management.

## Quickstart

```sh
#!/bin/bash

git clone https://github.com/ubiquity/ubiquibot.git
cd ubiquibot
yarn
yarn tsc
yarn start:watch
```

## Environment Variables

- Copy `.env.example` to `.env`
- Update `.env` with the following fields:
- `SUPABASE_URL`: Add your Supabase project URL.
- `SUPABASE_KEY`: Add your Supabase project API key.
- `LOGDNA_INGESTION_KEY`: Get it from [Memzo](https://app.mezmo.com/) by creating an account, adding an organization, and copying the ingestion key on the next screen.
- `FOLLOWUP_TIME`: (optional) Set a custom follow-up time (default: 4 days).
- `DISQUALIFY_TIME`: (optional) Set a custom disqualify time (default: 7 days).

`APP_ID` and `PRIVATE_KEY` are [here](https://t.me/c/1588400061/1627) for internal developers to use.
If you are an external developer, `APP_ID`and `PRIVATE_KEY` are automatically generated when you install the app on your repository.

**Note:** When setting up the project, please do not rename the `.env.example` file to `.env` as it will delete the environment example from the repository.
Instead, it is recommended to make a copy of the `.env.example` file and replace the values with the appropriate ones.

## Overview

- This bot is designed to exist as a GitHub Action.
- The code must be compiled using `@vercel/ncc` because all the dependencies (e.g. `node_modules`) must be included and committed on the repository for the GitHub Actions runner to use.

## How to use

1. Go to the [UbiquiBot App Marketplace](https://github.com/marketplace/ubiquibot)
2. Choose a plan and install UbiquiBot on your repository
3. Congratulations! You can now use the UbiquiBot to manage your bounties.

To test the bot, you can:

1. Create a new issue
2. Add a time label, ex: `Time: <1 Day`
3. At this point the bot should add a price label.

## How to run locally

1. Create a new project at [Supabase](https://supabase.com/). Add `Project URL` and `API Key` to the `.env` file:

```

SUPABASE_URL="XXX"
SUPABASE_KEY="XXX"

```

2. Create a new organization at [Memzo](https://app.mezmo.com/). Add `LOGDNA_INGESTION_KEY` to the `.env` file:

```

LOGDNA_INGESTION_KEY ="XXX"

```

3. Add `FOLLOW_UP_TIME` and `DISQUALIFY_TIME` to the `.env` file if you don't want to use default ones.

```

FOLLOW_UP_TIME="4 days" // 4 days
DISQUALIFY_TIME="7 days" // 7 days

```

4. `yarn install`
5. Open 2 terminal instances:
   - in one instance run `yarn tsc --watch` (compiles the Typescript code)
   - in another instance run `yarn start:watch` (runs the bot locally)
6. Open `localhost:3000` and follow instructions to add the bot to one of your repositories.

At this point the `.env` files auto-fill the empty fields (`PRIVATE_KEY` and `APP_ID`) if it is not previously filled.
Now you can make changes to the repository on GitHub (e.g. add a bounty) and the bot should react.

You can, for example:

1. Create a new issue
2. Add a time label, ex: `Time: <1 Day`
3. At this point the bot should add a price label, you should see event logs in one of your opened terminals

## How it works

Bounty bot is built using the [probot](https://probot.github.io/) framework so initially the bot is a github app. But thanks to the [probot/adapter-github-actions](https://github.com/probot/adapter-github-actions) you can also use the bot as a github action.

You can use the bounty bot as a [github app](https://github.com/marketplace/ubiquibot).

When using as a github app the flow is the following:

1. Bounty bot is added to a repository as a github app
2. You run the bot "backend" (for example on your local machine)
3. Some event happens in a repository and the bot should react somehow (for example: on adding a time label to an issue the bot should add a price label)
4. Event details are sent to your deployed bot instance (to a webhook URL that was set in github app's settings)
5. The bot handles the event

## How to QA any additions to the bot

1. Fork the ubiquibot repo and install the [ubiquibot-qa app](https://github.com/apps/ubiquibot-qa) on the forked repository.
2. Enable github action running on the forked repo and allow `issues` on the settings tab.
3. Create a [QA issue](https://github.com/ubiquibot/staging/issues/21) similar to this where you show the feature working in the forked repo
4. Describe carefully the steps taken to get the feature working, this way our team can easily verify
5. Link that QA issue to the pull request as indicated on the template before requesting a review

## How to create a new release

1. Update the version in package.json: `yarn version --new-version x.x.x`
2. Commit and create a new tag: `git commit -am x.x.x && git tag -am x.x.x`
3. Push tags: `git push origin v"x.x.x"`
4. The Github action will create a release by recognizing the version tag

![ubiquibot-pfp-1](https://user-images.githubusercontent.com/4975670/208798502-0ac27adc-ab19-4148-82b8-8538040cf3b6.png)

```

```
