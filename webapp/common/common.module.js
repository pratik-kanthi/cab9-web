(function (window, angular) {
    var app = angular.module('cab9.common', [
        "ngMessages",
        "ngAnimate",
        "ngtweet",
        'ngLocale', //DefaultLocale
        "ui.router",
        "ui.router.tabs",
        "ui.bootstrap",
        "ui.select",
        "ui.sortable",
        "ui-notification",
        "angular.filter",
        "angular-flot",
        "uiGmapgoogle-maps",
        "google.places",
        "tmh.dynamicLocale",
        "timer",
        "gavruk.card",
        //"framework.services.auth",
        "framework.services.auth.persist",
        "framework.services.menu",
        "framework.services.data",
        "framework.services.logging",
        "framework.services.storage",
        "framework.services.images",
        "framework.services.csv",
        "framework.services.google",
        "framework.services.signalr",
        "framework.directives.utils",
        "framework.directives.UI",
        "framework.services.currency",
        "framework.filters.utility",
        "framework.UI.structure",
        "framework.UI.breadcrumb",
        "framework.UI.module",
        "framework.UI",
        "framework.module.documents",
        "cab9.models",
        "cab9.reports",
        "cab9.layout",
        "cab9.widgets",
//        "cab9.permissions"
    ]);

    app.constant('$tenantConfig', {
        defaultVehicleType: '80e4cd2c-411e-41e0-9939-679ef65797cc',
        defaultVehicleClass: '80e4cd2c-411e-41e0-9939-679ef65797cc',
        officeLocation: {
            latitude: 51.471507,
            longitude: -0.487904
        }
    });

    window.$config = {
        API_ENDPOINT: window.endpoint,
        SIGNALR_ENDPOINT: window.signalREndpoint,
        RESOURCE_ENDPOINT: window.resourceEndpoint,
        WEBBOOKER_ENDPOINT: window.webbookerEndpoint,
        VERSION: window.version,
        GMAPS_STATIC_URL: 'https://maps.googleapis.com/maps/api/staticmap?size=249x249&style=feature:landscape|visibility:off&style=feature:poi|visibility:off&style=feature:transit|visibility:off&style=feature:road.highway|element:geometry|lightness:39&style=feature:road.local|element:geometry|gamma:1.45&style=feature:road|element:labels|gamma:1.22&style=feature:administrative|visibility:off&style=feature:administrative.locality|visibility:on&style=feature:landscape.natural|visibility:on&scale=2',
        LOGIN_URL: '/index.html',
        DEFAULT_LOCALE: 'en-gb',
        GMAPS_STYLE: [{
            "featureType": "landscape",
            "stylers": [{
                "hue": "#FFBB00"
            }, {
                "saturation": 43.400000000000006
            }, {
                "lightness": 37.599999999999994
            }, {
                "gamma": 1
            }]
        }, {
            "featureType": "road.highway",
            "stylers": [{
                "hue": "#FFC200"
            }, {
                "saturation": -61.8
            }, {
                "lightness": 45.599999999999994
            }, {
                "gamma": 1
            }]
        }, {
            "featureType": "road.arterial",
            "stylers": [{
                "hue": "#FF0300"
            }, {
                "saturation": -100
            }, {
                "lightness": 51.19999999999999
            }, {
                "gamma": 1
            }]
        }, {
            "featureType": "road.local",
            "stylers": [{
                "hue": "#FF0300"
            }, {
                "saturation": -100
            }, {
                "lightness": 52
            }, {
                "gamma": 1
            }]
        }, {
            "featureType": "water",
            "stylers": [{
                "hue": "#0078FF"
            }, {
                "saturation": -13.200000000000003
            }, {
                "lightness": 2.4000000000000057
            }, {
                "gamma": 1
            }]
        }, {
            "featureType": "poi",
            "stylers": [{
                "hue": "#00FF6A"
            }, {
                "saturation": -1.0989010989011234
            }, {
                "lightness": 11.200000000000017
            }, {
                "gamma": 1
            }]
        }]
    };
    app.run(moduleRun);
    moduleRun.$inject = ['$rootScope'];
    function moduleRun($rootScope) {
        $rootScope.reportFilters = {
            from: moment().startOf('isoweek').toISOString(),
            to: moment().endOf('isoweek').toISOString()
        };
    }

    app.config(moduleConfig);
    moduleConfig.$inject = ['$httpProvider'];
    function moduleConfig($httpProvider) {
        $httpProvider.interceptors.push('TemplateCacheBuster');
    }

    app.constant('$config', window.$config);

    app.constant('$utilities', window.$utilities);

    app.constant('LookupCache', {

    });

    app.constant('ViewerCache', {

    });

    app.factory('TemplateCacheBuster', ['$config', '$templateCache', function ($config, $templateCache) {
        return {
            request: function (config) {
                if (config && config.url && config.url.indexOf('.html') >= 0) {
                    if ($templateCache.get(config.url)) {
                        return config;
                    } else if (config.url.indexOf('?') == -1) {
                        config.url += "?ver=" + $config.VERSION;
                    } else {
                        config.url += "&ver=" + $config.VERSION;
                    }
                }
                return config;
            }
        };
    }])



})(window, angular)