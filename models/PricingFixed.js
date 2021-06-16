(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('PricingFixed', 'api/pricingfixeds', {
            Id: {
                type: String,
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
            FixedPrice: {
                type: Number,
                prepend: {
                    text: '{{current.Prepend}}'
                }
            },
            AllowVehicleModifiers: {
                type: Boolean
            },
            PricingModelId: {
                type: String
            },
            PricingModel: {
                type: 'PricingModel'
            },
            FromId: {
                type: String
            },
            FromPostcode: {
                type: String
            },
            From: {
                type: 'Zone'
            },
            ToId: {
                type: String
            },
            To: {
                type: 'Zone'
            },
            ToPostcode: {
                type: String
            },
            BothWays: {
                type: Boolean
            },
            VehicleTypes: {
                type: ['VehicleTypeInPricingFixed']
            },
            CreationTime: {
                type: moment
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