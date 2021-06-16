(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('AppConfig', 'api/AppConfigs', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId:
            {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String
            },
            EncodedPath: {
                type: String
            },  
            DriverMinETA: {
                type: Number,
                display: 'Minimum ETA (mins)'
            },        
            DriverETACap: {
                type: Number,
                display: 'ETA Cap (mins)'
            },
            DriverETAUnavailable: {
                type: Number,
                display: 'ETA Unavailable (mins)'
            },
            MaximumDistance: {
                type: String,
                display: 'Maximum Zone Distance (Acceptable)'
            },
            VisibleDriverSetting: {
                type: String,
                enum: ['All','Available','None'],
                display: 'Visible Driver Setting',
                defaultValue: 'All'
            },
            LeadTime: {
                type: Number,
                display: 'Lead Time (mins)'
            },
            TimeMultiplier: {
                type: Number,
                display: 'Zone Time Multiplier'
            }
        });
    }
})(angular);