declare module 'reddit-comment-fetcher' {
    import Reddit from 'reddit';

    export interface IftttWebhookParams {
        value1?: string;
        value2?: string;
        value3?: string;
    }

    export interface RedditCommentCheckerCreateData {
        username: string; // Reddit username to access API with
        password: string; // Reddit password for provided username
        appId: string; // Reddit App ID to access API with
        appSecret: string; // Reddit appSecret for provided App ID
        userAgent: string; // User Agent string to provide to Reddit API
        subreddit: string; // Subreddit of provided post
        post: string; // Post ID to poll comments of
        regex: RegExp; // Regular Expression to look for in comments
        stopOnMatch: boolean; // (Default = false) If true, stops polling after finding match
        stopOnNotify: boolean; // (Default = false) If true, stops polling after triggering webhook (Equivalent to stopOnMatch if shouldNotify is not provided)
        iftttApiKey: string; // API Key for IFTTT Webhook
        iftttEvent: string; // Endpoint for IFTTT Webhook
        shouldNotify: (matches: string[]) => boolean; // (Default = _ => true) Only send a notification/stop when this function returns true
        generateIftttValues: (matches: string[]) => IftttWebhookParams; // (Optional) Function to generate query params to send to IFTTT webhook
    }

    export class RedditCommentChecker {
        private reddit: Reddit;
        private endpoint: string;
        private regex: RegExp;
        private stopOnMatch: boolean;
        private stopOnNotify: boolean;
        private iftttApiKey: string;
        private iftttEvent: string;
        private shouldNotify: (matches: string[]) => boolean;
        private generateIftttValues: (matches: string[]) => IftttWebhookParams;
        private timerHandle: number;

        constructor(createData: RedditCommentCheckerCreateData);

        // Fetches comments from Reddit API and triggers webhook if any match the provided Regular Expression
        async check(): Promise<void>;

        // Runs check() every `intervalInSeconds` seconds until canceled with stopPolling()
        // Interval can be no less than 1 second due to Reddit API rate limit
        // If `stopAfter` is provided, will stop polling after `stopAfter` seconds
        startPolling(intervalInSeconds: number, stopAfter?: number);

        // Cancels running timer and stops polling for comments
        stopPolling(): void;
    }
}