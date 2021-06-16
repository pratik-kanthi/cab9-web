(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('BillPayment', 'api/BillPayments', {
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
            BillId: {
                type: String,
                displayField: 'Bill.Reference',
                table: {
                    hidden: true
                },
                display: 'Invoice'
            },
            Bill: {
                type: 'Bill',
                ref: 'Bill',
                refBy: 'BillId',
                table: {
                    hidden: true
                }
            },
            Amount: {
                type: Number,
                display: 'Amount Paid',
                binding: function(item) {
                    return currencyIcon + item.Amount.toFixed(2);
                }
            },
            Reference: {
                type: String
            },
            PaymentType: {
                type: String,
                enum: ['Cheque', 'Cash', 'BankTransfer', 'CardPayment', 'Other']
            },
            PaymentDate: {
                type: moment,
                display: 'Payment Date',
                required: true,
                displayFilters: " | companyDate:'DD/MM/YYYY'"
            },
            CreationTime: {
                type: moment,
                display: 'Creation Date',
                displayFilters: " | companyDate:'DD/MM/YYYY'"
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