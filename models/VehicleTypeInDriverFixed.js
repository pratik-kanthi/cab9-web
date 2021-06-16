(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('VehicleTypeInDriverFixed', 'api/VehicleTypeInDriverFixeds', {
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
            PaymentFixedId: {
                type: String
            },
            PaymentFixed: {
                type: 'DriverPaymentModelFixed'
            },
            VehicleTypeId: {
                type: String
            },
            VehicleType: {
                type: 'VehicleType'
            },
            FixedPayment: {
                type: Number,
                currency: true
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