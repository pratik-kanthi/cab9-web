(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('LoyaltyTransaction', '', {
            _id:{
                type: String,
                editable: false,
                hidden: true,
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true,
            },
            BookingId: {
                type: String,
                hidden: true
            },
            LocalId:{
                type: String
            },
            PassengerId:{
                type: Date,
                hidden:true
            },
            Points:{
                type:String,
            },
            TimeStamp:{
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'"
            },
            PointsAtTransaction:{
                type:Number,
                editable: false
            },
            AmountPerPoint:{
                type: Number,
                hidden: true
            }
        });
    }
})(angular);