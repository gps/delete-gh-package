const { Octokit } = require("@octokit/core");
const { request } = require("@octokit/request");
const { withCustomRequest } = require("@octokit/graphql");
const core = require("@actions/core");
const env = process.env;

// getVersionId returns version id for a given version
function getVersionId(packages, version)  {
    for (var i=0; i < packages.length; i++) {
        if (packages[i].name === version) {
            return packages[i].id;
        }
    }
}

// findAndDeletePackageVersion finds version id of the package for a given version
// and deletes the particular version
async function findAndDeletePackageVersion(org, package_type, package_name, version, token) {
    const octokit = new Octokit({ auth: token });

    // Handle response
    octokit.hook.after("request", async (response, options) => {
        const version_id = getVersionId(response.data, version);
        if (version_id == null) {
            console.log(`Version ${version} not found in package ${package_name}`);
        } else {
            deletePackageVersion(org, package_type, package_name, version, version_id, token);
        }
    });

    // Handle error
    octokit.hook.error("request", async (error, options) => {
        core.setFailed(error.message);
        return;
    });

    if (org === null || org === "") {
        await octokit.request('GET /user/packages/{package_type}/{package_name}/versions', {
            package_type: package_type,
            package_name: package_name
        });
    } else {
        await octokit.request('GET /orgs/{org}/packages/{package_type}/{package_name}/versions', {
            org: org,
            package_type: package_type,
            package_name: package_name
        });
    }
}

// deletePackageVersion deletes a package version
async function deletePackageVersion(org, package_type, package_name, version, version_id, token) {
    const octokit = new Octokit({ auth: token });
    // Handle response
    octokit.hook.after("request", async (response, options) => {
        console.log(`Deleted version ${version} for package ${package_name} successfully`);
    });

    // Handle error
    octokit.hook.error("request", async (error, options) => {
        if (error != null) {
            console.log(`Unable to delete version ${version} for package: ${package_name}. Error: ${error}`)
            core.setFailed(error);
            return;
        }
    });

    if (org === null || org === "") {
        await octokit.request('DELETE /user/packages/{package_type}/{package_name}/versions/{version_id}', {
            package_type: package_type,
            package_name: package_name,
            version_id: version_id
        });
    } else {
        await octokit.request('DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{version_id}', {
            org: org,
            package_type: package_type,
            package_name: package_name,
            version_id: version_id
        });
    }
}

// getPackageNames searches packages for a given repo and returns the list of package names.
async function getPackageNames(owner, repo, package_type, token) {
    var packages = []
    let continuePagination = false
    let afterId = ""
    do {
        const query = `query {
            repository(owner: "${owner}", name: "${repo}") {
              name
              packages(first: 20, after: "${afterId}", packageType: ${package_type.toUpperCase()}) {
                totalCount
                nodes {
                  name
                  id
                }
                pageInfo {
                    endCursor
                    hasNextPage
                }
              }
            }
        }`;
        try {
            const myRequest = request.defaults({
                headers: {
                    authorization: `token ${token}`,
                },
                request: {
                  hook(request, options) {
                    return request(options);
                  },
                },
            });
            const myGraphql = withCustomRequest(myRequest);
            const result = await myGraphql(query);
            if (result.repository.packages.nodes == null) {
                console.log(`No packages found in the org`);
                return
            }
            packages.push(...result.repository.packages.nodes);
            continuePagination = result.repository.packages.pageInfo.hasNextPage;
            afterId = result.repository.packages.pageInfo.endCursor;
        } catch (error) {
            core.setFailed(error);
            return;
        }
    } while(continuePagination)

    var packageNames = [];
    for(i = 0; i < packages.length; i++) {
        packageNames.push(packages[i].name)
    }
    return packageNames;
}

async function run() {
    const org = core.getInput("ORG");
    const package_type = core.getInput("PACKAGE_TYPE");
    const version =  core.getInput("VERSION");
    const token = core.getInput("TOKEN");
    const owner = env.GITHUB_REPOSITORY.split("/")[0];
    const repo = env.GITHUB_REPOSITORY.split("/")[1];

    var packageNames = await getPackageNames(owner, repo, package_type, token)
    for (i = 0; i< packageNames.length; i++) {
        findAndDeletePackageVersion(org, package_type, packageNames[i], version, token);
    }
}

run();
