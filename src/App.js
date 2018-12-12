import React, { Component } from 'react';
import axios from 'axios';

// Configure an axios client instance to make GitHub API request
const axiosGitHubGraphQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN}`,
  },
});
const TITLE = 'React GraphQL GitHub Client';

// The query to GitHub API
const GET_ISSUES_OF_REPOSITORY = `
  query (
    $organization: String!, 
    $repository: String!,
    $cursor: String
  ) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        id
        name
        url
        stargazers {
          totalCount
        }
        viewerHasStarred
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges{
            node{
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

const ADD_STAR = `
  mutation ($repositoryId: ID!) {
    addStar(input:{starrableId: $repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

const REMOVE_STAR = `
  mutation ($repositoryId: ID!) {
    removeStar(input:{starrableId: $repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

// Use axios to send a request with the query and return a promise
const getIssuesOfRepo = (path, cursor) => {
  const [organization, repository] = path.split('/');
  return axiosGitHubGraphQL.post('', {
      query: GET_ISSUES_OF_REPOSITORY,
      variables: {organization, repository, cursor},
  });
};

// Higher order function for this.setState() method and to get the result from the promise
const resolveIssuesQuery = (queryResult, cursor) => state => {
  const {data, errors} = queryResult.data;

  if (!cursor) {
    return {
      organization: data.organization,
      errors,
    };
  }
  
  const {edges: oldIssues} = state.organization.repository.issues;
  const {edges: newIssues} = data.organization.repository.issues;
  const updatedIssues = [...oldIssues, ...newIssues];

  return {
    organization: {
      ...data.organization,
      repository: {
        ...data.organization.repository,
        issues: {
          ...data.organization.repository.issues,
          edges: updatedIssues,
        },
      },
    },
    errors,
  };
};

const addStarToRepo = repositoryId => {
  return axiosGitHubGraphQL.post('', {
    query: ADD_STAR,
    variables: {repositoryId},
  });
};

const removeStarFromRepo = repositoryId => {
  return axiosGitHubGraphQL.post('', {
    query: REMOVE_STAR,
    variables: {repositoryId},
  });
};

const resolveAddStarMutation = mutationResult => state => {
  const {
    viewerHasStarred,
  } = mutationResult.data.data.addStar.starrable;
  const {totalCount} = state.organization.repository.stargazers;

  return {
    ...state,
    organization: {
      ...state.organization,
      repository: {
        ...state.organization.repository,
        viewerHasStarred,
        stargazers: {
          totalCount: totalCount + 1,
        },
      },
    },
  };
};

const resolveRemoveStarMutation = mutationResult => state => {
  const {
    viewerHasStarred,
  } = mutationResult.data.data.removeStar.starrable;
  const {totalCount} = state.organization.repository.stargazers;

  return {
    ...state,
    organization: {
      ...state.organization,
      repository: {
        ...state.organization.repository,
        viewerHasStarred,
        stargazers: {
          totalCount: totalCount - 1,
        },
      },
    },
  };
};

class App extends Component {
  state = {
    path: 'the-road-to-learn-react/the-road-to-learn-react',
    organization: null,
    errors: null,
  };

  componentDidMount() {
    this.onFetchFromGithub(this.state.path);
  }

  onChange = event => {
    this.setState({path: event.target.value});
  };

  onSubmit = event => {
    this.onFetchFromGithub(this.state.path);
    event.preventDefault();
  };

  // Use axios to perform HTTP POST request with a GraphQL query as payload.
  // Fetch the organization information from Github API.
  onFetchFromGithub = (path, cursor) => {
    getIssuesOfRepo(path, cursor).then(queryResult => 
      this.setState(resolveIssuesQuery(queryResult, cursor)),
    );
  };

  onFetchMoreIssues = () => {
    const {
      endCursor,
    } = this.state.organization.repository.issues.pageInfo;

    this.onFetchFromGithub(this.state.path, endCursor);
  };

  onStarRepository = (repositoryId, viewerHasStarred) => {
    if (!viewerHasStarred) {
      addStarToRepo(repositoryId).then(mutationResult => 
        this.setState(resolveAddStarMutation(mutationResult)),
      );
    } else {
      removeStarFromRepo(repositoryId).then(mutationResult => 
        this.setState(resolveRemoveStarMutation(mutationResult)),
      );
    }
  };

  render() {
    const {path, organization, errors} = this.state;
    return (
      <div>
        <h1>{TITLE}</h1>

        <form onSubmit={this.onSubmit}>
          <label htmlFor='url'>
            Show open issues for https://github.com/
          </label>
          <input 
            id='url'
            type='text'
            value={path}
            onChange={this.onChange}
            />
          <button type='submit'>Search</button>
        </form>

        <hr />

        {organization 
          ? (
              <Organization 
                organization={organization} 
                errors={errors} 
                onFetchMoreIssues={this.onFetchMoreIssues}
                onStarRepository={this.onStarRepository}
              />
            ) 
          : (
              <p>No information</p>
            )
        }

      </div>
    );
  }
}

const Organization = ({
  organization, 
  errors,
  onFetchMoreIssues,
  onStarRepository,
}) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong:</strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    );
  }
  return (
    <div>
      <p>
        <strong>Issues from Organization: </strong>
        <a href={organization.url}>{organization.name}</a>
      </p>
      <Repository 
        repository={organization.repository} 
        onFetchMoreIssues={onFetchMoreIssues}
        onStarRepository={onStarRepository}
      />
    </div>

  );
};

const Repository = ({
  repository, 
  onFetchMoreIssues,
  onStarRepository,
}) => (
  <div>
    <p>
      <strong>In Repository </strong>
      <a href={repository.url}>{repository.name}</a>
    </p>

    <button
      type="button"
      onClick={() => onStarRepository(repository.id, repository.viewerHasStarred)}
    >
      {repository.stargazers.totalCount}
      {repository.viewerHasStarred ? 'Unstar' : 'Star'}
    </button>

    <IssueList issues={repository.issues.edges} />

    <hr />
    {repository.issues.pageInfo.hasNextPage && (
      <button onClick={onFetchMoreIssues}>More</button>
    )}
  </div>
);

const IssueList = ({issues}) => (
  <ul>
    {issues.map(issue => (
      <li key={issue.node.id}>
        <a href={issue.node.url}>{issue.node.title}</a>
        <ReactionList reactions={issue.node.reactions.edges} />
      </li>
    ))}
  </ul>
);

const ReactionList = ({reactions}) => (
  <ul>
    {reactions.map(reaction => (
      <li key={reaction.node.id}>{reaction.node.content}</li>
    ))}
  </ul>
);

export default App;





















