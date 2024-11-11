import axios from "axios";

const YTMostPopular = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=10&regionCode=KR&key=' + process.env.YT_KEY;

(async () => {
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

    console.log(html.replace(/([\n])[\s\t]+/g, '$1').replace(/[\n]+/g, '').trim());
})();
