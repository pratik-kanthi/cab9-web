(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('GoogleMapsConfig', 'api/GoogleMapDetails', {
            Id: {
                type: String,
                editable: false,
                required: true
            },
            TenantId: {
                type: String,
                editable: false,
                required: true
            },
            AndroidKey: {
                type: String,
                required: true
            },
            ServerKey: {
                type: String,
                required: true
            },
            BrowserKey: {
                type: String,
                required: true
            },
            iOSKey: {
                type: String,
                required: true
            }
        });
    }
})(angular);