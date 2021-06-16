(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('CancellationRule', 'api/CancellationRules', {
            Id: {
                type: String
            },
            TenantId: {
                type: String
            },
            BookingStatus: {
                type: String,
                enum: ['Incoming', 'PreAllocated', 'Allocated', 'OnRoute', 'Arrived']
            },
            MinutesBeforePickup: {
                type: Number
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
            },
        });
    }
}(angular));