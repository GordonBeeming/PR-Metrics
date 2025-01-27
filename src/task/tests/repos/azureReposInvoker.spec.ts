// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { WebApi } from 'azure-devops-node-api'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { Comment, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { expect } from 'chai'
import 'reflect-metadata'
import { anyNumber, anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import GitInvoker from '../../src/git/gitInvoker'
import AzureReposInvoker from '../../src/repos/azureReposInvoker'
import CommentData from '../../src/repos/interfaces/commentData'
import PullRequestDetails from '../../src/repos/interfaces/pullRequestDetails'
import RunnerInvoker from '../../src/runners/runnerInvoker'
import * as Converter from '../../src/utilities/converter'
import Logger from '../../src/utilities/logger'
import AzureDevOpsApiWrapper from '../../src/wrappers/azureDevOpsApiWrapper'
import * as ExpectExtensions from '../testUtilities/expectExtensions'
import { resolvableInstance } from '../testUtilities/resolvableInstance'
import ErrorWithStatus from '../wrappers/errorWithStatus'

describe('azureReposInvoker.ts', function (): void {
  let gitApi: IGitApi
  let azureDevOpsApiWrapper: AzureDevOpsApiWrapper
  let gitInvoker: GitInvoker
  let logger: Logger
  let runnerInvoker: RunnerInvoker

  beforeEach((): void => {
    process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = 'https://dev.azure.com/organization'
    process.env.SYSTEM_TEAMPROJECT = 'Project'
    process.env.BUILD_REPOSITORY_ID = 'RepoID'
    process.env.PR_METRICS_ACCESS_TOKEN = 'PAT'

    gitApi = mock<IGitApi>()
    const requestHandler: IRequestHandler = mock<IRequestHandler>()
    const webApi: WebApi = mock(WebApi)
    when(webApi.getGitApi()).thenResolve(resolvableInstance(gitApi))

    azureDevOpsApiWrapper = mock(AzureDevOpsApiWrapper)
    when(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).thenReturn(instance(requestHandler))
    when(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', deepEqual(instance(requestHandler)))).thenReturn(instance(webApi))

    gitInvoker = mock(GitInvoker)
    when(gitInvoker.pullRequestId).thenReturn(10)

    logger = mock(Logger)

    runnerInvoker = mock(RunnerInvoker)
    when(runnerInvoker.loc('metrics.codeMetricsCalculator.insufficientAzureReposAccessTokenPermissions')).thenReturn('Could not access the resources. Ensure the \'PR_Metrics_Access_Token\' secret environment variable has access to \'Code\' > \'Read\' and \'Pull Request Threads\' > \'Read & write\'.')
    when(runnerInvoker.loc('metrics.codeMetricsCalculator.noAzureReposAccessToken')).thenReturn('Could not access the Personal Access Token (PAT). Add \'PR_Metrics_Access_Token\' as a secret environment variable.')
  })

  after(() => {
    delete process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
    delete process.env.SYSTEM_TEAMPROJECT
    delete process.env.BUILD_REPOSITORY_ID
    delete process.env.PR_METRICS_ACCESS_TOKEN
  })

  describe('isAccessTokenAvailable', (): void => {
    it('should return null when the token exists', (): void => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      const result: string | null = azureReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* AzureReposInvoker.isAccessTokenAvailable')).once()
    })

    it('should return a string when the token does not exist', (): void => {
      // Arrange
      delete process.env.PR_METRICS_ACCESS_TOKEN
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      const result: string | null = azureReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal('Could not access the Personal Access Token (PAT). Add \'PR_Metrics_Access_Token\' as a secret environment variable.')
      verify(logger.logDebug('* AzureReposInvoker.isAccessTokenAvailable')).once()
    })
  })

  describe('getTitleAndDescription()', (): void => {
    {
      const testCases: Array<string | undefined> = [
        undefined,
        ''
      ]

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when SYSTEM_TEAMPROJECT is set to the invalid value '${Converter.toString(variable)}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_TEAMPROJECT
          } else {
            process.env.SYSTEM_TEAMPROJECT = variable
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<PullRequestDetails> = async () => await azureReposInvoker.getTitleAndDescription()

          // Assert
          await ExpectExtensions.toThrowAsync(func, `'SYSTEM_TEAMPROJECT', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${Converter.toString(variable)}'.`)
          verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })
    }

    {
      const testCases: Array<string | undefined> = [
        undefined,
        ''
      ]

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when BUILD_REPOSITORY_ID is set to the invalid value '${Converter.toString(variable)}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.BUILD_REPOSITORY_ID
          } else {
            process.env.BUILD_REPOSITORY_ID = variable
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<PullRequestDetails> = async () => await azureReposInvoker.getTitleAndDescription()

          // Assert
          await ExpectExtensions.toThrowAsync(func, `'BUILD_REPOSITORY_ID', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${Converter.toString(variable)}'.`)
          verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })
    }

    {
      const testCases: Array<string | undefined> = [
        undefined,
        ''
      ]

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when PR_METRICS_ACCESS_TOKEN is set to the invalid value '${Converter.toString(variable)}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.PR_METRICS_ACCESS_TOKEN
          } else {
            process.env.PR_METRICS_ACCESS_TOKEN = variable
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<PullRequestDetails> = async () => await azureReposInvoker.getTitleAndDescription()

          // Assert
          await ExpectExtensions.toThrowAsync(func, `'PR_METRICS_ACCESS_TOKEN', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${Converter.toString(variable)}'.`)
          verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })
    }

    {
      const testCases: Array<string | undefined> = [
        undefined,
        ''
      ]

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when SYSTEM_TEAMFOUNDATIONCOLLECTIONURI is set to the invalid value '${Converter.toString(variable)}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
          } else {
            process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = variable
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<PullRequestDetails> = async () => await azureReposInvoker.getTitleAndDescription()

          // Assert
          await ExpectExtensions.toThrowAsync(func, `'SYSTEM_TEAMFOUNDATIONCOLLECTIONURI', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${Converter.toString(variable)}'.`)
          verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
          verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
        })
      })
    }

    {
      const testCases: number[] = [
        401,
        403,
        404
      ]

      testCases.forEach((statusCode: number): void => {
        it(`should throw when the access token has insufficient access and the API call returns status code '${statusCode}'`, async (): Promise<void> => {
          // Arrange
          const error: ErrorWithStatus = new ErrorWithStatus('Test')
          error.statusCode = statusCode
          when(gitApi.getPullRequestById(10, 'Project')).thenThrow(error)
          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<PullRequestDetails> = async () => await azureReposInvoker.getTitleAndDescription()

          // Assert
          const result: any = await ExpectExtensions.toThrowAsync(func, 'Could not access the resources. Ensure the \'PR_Metrics_Access_Token\' secret environment variable has access to \'Code\' > \'Read\' and \'Pull Request Threads\' > \'Read & write\'.')
          expect(result.internalMessage).to.equal('Test')
          verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
          verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
          verify(gitApi.getPullRequestById(10, 'Project')).once()
          verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })
    }

    it('should return the title and description when available', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({
        title: 'Title',
        description: 'Description'
      })
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      const result: PullRequestDetails = await azureReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{"title":"Title","description":"Description"}')).once()
    })

    it('should return the title and description when available and called multiple times', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({
        title: 'Title',
        description: 'Description'
      })
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.getTitleAndDescription()
      const result: PullRequestDetails = await azureReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
      verify(logger.logDebug('{"title":"Title","description":"Description"}')).twice()
    })

    it('should return the title when the description is unavailable', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({
        title: 'Title'
      })
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      const result: PullRequestDetails = await azureReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal(undefined)
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{"title":"Title"}')).once()
    })

    it('should throw when the title is unavailable', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      const func: () => Promise<PullRequestDetails> = async () => await azureReposInvoker.getTitleAndDescription()

      // Assert
      await ExpectExtensions.toThrowAsync(func, '\'title\', accessed within \'AzureReposInvoker.getTitleAndDescription()\', is invalid, null, or undefined \'undefined\'.')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })
  })

  describe('getComments()', (): void => {
    {
      const testCases: number[] = [
        401,
        403,
        404
      ]

      testCases.forEach((statusCode: number): void => {
        it(`should throw when the access token has insufficient access and the API call returns status code '${statusCode}'`, async (): Promise<void> => {
          // Arrange
          const error: ErrorWithStatus = new ErrorWithStatus('Test')
          error.statusCode = statusCode
          when(gitApi.getThreads('RepoID', 10, 'Project')).thenThrow(error)
          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<CommentData> = async () => await azureReposInvoker.getComments()

          // Assert
          const result: any = await ExpectExtensions.toThrowAsync(func, 'Could not access the resources. Ensure the \'PR_Metrics_Access_Token\' secret environment variable has access to \'Code\' > \'Read\' and \'Pull Request Threads\' > \'Read & write\'.')
          expect(result.internalMessage).to.equal('Test')
          verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
          verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
          verify(gitApi.getThreads('RepoID', 10, 'Project')).once()
          verify(logger.logDebug('* AzureReposInvoker.getComments()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })
    }

    it('should return the result when called with a pull request comment', async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve([{ id: 1, status: 1, comments: [{ content: 'Content' }] }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      const result: CommentData = await azureReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(1)
      expect(result.pullRequestComments[0]?.id).to.equal(1)
      expect(result.pullRequestComments[0]?.content).to.equal('Content')
      expect(result.pullRequestComments[0]?.status).to.equal(CommentThreadStatus.Active)
      expect(result.fileComments.length).to.equal(0)
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getThreads('RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getComments()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('[{"id":1,"status":1,"comments":[{"content":"Content"}]}]')).once()
    })

    it('should return the result when called with a file comment', async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve([{ id: 1, status: 1, comments: [{ content: 'Content' }], threadContext: { filePath: '/file.ts' } }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      const result: CommentData = await azureReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(0)
      expect(result.fileComments.length).to.equal(1)
      expect(result.fileComments[0]?.id).to.equal(1)
      expect(result.fileComments[0]?.content).to.equal('Content')
      expect(result.fileComments[0]?.status).to.equal(CommentThreadStatus.Active)
      expect(result.fileComments[0]?.fileName).to.equal('file.ts')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getThreads('RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getComments()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('[{"id":1,"status":1,"comments":[{"content":"Content"}],"threadContext":{"filePath":"/file.ts"}}]')).once()
    })

    it('should return the result when called with both a pull request and file comment', async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve(
        [
          { id: 1, status: 1, comments: [{ content: 'PR Content' }] },
          { id: 2, status: 1, comments: [{ content: 'File Content' }], threadContext: { filePath: '/file.ts' } }
        ])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      const result: CommentData = await azureReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(1)
      expect(result.pullRequestComments[0]?.id).to.equal(1)
      expect(result.pullRequestComments[0]?.content).to.equal('PR Content')
      expect(result.pullRequestComments[0]?.status).to.equal(CommentThreadStatus.Active)
      expect(result.fileComments.length).to.equal(1)
      expect(result.fileComments[0]?.id).to.equal(2)
      expect(result.fileComments[0]?.content).to.equal('File Content')
      expect(result.fileComments[0]?.status).to.equal(CommentThreadStatus.Active)
      expect(result.fileComments[0]?.fileName).to.equal('file.ts')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getThreads('RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getComments()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('[{"id":1,"status":1,"comments":[{"content":"PR Content"}]},{"id":2,"status":1,"comments":[{"content":"File Content"}],"threadContext":{"filePath":"/file.ts"}}]')).once()
    })

    it('should return the result when called multiple times', async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve([{ id: 1, status: 1, comments: [{ content: 'Content' }] }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.getComments()
      const result: CommentData = await azureReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(1)
      expect(result.pullRequestComments[0]?.id).to.equal(1)
      expect(result.pullRequestComments[0]?.content).to.equal('Content')
      expect(result.pullRequestComments[0]?.status).to.equal(CommentThreadStatus.Active)
      expect(result.fileComments.length).to.equal(0)
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getThreads('RepoID', 10, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getComments()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
      verify(logger.logDebug('[{"id":1,"status":1,"comments":[{"content":"Content"}]}]')).twice()
    })

    it('should throw when provided with a payload with no ID', async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve([{ status: 1, comments: [{ content: 'Content' }] }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      const func: () => Promise<CommentData> = async () => await azureReposInvoker.getComments()

      // Assert
      await ExpectExtensions.toThrowAsync(func, '\'commentThread[0].id\', accessed within \'AzureReposInvoker.convertPullRequestComments()\', is invalid, null, or undefined \'undefined\'.')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getThreads('RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getComments()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('[{"status":1,"comments":[{"content":"Content"}]}]')).once()
    })

    it('should continue if the payload has no status', async (): Promise<void> => {
      // Arrange
      const getThreadsResult: GitPullRequestCommentThread[] = [
        { id: 1, comments: [{ content: 'PR Content' }] },
        { id: 2, comments: [{ content: 'File Content' }], threadContext: { filePath: '/file.ts' } }
      ]
      when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve(getThreadsResult)
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      const result: CommentData = await azureReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(1)
      expect(result.pullRequestComments[0]?.id).to.equal(1)
      expect(result.pullRequestComments[0]?.content).to.equal('PR Content')
      expect(result.pullRequestComments[0]?.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileComments.length).to.equal(1)
      expect(result.fileComments[0]?.id).to.equal(2)
      expect(result.fileComments[0]?.content).to.equal('File Content')
      expect(result.fileComments[0]?.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileComments[0]?.fileName).to.equal('file.ts')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getThreads('RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getComments()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug(JSON.stringify(getThreadsResult))).once()
    })

    {
      const testCases: GitPullRequestCommentThread[] = [
        { id: 1, status: 1 },
        { id: 1, status: 1, comments: [] },
        { id: 1, status: 1, comments: [{}] },
        { id: 1, status: 1, comments: [{ content: '' }] },
        { id: 1, status: 1, comments: [{ content: 'Content' }], threadContext: {} },
        { id: 1, status: 1, comments: [{ content: 'Content' }], threadContext: { filePath: '' } },
        { id: 1, status: 1, comments: [{ content: 'Content' }], threadContext: { filePath: '/' } }
      ]

      testCases.forEach((commentThread: GitPullRequestCommentThread): void => {
        it(`should skip the comment with the malformed payload '${JSON.stringify(commentThread)}'`, async (): Promise<void> => {
          // Arrange
          const getThreadsResult: GitPullRequestCommentThread[] = [
            commentThread,
            { id: 2, status: 1, comments: [{ content: 'PR Content' }] },
            { id: 3, status: 1, comments: [{ content: 'File Content' }], threadContext: { filePath: '/file.ts' } }
          ]
          when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve(getThreadsResult)
          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const result: CommentData = await azureReposInvoker.getComments()

          // Assert
          expect(result.pullRequestComments.length).to.equal(1)
          expect(result.pullRequestComments[0]?.id).to.equal(2)
          expect(result.pullRequestComments[0]?.content).to.equal('PR Content')
          expect(result.pullRequestComments[0]?.status).to.equal(CommentThreadStatus.Active)
          expect(result.fileComments.length).to.equal(1)
          expect(result.fileComments[0]?.id).to.equal(3)
          expect(result.fileComments[0]?.content).to.equal('File Content')
          expect(result.fileComments[0]?.status).to.equal(CommentThreadStatus.Active)
          expect(result.fileComments[0]?.fileName).to.equal('file.ts')
          verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
          verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
          verify(gitApi.getThreads('RepoID', 10, 'Project')).once()
          verify(logger.logDebug('* AzureReposInvoker.getComments()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
          verify(logger.logDebug(JSON.stringify(getThreadsResult))).once()
        })
      })
    }
  })

  describe('setTitleAndDescription()', (): void => {
    {
      const testCases: number[] = [
        401,
        403,
        404
      ]

      testCases.forEach((statusCode: number): void => {
        it(`should throw when the access token has insufficient access and the API call returns status code '${statusCode}'`, async (): Promise<void> => {
          // Arrange
          const error: ErrorWithStatus = new ErrorWithStatus('Test')
          error.statusCode = statusCode
          when(gitApi.updatePullRequest(anything(), 'RepoID', 10, 'Project')).thenThrow(error)
          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<void> = async () => await azureReposInvoker.setTitleAndDescription('Title', 'Description')

          // Assert
          const result: any = await ExpectExtensions.toThrowAsync(func, 'Could not access the resources. Ensure the \'PR_Metrics_Access_Token\' secret environment variable has access to \'Code\' > \'Read\' and \'Pull Request Threads\' > \'Read & write\'.')
          expect(result.internalMessage).to.equal('Test')
          verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
          verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
          verify(gitApi.updatePullRequest(anything(), 'RepoID', 10, 'Project')).once()
          verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })
    }

    it('should not call the API when the title and description are null', async (): Promise<void> => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.setTitleAndDescription(null, null)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).never()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).never()
      verify(gitApi.updatePullRequest(anything(), 'RepoID', 10, 'Project')).never()
      verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).never()
    })

    it('should call the API when the title is valid', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        title: 'Title'
      }
      when(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.setTitleAndDescription('Title', null)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API when the description is valid', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        description: 'Description'
      }
      when(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.setTitleAndDescription(null, 'Description')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API when both the title and description are valid', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        title: 'Title',
        description: 'Description'
      }
      when(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.setTitleAndDescription('Title', 'Description')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API when both the title and description are valid and called multiple times', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        title: 'Title',
        description: 'Description'
      }
      when(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.setTitleAndDescription('Title', 'Description')
      await azureReposInvoker.setTitleAndDescription('Title', 'Description')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
      verify(logger.logDebug('{}')).twice()
    })
  })

  describe('createComment()', (): void => {
    {
      const testCases: number[] = [
        401,
        403,
        404
      ]

      testCases.forEach((statusCode: number): void => {
        it(`should throw when the access token has insufficient access and the API call returns status code '${statusCode}'`, async (): Promise<void> => {
          // Arrange
          const error: ErrorWithStatus = new ErrorWithStatus('Test')
          error.statusCode = statusCode
          when(gitApi.createThread(anything(), 'RepoID', 10, 'Project')).thenThrow(error)
          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<void> = async () => await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active, 'file.ts')

          // Assert
          const result: any = await ExpectExtensions.toThrowAsync(func, 'Could not access the resources. Ensure the \'PR_Metrics_Access_Token\' secret environment variable has access to \'Code\' > \'Read\' and \'Pull Request Threads\' > \'Read & write\'.')
          expect(result.internalMessage).to.equal('Test')
          verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
          verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
          verify(gitApi.createThread(anything(), 'RepoID', 10, 'Project')).once()
          verify(logger.logDebug('* AzureReposInvoker.createComment()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })
    }

    it('should call the API for no file', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: 'Comment Content' }],
        status: CommentThreadStatus.Active
      }
      when(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.createComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API for no file when called multiple times', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: 'Comment Content' }],
        status: CommentThreadStatus.Active
      }
      when(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active)
      await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.createComment()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
      verify(logger.logDebug('{}')).twice()
    })

    it('should call the API for a file', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: 'Comment Content' }],
        status: CommentThreadStatus.Active,
        threadContext: {
          filePath: '/file.ts',
          rightFileStart: {
            line: 1,
            offset: 1
          },
          rightFileEnd: {
            line: 1,
            offset: 2
          }
        }
      }
      when(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active, 'file.ts')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.createComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API for a deleted file', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: 'Comment Content' }],
        status: CommentThreadStatus.Active,
        threadContext: {
          filePath: '/file.ts',
          leftFileStart: {
            line: 1,
            offset: 1
          },
          leftFileEnd: {
            line: 1,
            offset: 2
          }
        }
      }
      when(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active, 'file.ts', true)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.createComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })
  })

  describe('updateComment()', (): void => {
    {
      const testCases: number[] = [
        401,
        403,
        404
      ]

      testCases.forEach((statusCode: number): void => {
        it(`should throw when the access token has insufficient access for the updateComment API and the API call returns status code '${statusCode}'`, async (): Promise<void> => {
          // Arrange
          const error: ErrorWithStatus = new ErrorWithStatus('Test')
          error.statusCode = statusCode
          when(gitApi.updateComment(anything(), 'RepoID', 10, 20, 1, 'Project')).thenThrow(error)
          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<void> = async () => await azureReposInvoker.updateComment(20, 'Content', CommentThreadStatus.Active)

          // Assert
          const result: any = await ExpectExtensions.toThrowAsync(func, 'Could not access the resources. Ensure the \'PR_Metrics_Access_Token\' secret environment variable has access to \'Code\' > \'Read\' and \'Pull Request Threads\' > \'Read & write\'.')
          expect(result.internalMessage).to.equal('Test')
          verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
          verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
          verify(gitApi.updateComment(anything(), 'RepoID', 10, 20, 1, 'Project')).once()
          verify(logger.logDebug('* AzureReposInvoker.updateComment()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })
    }

    {
      const testCases: number[] = [
        401,
        403,
        404
      ]

      testCases.forEach((status: number): void => {
        it(`should throw when the access token has insufficient access for the updateComment API and the API call returns status '${status}'`, async (): Promise<void> => {
          // Arrange
          const error: ErrorWithStatus = new ErrorWithStatus('Test')
          error.status = status
          when(gitApi.updateComment(anything(), 'RepoID', 10, 20, 1, 'Project')).thenResolve({})
          when(gitApi.updateThread(anything(), 'RepoID', 10, 20, 'Project')).thenThrow(error)
          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<void> = async () => await azureReposInvoker.updateComment(20, 'Content', CommentThreadStatus.Active)

          // Assert
          const result: any = await ExpectExtensions.toThrowAsync(func, 'Could not access the resources. Ensure the \'PR_Metrics_Access_Token\' secret environment variable has access to \'Code\' > \'Read\' and \'Pull Request Threads\' > \'Read & write\'.')
          expect(result.internalMessage).to.equal('Test')
          verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
          verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
          verify(gitApi.updateComment(anything(), 'RepoID', 10, 20, 1, 'Project')).once()
          verify(gitApi.updateThread(anything(), 'RepoID', 10, 20, 'Project')).once()
          verify(logger.logDebug('* AzureReposInvoker.updateComment()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
          verify(logger.logDebug('{}')).once()
        })
      })
    }

    it('should call the APIs when both the comment content and the thread status are updated', async (): Promise<void> => {
      // Arrange
      const expectedComment: Comment = {
        content: 'Content'
      }
      when(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 1, 'Project')).thenResolve({})
      const expectedCommentThread: GitPullRequestCommentThread = {
        status: CommentThreadStatus.Active
      }
      when(gitApi.updateThread(deepEqual(expectedCommentThread), 'RepoID', 10, 20, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.updateComment(20, 'Content', CommentThreadStatus.Active)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 1, 'Project')).once()
      verify(gitApi.updateThread(deepEqual(expectedCommentThread), 'RepoID', 10, 20, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).twice()
    })

    it('should call the API when the comment content is updated', async (): Promise<void> => {
      // Arrange
      const expectedComment: Comment = {
        content: 'Content'
      }
      when(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 1, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.updateComment(20, 'Content', null)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 1, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API when the thread status is updated', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        status: CommentThreadStatus.Active
      }
      when(gitApi.updateThread(deepEqual(expectedComment), 'RepoID', 10, 20, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.updateComment(20, null, CommentThreadStatus.Active)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updateThread(deepEqual(expectedComment), 'RepoID', 10, 20, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call no APIs when neither the comment content nor the thread status are updated', async (): Promise<void> => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.updateComment(20, null, null)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).never()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).never()
      verify(gitApi.updateComment(anything(), 'RepoID', 10, 20, 1, 'Project')).never()
      verify(gitApi.updateThread(anything(), 'RepoID', 10, 20, 'Project')).never()
      verify(logger.logDebug('* AzureReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).never()
    })

    it('should call the API when called multiple times', async (): Promise<void> => {
      // Arrange
      const expectedComment: Comment = {
        content: 'Content'
      }
      when(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 1, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.updateComment(20, 'Content', null)
      await azureReposInvoker.updateComment(20, 'Content', null)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 1, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.updateComment()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
      verify(logger.logDebug('{}')).twice()
    })
  })

  describe('deleteCommentThread()', (): void => {
    {
      const testCases: number[] = [
        401,
        403,
        404
      ]

      testCases.forEach((statusCode: number): void => {
        it(`should throw when the access token has insufficient access and the API call returns status code '${statusCode}'`, async (): Promise<void> => {
          // Arrange
          const error: ErrorWithStatus = new ErrorWithStatus('Test')
          error.statusCode = statusCode
          when(gitApi.deleteComment('RepoID', 10, 20, 1, 'Project')).thenThrow(error)
          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

          // Act
          const func: () => Promise<void> = async () => await azureReposInvoker.deleteCommentThread(20)

          // Assert
          const result: any = await ExpectExtensions.toThrowAsync(func, 'Could not access the resources. Ensure the \'PR_Metrics_Access_Token\' secret environment variable has access to \'Code\' > \'Read\' and \'Pull Request Threads\' > \'Read & write\'.')
          expect(result.internalMessage).to.equal('Test')
          verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
          verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
          verify(gitApi.deleteComment('RepoID', 10, 20, 1, 'Project')).once()
          verify(logger.logDebug('* AzureReposInvoker.deleteCommentThread()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })
    }

    it('should call the API for a single comment', async (): Promise<void> => {
      // Arrange
      when(gitApi.deleteComment('RepoID', 10, 20, 1, 'Project')).thenResolve()
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.deleteCommentThread(20)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.deleteComment('RepoID', 10, 20, 1, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.deleteCommentThread()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
    })

    it('should call the API when called multiple times', async (): Promise<void> => {
      // Arrange
      when(gitApi.deleteComment('RepoID', 10, anyNumber(), 1, 'Project')).thenResolve()
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(gitInvoker), instance(logger), instance(runnerInvoker))

      // Act
      await azureReposInvoker.deleteCommentThread(20)
      await azureReposInvoker.deleteCommentThread(30)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('PAT')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.deleteComment('RepoID', 10, 20, 1, 'Project')).once()
      verify(gitApi.deleteComment('RepoID', 10, 30, 1, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.deleteCommentThread()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
    })
  })
})
