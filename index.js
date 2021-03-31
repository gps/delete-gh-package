const { Octokit } = require("@octokit/core");
const { request } = require("@octokit/request");
const { withCustomRequest } = require("@octokit/graphql");
const core = require("@actions/core");

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
    const query = `query {
        repository(owner: "${owner}", name: "${repo}") {
          name
          packages(first: 20, packageType: ${package_type.toUpperCase()}) {
            totalCount,
            nodes {
              name,
              id
            }
          }
        }
    }`;

    let requestCounter = 0;
    const myRequest = request.defaults({
        headers: {
            authorization: `token ${token}`,
        },
        request: {
          hook(request, options) {
            requestCounter++;
            return request(options);
          },
        },
    });

    try {
        const myGraphql = withCustomRequest(myRequest);
        const result = await myGraphql(query);

        if (result.repository.packages.nodes == null) {
            console.log(`No packages found in the org`);
            return
        }
        var packageNames = [];
        const packages = result.repository.packages.nodes;
        for(i = 0; i < packages.length; i++) {
            packageNames.push(packages[i].name)
        }
        return packageNames;
    } catch (error) {
        core.setFailed(error);
        return;
    }
}

async function run() {
    const org = core.getInput("ORG");
    var owner = core.getInput("OWNER");
    const repo = core.getInput("REPO");
    const package_type = core.getInput("PACKAGE_TYPE");
    const version =  core.getInput("VERSION");
    const token = core.getInput("TOKEN");

    if (org != null && org != "" && owner != null && owner != "") {
        if (org != owner) {
            core.setFailed(`ORG and OWNER cannot have different values`);
            return;
        }
    }
    if ((org == null || org == "") && (owner == null || owner == "")) {
        core.setFailed(`both ORG and OWNER cannot be empty`);
        return;
    }
    if ((owner == null || owner == "") && org != null && org != "") {
        owner = org;
    }
    var packageNames = await getPackageNames(owner, repo, package_type, token)
    for (i = 0; i< packageNames.length; i++) {
        findAndDeletePackageVersion(org, package_type, packageNames[i], version, token);
    }
}

run();
