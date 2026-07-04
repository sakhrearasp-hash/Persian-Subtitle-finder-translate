const OS = require('opensubtitles-api');
const OpenSubtitles = new OS('TemporaryUserAgent');
OpenSubtitles.search({
    query: 'Inception',
    sublanguageid: 'eng'
}).then(subtitles => {
    console.log(Object.keys(subtitles));
    console.log(subtitles.en.url);
}).catch(console.error);
