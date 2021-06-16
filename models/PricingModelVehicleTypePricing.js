(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('PricingModelVehicleTypePricing', 'api/PricingModelVehicleTypePricings', {
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
                type: String
            },
            PricingModelId: {
                type: String
            },
            PricingModel: {
                type: 'PricingModel'
            },
            VehicleTypeId: {
                type: String
            },
            VehicleType: {
                type: 'VehicleType'
            },
            AllowChaffuering: {
                type: Boolean
            },
            MinimumCharge: {
                type: Number,
                display: "Minimum Fare",
                currency: true
            },
            StandingCharge: {
                type: Number,
                display: "Standing Charge",
                currency: true
            },
            WaitTimeCharge: {
                type: Number,
                display: "Wait Time Charge",
                currency: true
            },
            ExtraStopCharge: {
                type: Number,
                display: 'Extra Stop Charge',
                currency: true
            },
            PricePerHour: {
                type: Number,
                display: "Price Per Hour",
                currency: true
            },
            FarePerMile: {
                type: Number,
                display: "{{(COMPANY.UseMetric == 1)?'Price Per Km':'Price Per Mile'}}",
                currency: true
            },
            FarePerMileSteps: {
                type: String
            },
            MinMinutes: {
                type: Number,
                display: "Min Minutes",
                nullDisplay: "-"
            },
            IncludedMiles: {
                type: Number,
                display: "{{(COMPANY.UseMetric == 1)?'Included Km':'Included Miles'}}",
                nullDisplay: "-"
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