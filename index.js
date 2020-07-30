const Reddit = require('reddit');
const axios = require('axios');

const iftttKey = process.env.IFTTT_API_KEY;

const reddit = new Reddit({
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASSWORD,
    appId: process.env.REDDIT_APP_ID,
    appSecret: process.env.REDDIT_APP_SECRET,
    userAgent: process.env.REDDIT_USERAGENT
});

const getStatus = (comment) => {
    const regex = /.*Status.*:.*(Applied|Accepted|Rejected).*/;
    const match = regex.exec(comment);
    return match?.[1];
}

const check = async () => {
    const response = await reddit.get('/r/omscs/comments/h786ux');
    const statuses = response
        .flatMap(listing => listing.data.children) // get each comment object
        .map(comment => comment.data.body) // get string body of each comment
        .map(getStatus) // get the status string (Applied, Accepted, or Rejected)
        .filter(status => status) // filter out comments without a status
    
    const applied = statuses.reduce((sum, status) => sum + (status === 'Applied' ? 1 : 0), 0);
    const accepted = statuses.reduce((sum, status) => sum + (status === 'Accepted' ? 1 : 0), 0);
    const rejected = statuses.reduce((sum, status) => sum + (status === 'Rejected' ? 1 : 0), 0);
    console.log(`Applied: ${applied}\nAccepted: ${accepted}\nRejected: ${rejected}`);
    if (accepted + rejected > 0) {
        axios.get(`https://maker.ifttt.com/trigger/decision_posted/with/key/${iftttKey}?value1=${applied}&value2=${accepted}&value3=${rejected}`);
    }
}

setInterval(check, 3600000);
