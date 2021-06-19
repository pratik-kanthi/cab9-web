(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('ClientAdjustment', 'api/ClientAdjustments', {
            Id: {
                type: String,
                editable: false,
                required: true,
                validators: [],
                table: {
                    visible: false
                }
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            ClientId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Type: {
                type: String,
                required: true,
                enum: ['Credit', 'Debit']
            },
            Amount: {
                type: Number,
                required: true,
            },
            DaysOfWeek: {
                type: Number
            },
            _StartTime: {
                type: String,
                calculated: function () {
                    return parseIntToTime(this.StartTime)
                },
                display: 'Start Time'
            },
            _EndTime: {
                type: String,
                calculated: function () {
                    return parseIntToTime(this.EndTime)
                },
                display: 'End Time'
            },
            StartTime: {
                type: Number,
                table :{
                    hidden: true
                }
            },
            EndTime: {
                type: Number,
                table :{
                    hidden: true
                }
            },
            VehicleTypes: {
                type: String,
                table :{
                    hidden: true
                }
            },
            AmountType: {
                type: String,
                required: true,
                enum: ['Fixed', 'Percentage'],
                defaultValue: 'Fixed'
            },
            AmountPaid: {
                type: Number
            },
            Reference: {
                type: String,
            },
            Active: {
                display: 'Active',
                defaultValue: true,
                type: Boolean,
            },
            Settled: {
                type: Boolean,
                required: false,
            },
            AppliesToBooking: {
                type: Boolean,
                required: false,
            },
            Recurring: {
                type: String,
                enum: ['OneOff', 'Recurring'],
                required: true,
                defaultValue: 'OneOff'
            },
            _Tax: {
                type: String,
                calculated: function () {
                    return this.Tax ? this.Tax.Name : ''
                },
                display: 'Tax'
            },
            ActivateByCode: {
                type: String
            },
            TaxId: {
                type: String,
                required: true,
                displayField: 'Tax.Name',
                display: 'Tax',
                table: {
                    hidden: true
                }
            },
            Tax: {
                type: 'Tax',
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
            ModificationTime: {
                type: moment,
                display: 'Modification Time',
                table: {
                    hidden: true
                }
            }
        });

        function parseIntToTime(minutes) {
            if (minutes) {
                if (typeof minutes == "number") {
                    var hour = (Math.floor(minutes / 60) < 10) ? "0" + Math.floor(minutes / 60) : Math.floor(minutes / 60);
                    var minutes = ((minutes % 60) < 10) ? "0" + (minutes % 60) : (minutes % 60);
                    return hour + ":" + minutes;
                } else {
                    throw {
                        "message": "Time is not in correct format. Please check your input and try again."
                    }
                }
            } else {
                return null;
            }
        }
    }
})(angular);