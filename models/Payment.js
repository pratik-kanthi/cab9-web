(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];
    var currencyIcon = '£';

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Payment', 'api/Payments', {
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
            InvoiceId: {
                type: String,
                displayField: 'Invoice.Reference',
                table: {
                    hidden: true
                },
                display: 'Invoice'
            },
            TransactionId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Invoice: {
                type: 'Invoice',
                ref: 'Invoice',
                refBy: 'InvoiceId',
                table: {
                    hidden: true
                }
            },
            AmountPaid: {
                type: Number,
                display: 'Amount Paid',
                binding: function(item) {
                    return currencyIcon + item.AmountPaid.toFixed(2);
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