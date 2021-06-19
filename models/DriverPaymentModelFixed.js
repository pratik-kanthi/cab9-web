(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('DriverFixed', 'api/DriverFixed', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            FromId: {
                type: String
            },
            FromPostcode: {
                type: String
            },
            From: {
                type: 'Zone'
            },
            ToId: {
                type: String
            },
            To: {
                type: 'Zone'
            },
            ToPostcode: {
                type: String
            },
            DriverId: {
                type: String,
                hidden: true
            },
            Driver: {
                type: 'Driver',
                editable: false,
                hidden: true
            },
            VehicleTypes: {
                type: ['VehicleTypeInDriverFixed']
            },
            Amount: {
                type: Number
            },
            AmountType: {
                type: String,
                enum: ['Fixed', 'Percentage']
            },
        });
    }
})(angular);