(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('SmsDetail', 'api/SmsDetails', {
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
            ApiKey: {
                type: String,
                required: true
            },
            ApiSecret: {
                type: String,
                required: true,
                inputType: 'password'
            },
            From: {
                type: String,
                required: true
            },
            Provider: {
                type: String,
                required: false,
                defaultValue: 'nexmo'
            },
            ConfirmationTemplate: {
                type: String,
                required: true,
                textarea: 4
            },
            AssignedTemplate: {
                type: String,
                required: true,
                textarea: 4
            },
            ArrivalTemplate: {
                type: String,
                required: true,
                textarea: 4
            },
            ArrivalScript: {
                type: String,
                required: true,
                textarea: 4
            },
            CompletionTemplate: {
                type: String,
                required: true,
                textarea: 4
            },
            OnRouteTemplate: {
                type: String,
                required: true,
                textarea: 4
            },
            CompletedMessageMinutesAfter: {
                type: Number,
                required: true
            },
        });
    }
})(angular);