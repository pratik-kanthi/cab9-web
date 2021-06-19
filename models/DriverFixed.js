(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('DriverPaymentModelFixed', 'api/DriverPaymentModelFixeds', {
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
            DriverPaymentModelId: {
                type: String,
                hidden: true
            },
            DriverPaymentModel: {
                type: 'DriverPaymentModel',
                editable: false,
                hidden: true
            },
            VehicleTypes: {
                type: ['VehicleTypeInDriverPaymentFixed']
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