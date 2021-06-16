(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('ZoneInPricingModel', 'api/pricingzoneinpricingmodels', {
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
            PricingModelId: {
                type: String
            },
            PricingModel: {
                type: 'PricingModel'
            },
            ZoneId: {
                type: String
            },
            Zone: {
                type: 'Zone'
            },
            EntryCharge: {
                type: Number,
                currency: true
            },
            DropoffCharge: {
                type: Number,
                currency: true
            },
            PickupCharge: {
                type: Number,
                currency: true
            },
            EntryExclusion: {
                type: Number,
                currency: true
            },
            DropoffExclusion: {
                type: Number,
                currency: true
            },
            PickupExclusion: {
                type: Number,
                currency: true
            },
            FarePerMile: {
                type: Number,
                currency: true
            },
            FarePerMileSteps: {
                type: String
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