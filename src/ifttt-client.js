import axios from 'axios';

export class IftttClient {
    sendNotification(event, apiKey, params = {}) {
        let queryParamsString = Object.getOwnPropertyNames(params).filter(key => params[key]).map(key => `${key}=${params[key]}`).join('&');
        queryParamsString = queryParamsString && `?${queryParamsString}`;

        return axios.get(`https://maker.ifttt.com/trigger/${event}/with/key/${apiKey}${queryParamsString}`);
    }
}
