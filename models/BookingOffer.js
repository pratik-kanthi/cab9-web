(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('BookingOffer', 'api/BookingOffers', {
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
                type: String
            },
            DriverId: {
                type: String
            },
            Expires: {
                type: moment
            },
            ReadTime: {
                type: moment
            },
            ResponseTime: {
                type: moment
            },
            Accepted: {
                type: Boolean
            },
            RejectReason: {
                type: String
            },
            Attempts: {
                type: Number
            },
            Status: {
                type: String,
                enum: ['Sent', 'Received', 'Read', 'Accepted', 'Rejected']
            },
            CreationTime: {
                type: moment,
                display: 'Creation Time',
                table: {
                    hidden: true
                }
            },
            ModificationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            CreationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            ModificationTime: {
                type: moment,
                display: 'Modification Time',
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);