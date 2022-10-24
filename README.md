# PR Metrics

PR Metrics is a both a GitHub Action and [Azure DevOps Pipelines][azuredevops]
task for adding size and test coverage indicators to the start of each Pull
Request title.

The Azure Pipelines task can be downloaded from the
[Visual Studio Marketplace][vsmarketplace].

For example, a PR with the title "Adding code" could become either:

- XS:heavy_check_mark: :black_small_square: Adding code
- L:warning: :black_small_square: Adding code

The former would indicate an extra small PR with sufficient test coverage,
whereas the latter would indicate a large PR with insufficient test coverage.

This task helps ensure engineers keep PRs to an appropriate size with
appropriate test coverage, while informing reviewers of the expected time
commitment for a thorough review of the code.

The task will also add a comment to the PR with a detailed breakdown of the
metrics:

> **Metrics for iteration 1**
> :heavy_check_mark: Thanks for keeping your pull request small.
>
> :heavy_check_mark: Thanks for adding tests.
>
> |              | Lines   |
> | ------------ | ------: |
> | Product Code |   100   |
> | Test Code    |    50   |
> | **Subtotal** | **150** |
> | Ignored      |     5   |
> | **Total**    | **155** |

It will furthermore add a comment to indicate that review of specific excluded
files is unnecessary.

> :exclamation: **This file doesn't require review.**

If no PR description is provided, the description will be set to:

> :x: **Add a description.**

## Inputs

You will need to set the environment variable `PR_Metrics_Access_Token` to a
Personal Access Token (PAT) with at least the 'repos' scope. Instructions on
creating a new PAT can be found [here][githubpat]. Alternatively, you can use
the in-built `GITHUB_TOKEN`.

It is also recommended that you set `continue-on-error: true` as a failure
within the action should not break your pipelines and prevent code development.

### base-size

The maximum number of new lines in an extra small PR. If left blank, a default
of `200` will be used.

### growth-rate

The growth rate applied to the base size for calculating the size of larger PRs.
If left blank, a default of `2.0` will be used. With a base size of `200` and a
growth rate of `2.0`, `400` new lines would constitute a medium PR while `800`
new lines would constitute a large PR.

### test-factor

The lines of test code expected for each line of product code. If left blank, a
default of `1.0` will be used. This can be set to `0.0` in order to skip the
reporting of the test code coverage.

### file-matching-patterns

[Globs][globs] specifying the files and folders to include. Autogenerated files
should typically be excluded. Excluded files will contain a comment to inform
reviewers that they are unlikely to need to review those files. If left blank, a
default of

```Text
**/*
!**/package-lock.json
```

(all files except `package-lock.json`) will be used.

### code-file-extensions

Extensions for files containing code, so that non-code files can be excluded. If
left blank, a default set of file extensions will be used, which are listed
[here][defaultcodefileextensions].

## Example Usage

The default input values are expected to be appropriate for most builds.
Therefore, the following YAML definition is recommended:

```YAML
uses: microsoft/PR-Metrics@v1.4.7
name: PR Metrics
env:
  PR_METRICS_ACCESS_TOKEN: ${{ secrets.GITHUB_TOKEN }}
continue-on-error: true
```

If you wish to modify the inputs, YAML akin the to the following can be used:

```YAML
uses: microsoft/PR-Metrics@v1.4.7
name: PR Metrics
env:
  PR_METRICS_ACCESS_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  base-size: 200
  growth-rate: 2.0
  test-factor: 1.0
  file-matching-patterns: |
    **/*
    !Ignore.cs
  code-file-extensions: |
    cs
    ps1
continue-on-error: true
```

Instructions on using the action within Azure Pipelines can be found
[here][azurepipelinestask].

## Contributing

Instructions on contributing can be located in [CONTRIBUTING.md][contributing].

The code is released under the [MIT license][license].

PR Metrics is created by the OMEX team in Microsoft, which is part of the Office
organization. Additional source code released by the OMEX team can be located at
<https://github.com/microsoft/Omex>.

## Code of Conduct

This project has adopted the
[Microsoft Open Source Code of Conduct][codeofconduct]. For more information,
see the [Code of Conduct FAQ][codeofconductfaq] or contact
[opencode@microsoft.com][opencodeemail] with any additional questions or
comments.

[azuredevops]: https://azure.microsoft.com/services/devops/
[vsmarketplace]: https://aka.ms/PRMetrics/AzureDevOps
[githubpat]: https://docs.github.com/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token
[globs]: https://wikipedia.org/wiki/Glob_(programming)
[defaultcodefileextensions]: docs/default-code-file-extensions.md
[azurepipelinestask]: docs/azure-pipelines-task.md
[contributing]: .github/CONTRIBUTING.md
[license]: LICENSE.txt
[codeofconduct]: https://opensource.microsoft.com/codeofconduct/
[codeofconductfaq]: https://opensource.microsoft.com/codeofconduct/faq/
[opencodeemail]: mailto:opencode@microsoft.com
