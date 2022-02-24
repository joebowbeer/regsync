export enum MigrationMode {
  ALL,
  ONLY_LATEST,
  LATEST_MAJORS
}

export class MigrationSettings {
  packages: string[]
  source: Record<string, string>
  target: Record<string, string>
  dryRun: boolean
  migrationMode: MigrationMode
  repositoryFieldNewValue?: string

  public hideTokens(): MigrationSettings {
    const settings = new MigrationSettings()
    let visibleSourceToken = this.source.token
    if (visibleSourceToken && visibleSourceToken !== "") {
      visibleSourceToken = "[hidden]"
    }
    let visibleTargetToken = this.target.token
    if (visibleTargetToken && visibleTargetToken !== "") {
      visibleTargetToken = "[hidden]"
    }
    settings.source = {
      registry: this.source.registry,
      token: visibleSourceToken
    }
    settings.target = {
      registry: this.target.registry,
      token: visibleTargetToken
    }
    settings.migrationMode = this.migrationMode
    settings.repositoryFieldNewValue = this.repositoryFieldNewValue
    settings.packages = this.packages
    if (this.dryRun === true) {
      settings.dryRun = this.dryRun
    }

    return settings
  }
}
