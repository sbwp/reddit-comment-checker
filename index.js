import Reddit from 'reddit';
import axios from 'axios';

export class RedditCommentChecker {
    constructor({ username, password, appId, appSecret, userAgent, subreddit, post, regex, stopOnMatch, iftttApiKey, iftttEvent, generateIftttValues }) {
        this.reddit = new Reddit({ username, password, appId, appSecret, userAgent });
        this.endpoint = `/r/${subreddit}/comments/${post}`;
        this.regex = regex;
        this.iftttApiKey = iftttApiKey;
        this.iftttEvent = iftttEvent;
        this.generateIftttValues = generateIftttValues;
        this.stopOnMatch = stopOnMatch;
    }

    async check() {
        const response = await this.reddit.get(this.endpoint);

        const comments = response.flatMap ? response.flatMap(listing => listing.data.children) : response.data.children;

        const matches = comments
            .map(comment => comment.data.body) // get string body of each comment
            .map(commentBody => this.regex.exec(commentBody)) // get the regex matches for the comment body
            .filter(match => match) // filter out comments without a match

        if (matches.length > 0) {
            const iftttValues = this.generateIftttValues && this.generateIftttValues(matches);

            let queryParams = '';

            if (iftttValues && iftttValues.value1) {
                queryParams += `?value1=${iftttValues.value1}`;
                if (iftttValues.value2) {
                    queryParams += `&value2=${iftttValues.value2}`;
                    if (iftttValues.value3) {
                        queryParams += `&value3=${iftttValues.value3}`
                    }
                }
            }

            axios.get(`https://maker.ifttt.com/trigger/${this.iftttEvent}/with/key/${this.iftttApiKey}${queryParams}`);

            if (this.stopOnMatch) {
                this.stopPolling();
            }
        }
    }

    startPolling(intervalInSeconds = 3600) {
        if (intervalInSeconds < 1) {
            throw new Error('Cannot poll more often than once per second');
        }
        this.stopPolling();
        this.timerHandle = setInterval(() => this.check(), intervalInSeconds * 1000);
    }

    stopPolling() {
        if (this.timerHandle) {
            clearInterval(this.timerHandle);
            this.timerHandle = undefined;
        }
    }
}
