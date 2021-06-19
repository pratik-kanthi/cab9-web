(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('MaskedNumberProviderDetail', 'api/maskedNumberProviderDetails', {
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
            AccountSID: {
                type: String
            },
            AuthToken: {
                type: String,
                inputType: 'password'
            },
            ServiceSID: {
                type: String,
            },
            PhoneNumber: {
                type: String,
            },
            PhoneNumberSID: {
                type: String,
            }
        });
    }
})(angular);