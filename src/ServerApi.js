import { Context } from "./Context.js";

/**
 *
 * @author Patrik Harag
 * @version 2022-03-12
 */
export class ServerApi {

    /**
     *
     * @param context {Context}
     * @param code {string}
     * @returns {Promise}
     */
    static postGift(context, code) {
        let dataToSend = {};
        dataToSend[context.csrfParameterName] = context.csrfToken;
        dataToSend['code'] = code;

        let url = '/app/turtle/data/gifts';

        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: JSON.stringify(dataToSend),
                contentType: 'application/json',
                dataType: 'json',
                success: resolve,
                error: reject
            });
        });
    }

    /**
     *
     * @param context {Context}
     * @returns {Promise}
     */
    static fetchExamples(context) {
        let url = '/app/turtle/data/examples';

        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'GET',
                contentType: 'application/json',
                dataType: 'json',
                success: resolve,
                error: reject
            });
        });
    }

    /**
     *
     * @param context {Context}
     * @param id {string}
     * @param code {string}
     * @returns {Promise}
     */
    static updateExample(context, id, code) {
        let dataToSend = {};
        dataToSend[context.csrfParameterName] = context.csrfToken;
        dataToSend['code'] = code;

        let url = '/app/turtle/data/examples/' + id;

        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'PUT',
                data: JSON.stringify(dataToSend),
                contentType: 'application/json',
                dataType: 'json',
                success: resolve,
                error: reject
            });
        });
    }

    /**
     *
     * @param context {Context}
     * @param id {string}
     * @returns {Promise}
     */
    static deleteExample(context, id) {
        let url = '/app/turtle/data/examples/' + id
            + '?' + encodeURIComponent(context.csrfParameterName) + '=' + encodeURIComponent(context.csrfToken);

        // note: it just does not work with data parameter

        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'DELETE',
                success: resolve,
                error: reject
            });
        });
    }
}
