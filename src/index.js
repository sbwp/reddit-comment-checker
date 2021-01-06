import Reddit from 'reddit';
import { IftttClient } from './ifttt-client';

export class RedditCommentChecker {
    constructor({ username, password, appId, appSecret, userAgent, subreddit, post, regex, stopOnMatch, stopOnNotify, iftttApiKey, iftttEvent, shouldNotify, generateIftttValues }) {
        this.redditClient = new Reddit({ username, password, appId, appSecret, userAgent });
        this.iftttClient = new IftttClient();
        this.endpoint = `/r/${subreddit}/comments/${post}`;
        this.regex = regex;
        this.iftttApiKey = iftttApiKey;
        this.iftttEvent = iftttEvent;
        this.shouldNotify = shouldNotify ?? (() => true);
        this.generateIftttValues = generateIftttValues;
        this.stopOnMatch = stopOnMatch;
        this.stopOnNotify = stopOnNotify
    }

    async check() {
        const response = await this.redditClient.get(this.endpoint);

        const comments = response.flatMap ? response.flatMap(listing => listing.data.children) : response.data.children;

        const matches = comments
            .map(comment => comment.data.body) // get string body of each comment
            .map(commentBody => this.regex.exec(commentBody)) // get the regex matches for the comment body
            .filter(match => match) // filter out comments without a match

        if (matches.length > 0) {
            const shouldNotify = this.shouldNotify(matches);

            if (shouldNotify) {
                const iftttValues = this.generateIftttValues && this.generateIftttValues(matches);
                this.iftttClient.sendNotification(this.iftttEvent, this.iftttApiKey, iftttValues);
            }

            if (this.stopOnMatch || this.stopOnNotify && shouldNotify) {
                this.stopPolling();
            }
        }
    }

    startPolling(intervalInSeconds = 3600, stopAfter) {
        if (intervalInSeconds < 1) {
            throw new Error('Cannot poll more often than once per second due to rate limiting');
        }

        this.stopPolling();
        this.intervalHandle = setInterval(() => this.check(), intervalInSeconds * 1000);

        if (stopAfter) {
            this.stopTimerHandle = setTimeout(() => this.stopPolling(), stopAfter * 1000);
        }
    }

    stopPolling() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = undefined;
        }
        
        if (this.stopTimerHandle) {
            clearTimeout(this.stopTimerHandle);
            this.stopTimerHandle = undefined;
        }
    }
}
