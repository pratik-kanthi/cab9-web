(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('ScoreWeighting', 'api/ScoreWeightings', {
            Id: {
                type: String,
                editable: false,
                table: {
                    visible: false
                }
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            WeekWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.5
            },
            MonthWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.3
            },
            YearlyWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.2
            },

            DriverCountWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.3
            },
            DriverValueWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.3
            },
            DriverPassengerWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.2
            },
            DriverAcceptanceWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.1
            },
            DriverShiftWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.1
            },

            ClientCountWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.4
            },
            ClientValueWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.6
            },

            VehicleCountWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.4
            },
            VehicleValueWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.6
            },

            PassengerCountWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.4
            },
            PassengerValueWeighting: {
                type: Number,
                inputType: 'number',
                step: 0.1,
                min: 0,
                max: 1,
                defaultValue: 0.6
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