(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];
    var currencyIcon = '£';

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('CreditNote', 'api/CreditNotes', {
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
            Reference: {
                type: String
            },
            _Client: {
                type: String,
                calculated: function () {
                    return this.Client ? '(' + this.Client.AccountNo + ')' + this.Client.Name : '';
                },
                display: 'Client'
            },
            Description: {
                type: String,
                required: true
            },
            TaxDate: {
                type: moment,
                required: true
            },
            Amount: {
                type: Number,
                required: true,
                binding: function (item) {
                    return item.Amount.toFixed(2);
                },
                displayFilters: " | currency"
            },
            ClientId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Client: {
                type: 'Client',
                table: {
                    hidden: true
                }
            },
            InvoiceId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Invoice: {
                type: 'Invoice',
                table: {
                    hidden: true
                }
            },
            Status: {
                type: String,
                enum: ['Unsent', 'Sent', 'Paid']
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
            TaxId: {
                type: String,
                display: 'Tax',
                hidden: true
            },
            Tax: {
                type: 'Tax',
                hidden: true,
                required: true
            }
        });
    }
})(angular);