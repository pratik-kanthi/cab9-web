(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('BookingRequirement', 'api/bookingrequirements', {
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
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            },
            Bookings: {
                type: ['Booking'],
                ref: 'Booking',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            OTCode: {
                type: String,
                hidden: true
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