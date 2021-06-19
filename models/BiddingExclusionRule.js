(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('BiddingExclusionRule', 'api/BiddingExclusionRules', {
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
            BiddingFilterId: {
                type: String
            },
            BiddingFliter: {
                type: 'BiddingFliter'
            },
            AutoAllocationRuleId: {
                type: String
            },
            AutoAllocationRule: {
                type: 'AutoAllocationRule'
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
            CreationTime: {
                type: moment,
                hidden: true
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
            ModificationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);