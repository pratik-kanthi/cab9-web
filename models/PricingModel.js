(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('PricingModel', 'api/pricingmodels', {
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
            StandingCharge: {
                type: Number,
                display: 'Standing Charge',
                currency: true
            },
            ExtraStopCharge: {
                type: Number,
                display: 'Extra Stop Charge',
                currency: true
            },
            MinimumCharge: {
                type: Number,
                display: 'Minimum Charge',
                currency: true
            },
            WaitTimeCharge: {
                type: Number,
                display: 'Waiting Charge/Min',
                currency: true
            },
            FarePerMile: {
                type: Number,
                display: "{{(COMPANY.UseMetric == 1)?'Price Per Km':'Price Per Mile'}}",
                currency: true
            },
           Zones: {
                type: ['ZoneInPricingModel'],
                defaultValue: []
            },
            PricingFixeds: {
                type: ['PricingFixed'],
                defaultValue: []
            },
            VehicleTypePricings: {
                type: ['PricingModelVehicleTypePricing'],
                defaultValue: []
            },
            PricePerHour: {
                type: Number,
                display: "Price Per Hour",
                currency: true
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
            FarePreference: {
                type: String,
                enum: ['Zone', 'VehicleType'],
                defaultValue: 'VehicleType'
            },
            StepsMode: {
                type: String,
                display: 'Mileage Steps Mode',
                enum: ['Precise', 'Cumulative', 'Fixed'],
                defaultValue: 'Precise'
            },
            RoundMileageTo: {
                type: Number,
                min: 0.01,
                max: 1,
                step: 0.05,
                display: "Round Mileage To"
            },
            RoundMileageMode: {
                type: String,
                enum: ['Nearest', 'Up', 'Down'],
                defaultValue: 'Nearest'
            },
            RoundTo: {
                type: Number,
                min: 0.01,
                max: 1,
                step: 0.10,
                display: "Round Fare To"
            },
            RoundMode: {
                type: String,
                enum: ['Nearest', 'Up', 'Down'],
                defaultValue: 'Nearest'
            },
            FarePerMileSteps: {
                type: String
            },
            PeakTimeBands: {
                type: String
            },
            PeakDateBands: {
                type: String
            },
            FreeWaitingTime: {
                type: Number
            },
            FreeWaitingTimeAirport: {
                type: Number
            },
            IsWaitingTimeGrace: {
                type: Boolean
            },
            IsWaitingTimeGraceAirport: {
                type: Boolean
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
            CancellationRuleId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            CancellationRule: {
                type: 'CancellationRule',
                ref: 'CancellationRule',
                refBy: 'CancellationRuleId',
                table: {
                    hidden: true
                }
            },
            $previous: {
                type: String
            },
        });
    }
})(angular);
