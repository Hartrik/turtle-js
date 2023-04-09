import { Context } from "./Context.js";

/**
 *
 * @author Patrik Harag
 * @version 2023-04-09
 */
export class ServerApi {

    static getImageUrl(id) {
        let url = window.location.href;

        let hashPos = url.indexOf('#');
        if (hashPos >= 0) {
            url = url.substring(0, hashPos);
        }

        if (url.endsWith('/')) {
            url = url.substring(0, url.length - 1);
        }

        return url + '/image/' + id;
    }

    /**
     *
     * @param context {Context}
     * @param code {string}
     * @returns {Promise}
     */
    static postImage(context, code) {
        let dataToSend = {};
        dataToSend[context.csrfParameterName] = context.csrfToken;
        dataToSend['code'] = code;

        let url = '/app/turtle/data/images';

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
    static getImages(context) {
        let url = '/app/turtle/data/images';

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
     * @returns {Promise}
     */
    static getImage(context, id) {
        let url = '/app/turtle/data/images/' + id;

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
     * @param code {string|null}
     * @param verified {boolean|null}
     * @returns {Promise}
     */
    static updateImage(context, id, code = null, verified = null) {
        let dataToSend = {};
        dataToSend[context.csrfParameterName] = context.csrfToken;
        if (code !== null) {
            dataToSend['code'] = code;
        }
        if (verified !== null) {
            dataToSend['verified'] = verified;
        }

        let url = '/app/turtle/data/images/' + id;

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
    static deleteImage(context, id) {
        let url = '/app/turtle/data/images/' + id
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
