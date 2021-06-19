(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('DriverPaymentModel', 'api/DriverPaymentModels', {
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
            Type: {
                type: String,
                enum: ['Commission', 'Mileage']
            },
           
            CompanyCarCommision: {
                type: Number,
                min: -100,
                max: 100,
                display: 'Company Car Commission'
            },
            CompanyCarPerHour: {
                type: Number
            },
            CompanyCarPerBooking: {
                type: Number
            },
            CompanyCarPerMileSteps: {
                type: String
            },
            OwnCarCommision: {
                type: Number,
                min: -100,
                max: 100,
                display: 'Own Car Commission'
            },
            OwnCarPerHour: {
                type: Number
            },
            OwnCarPerBooking: {
                type: Number
            },
            OwnCarPerMileSteps: {
                type: String
            },
            WaitingPerHour: {
                type: Number
            },
            ChauffeurCommision: {
                type: Number,
                min: 0,
                max: 100,
                display: 'Chauffeuring Commission'
            },
            ChauffeurPerHour: {
                type: Number,
                min: 0,
                max: 100,
                display: 'Chauffeuring Per Hour'
            },
            CoaPricingAmount: {
                type: Number,
                defaultValue: 1
            },
            CoaPricingType: {
                type: String,
                defaultValue: 'FixedMileage',
                enum: ['FixedAmount', 'FixedMileage']
            },
            BonusParameters: {
                type: String
            },
            Overrides: {
                type: ['DriverPaymentModelOverride'],
                ref: 'DriverPaymentModelOverride',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
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
            PeakDateBands: {
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