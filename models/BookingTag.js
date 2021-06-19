(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('BookingTag', 'api/BookingTags', {
            Id: {
                type: String
            },
            BookingId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Booking: {
                type: 'Booking',
                ref: 'Booking',
                refBy: 'BookingId',
                table: {
                    hidden: true
                }
            },
            TagId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Tag: {
                type: 'Tag',
                ref: 'Tag',
                refBy: 'TagId',
                table: {
                    hidden: true
                }
            },
            Type: {
                type: String,
                enum: ['Mandatory', 'Preferred']
            }
        });
    }
}(angular));