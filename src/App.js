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
  query ($organization: String!, $repository: String!) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        name
        url
        issues(last: 5, states: [OPEN]) {
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
        }
      }
    }
  }
`
// Use axios to send a request with the query and return a promise
const getIssuesOfRepo = path => {
  const [organization, repository] = path.split('/');
  return axiosGitHubGraphQL.post('', {
      query: GET_ISSUES_OF_REPOSITORY,
      variables: {organization, repository},
  });
};

// Higher order function for this.setState() method and to get the result from the promise
const resolveIssuesQuery = queryResult => () => ({
  organization: queryResult.data.data.organization,
  errors: queryResult.data.errors,
});

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
  onFetchFromGithub = path => {
    getIssuesOfRepo(path).then(queryResult => 
      this.setState(resolveIssuesQuery(queryResult)),
    );
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

        {organization ? (<Organization organization={organization} errors={errors} />) : (<p>No information</p>)}

      </div>
    );
  }
}

const Organization = ({organization, errors}) => {
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
      <Repository repository={organization.repository} />
    </div>
  );
};

const Repository = ({repository}) => (
  <div>
    <p>
      <strong>In Repository </strong>
      <a href={repository.url}>{repository.name}</a>
    </p>

    <IssueList issues={repository.issues.edges} />
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





















