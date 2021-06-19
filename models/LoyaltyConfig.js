(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('LoyaltyConfig', '', {
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Description: {
                type: String
            },
            AmountPerPoint:{
                type: String,
                currency:true
            },
            Enabled:{
                type: Boolean
            },
            ThresholdType:{
                type: String,
                enum: ["Percentage", "Fare"]
            },
            ThresholdValue:{
                type: Number
            },
            Web:{
                type: Boolean
            },            
            App:{
                type: Boolean
            },
            IVR:{
                type: Boolean
            },
            Cash:{
                type: Boolean
            },
            Card:{
                type: Boolean
            },
            
        });
    }
})(angular);