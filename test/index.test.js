import { RedditCommentChecker } from '../src';
import { jest } from '@jest/globals';

describe('Reddit Comment Checker', () => {
    // This is a temporary test to provide some sort of indication that the code is generally still working.
    // Better tests are needed.
    it('works', async () => {
        const subject = new RedditCommentChecker({
            username: 'karenSmith',
            password: 'hunter2',
            appId: 'q-werTYuiOPas',
            appSecret: 'asd-FGhjK8lZXCvB3Mqw',
            userAgent: 'platform:com.example.app:v1.0.0',
            subreddit: 'funny',
            post: 'i0tgj4',
            regex: /lol/,
            stopOnMatch: true, // NB: Stops on match
            stopOnNotify: false,
            iftttApiKey: 'asSFDidsijd8fsdfsdj',
            iftttEvent: 'doAThing',
            shouldNotify: undefined,
            generateIftttValues: () => ({ value1: 'one', value2: 'two', value3: 'bucklemyshoe' })
        });

        const iftttSpy = jest.spyOn(subject.iftttClient, 'sendNotification').mockReturnValue();
        const redditSpy = jest.spyOn(subject.redditClient, 'get').mockReturnValue({
            data: {
                children: [
                    { data: { body: 'oh no' } }
                ],
            }
        });

        // Polls every 2 seconds, gives up after 7
        subject.startPolling(2, 10);

        // After 3 seconds, changes to contain lol
        setTimeout(() => {
            redditSpy.mockReturnValue({
                data: {
                    children: [
                        { data: { body: 'oh no' } },
                        { data: { body: 'lol wut' } }
                    ],
                }
            });
        }, 3000);

        // Wait >3 seconds
        await new Promise((res) => setTimeout(res, 3002));

        // Should have checked Reddit and not notified
        expect(iftttSpy).toHaveBeenCalledTimes(0);
        expect(redditSpy).toHaveBeenCalledTimes(1);

        // Wait >4 more seconds (now total of >7 seconds)
        await new Promise((res) => setTimeout(res, 4002));

        // Should notified once and stopped polling after the 2nd poll
        expect(iftttSpy).toHaveBeenCalledTimes(1);
        expect(iftttSpy).toHaveBeenLastCalledWith('doAThing', 'asSFDidsijd8fsdfsdj', { value1: 'one', value2: 'two', value3: 'bucklemyshoe' });
        expect(redditSpy).toHaveBeenCalledTimes(2);
    }, 10000);
});