(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('LoyaltyAccount', '', {
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Active: {
                type: Boolean
            },
            Created:{
                type: Date
            },
            ActivePoints:{
                type:Number,
                editable: false
            },
            TotalPointsCollected:{
                type:Number,
                editable: false
            },
            TotalPointsUsed:{
                type:Number,
                editable: false
            }
        });
    }
})(angular);