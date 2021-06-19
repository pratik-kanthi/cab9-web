(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('VehicleTypeInPricingFixed', 'api/VehicleTypeInPricingFixeds', {
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
            PricingFixedId: {
                type: String
            },
            PricingFixed: {
                type: 'PricingFixed'
            },
            VehicleTypeId: {
                type: String
            },
            VehicleType: {
                type: 'PricingFixed'
            },
            FixedPrice: {
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