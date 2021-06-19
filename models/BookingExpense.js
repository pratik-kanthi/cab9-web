(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('BookingExpense', 'api/BookingExpenses', {
            Id: {
                type: String
            },
            TenantId: {
                type: String
            },
            BookingId: {
                type: String
            },
            Booking: {
                type: 'Booking'
            },
            BookingExpenseTypeId: {
                type: String,
                required: true,
                display: 'Expense Type'
            },
            BookingExpenseType: {
                type: 'BookingExpenseType'
            },
            Note: {
                type: String,
                textarea: 3
            },
            Amount: {
                type: Number,
                required: true
            },
            DriverAmount: {
                type: Number
            },
            TaxId: {
                type: String,
                required: true,
                display: 'Tax'
            },
            Tax: {
                type: 'Tax'
            },
            Approved: {
                type: Boolean,
                display: 'Approved?',
                defaultValue: true
            },
            PayToDriver: {
                type: Boolean,
                display: 'Reimburse Driver?',
                defaultValue: true
            }
        });

        ModelProvider.registerSchema('BookingExpenseType', 'api/BookingExpenseTypes', {
            Id: {
                type: String
            },
            TenantId: {
                type: String
            },
            Name: {
                type: String
            },
            AvailableToDriver: {
                type: Boolean
            },
            TaxId: {
                type: String,
                required: true,
                display: 'Tax'
            },
            Tax: {
                type: 'Tax',
                table: {
                    hidden: true
                }
            },
            _Tax: {
                type: String,
                calculated: function () {
                    return this.Tax ? this.Tax.Name : '-'
                },
                display: 'Tax'
            },
            Description: {
                type: String,
                textarea: 3
            }
        });
    }
}(angular));