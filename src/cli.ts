#!/usr/bin/env node
import {syncPackages} from "./index";
const logger = require('pino')();

const { names, from, to, dryRun, latestOnly, latestMajors, repository } = require('yargs')
  .usage("Usage: $0 --name <name> --from.registry <url> [--from.token <x>] --to.registry <url> [--to.token <y>] " +
    "[--dry-run] [--latest-only] [--latest-majors] [--repository https://github.com/joebowbeer/regsync]\n" +
    "Publish package versions from one registry to another.")
  .example('$0 --name @scope/name --from.registry https://registry.npmjs.org/ --from.token $NPM_TOKEN ' +
    '--to.registry https://npm.pkg.github.com --to.token $GITHUB_TOKEN',
    'Migrate all npm packages from source registry to specified one')
  .strict()
  .option('names', {
    demand: true,
    describe: 'Full package names including scope',
    type: "array"
  })
  .option('from', {
    demand: true,
    describe: 'Source registry and token'
  })
  .option('to', {
    demand: true,
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
  .check(function (argv: any) {
    if (argv.from.registry === undefined) {
      throw new Error('from.registry must be specified')
    }
    if (argv.to.registry === undefined) {
      throw new Error('to.registry must be specified')
    }
    return true
  })
  .parse()

syncPackages(
  names,
  from as Record<string, string>,
  to as Record<string, string>,
  dryRun as boolean,
  latestOnly as boolean,
  latestMajors as boolean,
  repository as string
).then(result => logger.debug('Published: %i %s', result, dryRun ? '(Dry Run)' : ''))
