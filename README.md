# delete-gh-package
A GitHub Action that can delete a particular version of a package published to Github Packages.

## Inputs

### `ORG`

Name of the organisation in which the github package was published. If org is not given, package will be considered to belong to a user.

### `OWNER`

Name of the owner of the repository. To delete a that package is published by a user and doesn't belong to an organisation,
this value value should be set. Both ORG and OWNER cannot be empty.

### `REPO`

Name of the repository from where the package was published.

**Required**

### `PACKAGE_TYPE`

The type of supported package. Can be one of npm, maven, rubygems, nuget, docker, or container.

**Required**

### `VERSION`

Version of the package to be deleted.

**Required**

### `TOKEN`

Auth token with delete permission.

**Required**

## Example Usage

```yml
- name: Delete package version
  uses: gps/delete-gh-package@master
  with:
    ORG: {{ORG_NAME}}
    REPO: {{REPO_NAME}}
    PACKAGE_TYPE: npm
    VERSION: 0.0.1
    TOKEN: ${{ secrets.TEST_PACKAGE__RELEASE_DELETE_KEY }}
```

```yml
- name: Delete package version
  uses: gps/delete-gh-package@master
  with:
    OWNER: {{OWNER_NAME}}
    REPO: {{REPO_NAME}}
    PACKAGE_TYPE: npm
    VERSION: 0.0.1
    TOKEN: ${{ secrets.TEST_PACKAGE__RELEASE_DELETE_KEY }}
```

## Example to take input from user and manually trigger github action

``` yml
name: Delete Package
on:
 workflow_dispatch:
  inputs:
    version:
      description: 'Version of the package to be deleted'     
      required: true
jobs:
  delete-package:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Delete package
        uses: gps/delete-gh-package
        with:
          ORG: {{ORG_NAME}}
          REPO: {{REPO_NAME}}
          PACKAGE_TYPE: npm
          VERSION: ${{ github.event.inputs.version }}
          TOKEN: ${{ secrets.TEST_PACKAGE__RELEASE_DELETE_KEY }}
```
