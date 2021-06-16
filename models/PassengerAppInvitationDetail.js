(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('PassengerAppInvitationDetail', 'api/PassengerAppInvitationDetails', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String
            },
            ClientId:{
                type: String
            },
            PassengerId: {
                type: String
            },
            Firstname: {
                type: String
            },
            Surname: {
                type: String
            },
            Email: {
                type: String
            },
            IsSuccess: {
                type: Boolean
            },
            UpdateTime: {
                type: moment,
                display: 'Modification Time',
            },
            Description: {
                type: String
            }
        });
    }
})(angular);