#!/usr/bin/env node
import {syncPackages} from "./index"
import * as inquirer from "inquirer"
import {isValidUrl} from "./utils"
import {MigrationMode, MigrationSettings} from "./settings"

const logger = require('pino')()

const {packages, from, to, dryRun, latestOnly, latestMajors, repository} = require('yargs')
  .usage("Usage: $0 --packages <packages> --from.registry <url> [--from.token <x>] --to.registry <url> [--to.token <y>] " +
           "[--dry-run] [--latest-only] [--latest-majors] [--repository https://github.com/joebowbeer/regsync]\n" +
           "Publish package versions from one registry to another.")
  .example('$0 --packages @scope/packageName1 @scope/packageName2 --from.registry https://registry.npmjs.org/ --from.token $NPM_TOKEN ' +
             '--to.registry https://npm.pkg.github.com --to.token $GITHUB_TOKEN',
           'Migrate all npm packages from source registry to specified one')
  .strict()
  .option('packages', {
    describe: 'Full package names including scope',
    type: "array"
  })
  .option('from', {
    describe: 'Source registry and token'
  })
  .option('to', {
    describe: 'Target registry and token'
  })
  .option('dry-run', {
    demand: false,
    describe: 'Does everything except publish',
    default: false,
    boolean: true
  })
  .option('latest-only', {
    demand: false,
    describe: 'Only syncs the latest dist-tag version',
    default: false,
    boolean: true
  })
  .option('latest-majors', {
    demand: false,
    describe: 'Only syncs the latest majors',
    default: false,
    boolean: true
  })
  .option('repository', {
    demand: false,
    describe: 'Override the repository field in the package.json',
    default: undefined
  })
  .parse()


const questions = [
  {
    name: 'sourceUrl',
    type: 'input',
    message: 'Please provide source npm registry url',
    when: (_) => !from,
    validate: async (input) => {
      if (!isValidUrl(input)) {
        return 'Incorrect url';
      }
      return true
    }
  },
  {
    name: 'sourceToken',
    type: 'password',
    message: 'Please provide source npm registry token',
    when: (_) => !from
  },
  {
    name: 'targetUrl',
    type: 'input',
    message: 'Please provide target npm registry url',
    when: (_) => !to,
    validate: async (input) => {
      if (!isValidUrl(input)) {
        return 'Incorrect url'
      }
      return true
    }
  },
  {
    name: 'targetToken',
    type: 'password',
    message: 'Please provide target npm registry token',
    when: (_) => !to
  },
  {
    name: 'packages',
    type: 'input',
    message: 'Please provide packageNames to import separated by spaces',
    when: (_) => !packages,
    validate: async (packages) => {
      if (!packages || packages === "") {
        return 'Please provide at least one package to import';
      }
      return true;
    },
    filter: async (packageStr) => {
      if (!packages || packages === "") {
        return []
      } else return packageStr.split(/[, ]/)
    },
  },
  {
    name: 'migrationMode',
    type: 'list',
    message: 'Choose migration mode',
    choices: ["all", "only-latest", "latest-majors"],
    when: (_) => !from && !latestOnly && !latestMajors
  }
]

inquirer.prompt(questions)
        .then(answers => {
          let migrationMode: MigrationMode
          if (latestOnly || (answers.migrationMode && answers.migrationMode === "only-latest")) {
            migrationMode = MigrationMode.ONLY_LATEST
          } else if (latestMajors || (answers.migrationMode && answers.migrationMode === "latest-majors")) {
            migrationMode = MigrationMode.LATEST_MAJORS
          } else {
            migrationMode = MigrationMode.ALL
          }

          const fromNotNull = from ?? {}
          const source = {
            registry: fromNotNull.registry ?? answers.sourceUrl,
            token: fromNotNull.token ?? answers.sourceToken
          }
          if (source.token === "") source.token = undefined

          let toNotNull = to ?? {}
          const target = {
            registry: (toNotNull.registry ?? answers.targetUrl),
            token: (toNotNull.token ?? answers.targetToken)
          }
          if (target.token === "") target.token = undefined

          const targetPackages = packages || answers.packages
          const settings = new MigrationSettings()
          settings.source = source
          settings.target = target
          settings.migrationMode = migrationMode
          settings.dryRun = dryRun
          settings.repositoryFieldNewValue = repository
          settings.packages = targetPackages

          inquirer.prompt({
                            name: 'confirm',
                            type: 'confirm',
                            message: `Please review migration settings:\n ${JSON.stringify(settings.hideTokens(), null, 4)}\n Start migration? `
                          })
                  .then(answers => {
                    if (answers.confirm === true) {
                      syncPackages(settings).then(result => logger.info('Published: %i %s', result, dryRun ? '(Dry Run)' : ''))
                    }
                  })
        })