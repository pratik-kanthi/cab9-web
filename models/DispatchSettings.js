(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('DispatchSettings', 'api/DispatchSettings', {
            Id: {
                type: String
            },
            TenantId: {
                type: String
            },
            Active: {
                type: Boolean
            },
            Mode: {
                type: String,
                enum: ['Recommend', 'Auto']
            },
            TargetTime: {
                type: Number,
                required: true
            },
            AcceptableTime: {
                type: Number,
                required: true
            },
            MaximumTime: {
                type: Number,
                required: true
            },
            UseGoogleMatrix: {
                type: Boolean
            },
            TimeWeighting: {
                type: Number,
                required: true
            },
            TimeBase: {
                type: Number,
                required: true
            },
            TimeCap: {
                type: Number,
                required: true
            },
            GreenWeighting: {
                type: Number,
                required: true
            },
            GreenBase: {
                type: Number,
                required: true
            },
            GreenCap: {
                type: Number,
                required: true
            },
            FairnessWeighting: {
                type: Number,
                required: true
            },
            FairnessBase: {
                type: Number,
                required: true
            },
            FairnessCap: {
                type: Number,
                required: true
            },
            RatingWeighting: {
                type: Number,
                required: true
            },
            RatingBase: {
                type: Number,
                required: true
            },
            RatingCap: {
                type: Number,
                required: true
            },
            EmptyWeighting: {
                type: Number,
                required: true
            },
            EmptyBase: {
                type: Number,
                required: true
            },
            EmptyCap: {
                type: Number,
                required: true
            },
            LookForwardMinutes: {
                type: Number,
                required: true
            },
            Frequency: {
                type: Number,
                required: true
            },
            DispatchTimeCap: {
                type: Number,
            },
            OverrideMode: {
                type: String,
                required: true,
                enum: ['WeightedAverage', 'HighestPriority']
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

        ModelProvider.registerSchema('DispatchOverrides', 'api/DispatchOverrides', {
            Id: {
                type: String
            },
            TenantId: {
                type: String
            },
            ClientId: {
                type: String
            },
            Client: {
                type: 'Client'
            },
            ZoneId: {
                type: String
            },
            Zone: {
                type: 'Zone'
            },
            IsRank: {
                type: Boolean
            },
            DaysOfWeek: {
                type: Number
            },
            StartTime: {
                type: Number
            },
            EndTime: {
                type: Number
            },
            $timespan: {
                type: String,
                calculated: function () {
                    if ((this.StartTime == 0 || this.StartTime) && this.EndTime) {
                        var start = moment.utc().startOf('day').add(this.StartTime, 'minutes');
                        var end = moment.utc().startOf('day').add(this.EndTime, 'minutes');
                        return start.format('HH:mm') + ' - ' + (this.EndTime == 1440 ? '24:00' : end.format('HH:mm'));
                    } else {
                        return '';
                    }
                }
            },
            $startTime: {
                type: moment,
                inputType: 'time',
                display: 'Start Time',
                timezone: true
            },
            $endTime: {
                type: moment,
                inputType: 'time',
                display: 'End Time',
                timezone: true
            },
            PaymentType: {
                type: String,
                enum: ['All', 'Cash', 'Card', 'OnAccount']
            },
            TimeWeighting: {
                type: Number,
                required: true
            },
            GreenWeighting: {
                type: Number,
                required: true
            },
            FairnessWeighting: {
                type: Number,
                required: true
            },
            RatingWeighting: {
                type: Number,
                required: true
            },
            EmptyWeighting: {
                type: Number,
                required: true
            },
            LookForwardMinutes: {
                type: Number,
                required: true
            },
            Strength: {
                type: Number,
                required: true
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