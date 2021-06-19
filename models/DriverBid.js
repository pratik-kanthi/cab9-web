(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('DriverBid', 'api/DriverBids', {
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
            BookingId: {
                type: String,
            },
            Booking: {
                type: 'Booking',
            },
            DriverId: {
                type: String,
            },
            Driver: {
                type: 'Driver',
            },
            Response: {
                type: String,
                enum: ['Dismissed', 'Bid']
            },
            Amount: {
                type: Number
            },
            OpenedDateTime: {
                type: moment
            },
            ResponseDateTime: {
                type: moment
            }
        });
    }
})(angular);