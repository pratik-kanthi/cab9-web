(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('CompanyBiddingConfig', 'api/CompanyBiddingConfigs', {
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
            EnableBidding: {
                type: Boolean,
                defaultValue: true
            },
            EnableAuctionBidding: {
                type: Boolean,
                defaultValue: false
            }
        });
    }
})(angular);