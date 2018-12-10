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

// Store the query to GitHub API in a template string
const GET_ORGANIZATION = `
  {
    organization(login: "Google") {
      name
      url
    }
  }
`

class App extends Component {
  state = {
    path: 'the-road-to-learn-react/the-road-to-learn-react',
    organization: null,
    errors: null,
  };

  componentDidMount() {
    this.onFetchFromGithub();
  }

  onChange = event => {
    this.setState({path: event.target.value});
  };

  onSubmit = event => {
    // fetch data
    event.preventDefault();
  };

  // Use axios to perform HTTP POST request with a GraphQL query as payload.
  // Fetch the organization information from Github API.
  onFetchFromGithub = () => {
    axiosGitHubGraphQL
      .post('', {query: GET_ORGANIZATION})
      .then(result => 
        this.setState(() => ({
          organization: result.data.data.organization,
          errors: result.data.errors,
        })),
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
    </div>
  );
};

export default App;





















