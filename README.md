# delete-gh-package
A GitHub Action that can delete a particular version of a package published to Github Packages.

## Inputs

### `ORG`

Name of the organisation in which the github package was published. If org is not given, package will be considered to belong to a user.

**Required**

### `PACKAGE_TYPE`

The type of supported package. Can be one of npm, maven, rubygems, nuget, docker, or container.

**Required**

### `PACKAGE_NAME`

Name of the package.

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
    ORG: ORG
    PACKAGE_TYPE: npm
    PACKAGE_NAME: package
    VERSION: 0.0.1
    TOKEN: ${{ secrets.TEST_PACKAGE__RELEASE_DELETE_KEY }}
```

```yml
- name: Delete package version
  uses: gps/delete-gh-package@master
  with:
    PACKAGE_TYPE: npm
    PACKAGE_NAME: package
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
          PACKAGE_TYPE: npm
          PACKAGE_NAME: package
          VERSION: ${{ github.event.inputs.version }}
          TOKEN: ${{ secrets.TEST_PACKAGE__RELEASE_DELETE_KEY }}
```
