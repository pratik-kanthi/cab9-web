(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('CardPaymentProviderDetail', 'api/CardPaymentProviderDetail', {
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
            Token: {
                type: String,
                required: true
            },
            SecretKey: {
                type: String,
                required: true,
                inputType: 'password'
            },
            ProviderUserId: {
                type: String,
                required: true
            },
            Description: {
                type: String,
                textarea: 2,
            },
            Provider: {
                type: String,
                required: true,
                enum: ['None','Stripe','Judopay']
            },
            Type: {
                type: String,
                required: true,
                enum: ['LIVE', 'SANDBOX'] 
            },
            PreauthAmount: {
                type: Number
            },
            IsManualSetup: {
                type: Boolean
            },
            IsActive: {
                type: Boolean
            }
        });
    }
})(angular);