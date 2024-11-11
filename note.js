import axios from "axios";
import moment from "moment"
import { Octokit } from "octokit"

const GH_OWNER = '4bigchoi23';
const GH_REPO = 'tmp';
const GH_BRANCH = 'note';
const YTMostPopular = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=10&regionCode=KR&key=' + process.env.GG_TOKEN;

const octokit = new Octokit({
    auth: process.env.GH_TOKEN
});

// const {
//     data: { login },
// } = await octokit.rest.users.getAuthenticated();
// console.log("Hello, %s", login);

try {

    // repo info
    const repo = await octokit.request("GET /repos/{owner}/{repo}/branches/{branch}", {
        owner: GH_OWNER,
        repo: GH_REPO,
        branch: GH_BRANCH,
    });
    // console.log(repo.data);

    const dateStr = moment().format('YYYYMMDD');
    const newBranch = GH_BRANCH + '-' + dateStr;
    // console.log(newBranch);

    // create branch
    const branch = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
        owner: GH_OWNER,
        repo: GH_REPO,
        ref: 'refs/heads/' + newBranch,
        sha: repo.data.commit.sha,
    });
    // console.log(branch.data);

    // get file contents (README.md)
    const file = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: GH_OWNER,
        repo: GH_REPO,
        path: 'README.md',
        ref: newBranch,
    });
    // console.log(file.data);

    // update file contents (README.md) && commit
    let content = "";
    content += "# 유튜브 인기급상승 (" + dateStr + ")" + "\n\n";
    content += "" + moment().format() + "\n";
    const json = await axios.get(YTMostPopular);
    // console.log(json.data.items);
    // let str = "|순위|썸네일|타이틀|\n|-|-|-|\n";
    // json.data.items.forEach((item, i) => {
    //     console.log((i + 1), item.id);
    //     str += `|${i+1}`;
    //     str += `|![썸네일](${item.snippet.thumbnails.default.url})`;
    //     str += `|[${item.snippet.title.replace(/([\[\]\(\)\|])/g, '')}](https://www.youtube.com/watch?v=${item.id})`;
    //     str += `<br>${item.snippet.publishedAt}`;
    //     str += `<br>[${item.snippet.channelTitle.replace(/([\[\]\(\)\|])/g, '')}](https://www.youtube.com/channel/${item.snippet.channelId})`;
    //     str += `|` + "\n";
    // });
    // console.log(str);
    let html = ``;
    let body = ``;
    json.data.items.forEach((item, i) => {
        body += `
            <tr>
                <td>${i+1}</td>
                <td><img src="${item.snippet.thumbnails.default.url}" alt="" /></td>
                <td>
                    <a href="https://www.youtube.com/watch?v=${item.id}" target="_blank">${item.snippet.title}</a>
                    <br /><a href="https://www.youtube.com/channel/${item.snippet.channelId}" target="_blank">${item.snippet.channelTitle}</a>
                    <br />${item.snippet.publishedAt}
                </td>
            </tr>
        `;
    });
    html = `
        <table>
            <thead>
                <tr>
                    <th nowrap>순위</th>
                    <th nowrap>썸네일</th>
                    <th nowrap>타이틀</th>
                </tr>
            </thead>
            <tbody>
                ${body}
            </tbody>
        </table>
    `;
    // console.log(html);
    content += html.replace(/([\n])[\s\t]+/g, '$1').replace(/[\n]+/g, '').trim();

    const up = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner: GH_OWNER,
        repo: GH_REPO,
        path: 'README.md',
        branch: newBranch,
        sha: file.data.sha,
        message: `docs: 유튜브 인기급상승 업데이트 (${dateStr})`,
        content: Buffer.from(content).toString('base64'),
    });
    // console.log(up.data);

    // pull request
    const pr = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
        owner: GH_OWNER,
        repo: GH_REPO,
        title: up.data.commit.message,
        // body: 'Please pull these awesome changes in!',
        head: GH_OWNER + ':' + newBranch,
        base: GH_BRANCH,
    });
    // console.log(pr.data);

    // merge
    const merge = await octokit.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
        owner: GH_OWNER,
        repo: GH_REPO,
        pull_number: pr.data.number,
        commit_title: `Merge pull request #${pr.data.number} from ${GH_OWNER}/${newBranch}`,
        commit_message: pr.data.title,
        merge_method: 'rebase',
    });
    // console.log(merge.data);

    // delete branch
    // const end = await octokit.request('DELETE /repos/{owner}/{repo}/git/refs/{ref}', {
    //     owner: GH_OWNER,
    //     repo: GH_REPO,
    //     ref: newBranch,
    // });

} catch (error) {
    console.log(`Error! Status: ${error.status}. Message: ${error.response.data.message}`)
}
