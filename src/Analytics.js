/**
 *
 * @version 2023-04-09
 * @author Patrik Harag
 */
export class Analytics {

    static EVENT_NAME = 'app_turtle_js';
    static FEATURE_APP_INITIALIZED = 'initialized';
    static FEATURE_EDITOR = 'editor';
    static FEATURE_SHOW_LOG = 'show_log';
    static FEATURE_EXPORT_SVG = 'export_svg';
    static FEATURE_SWITCH_EXAMPLE = 'switch_example';
    static FEATURE_PUBLISH = 'publish';

    static #USED_FEATURES = new Set();

    static triggerFeatureUsed(feature) {
        if (!Analytics.#USED_FEATURES.has(feature)) {
            // report only the first usage
            Analytics.#USED_FEATURES.add(feature);
            Analytics.#report({
                'app_turtle_js_feature': feature
            });
        }
    }

    static #report(properties) {
        if (typeof gtag === 'function') {
            gtag('event', Analytics.EVENT_NAME, properties);
        }
        // console.log('event: ' + Analytics.EVENT_NAME + ' = ' + JSON.stringify(properties));
    }
}
