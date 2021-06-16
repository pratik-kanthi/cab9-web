(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('DriverAdjustment', 'api/DriverAdjustments', {
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
            DriverId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Adjustments: {
                type: 'DriverPaymentAdjustment',
                table: {
                    hidden: true
                }
            },
            Type: {
                type: String,
                required: true,
                enum: ['Credit', 'Debit'],
                defaultValue: 'Debit'
            },
            Amount: {
                type: Number,
                binding: function(row) {
                    return "£" + row.Amount.toFixed(2);
                }
            },
            DaysOfWeek: {
                type: Number
            },
            AppliesToBooking: {
                type: Boolean,
                required: false
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
            Reference: {
                type: String,
            },
            Recurring: {
                type: String,
                enum: ['OneOff', 'Recurring', 'Installments'],
                defaultValue: 'OneOff'
            },
            MinimumInstallment: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            AmountType: {
                type: String,
                enum: ['Fixed', 'Percentage'],
                defaultValue: 'Fixed'
            },
            AmountPaid: {
                type: Number,
            },
            Approved: {
                type: Boolean,
                required: true,
            },
            Settled: {
                type: Boolean
            },
            _Tax: {
                type: String,
                calculated: function () {
                    return this.Tax ? this.Tax.Name : ''
                },
                display: 'Tax'
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