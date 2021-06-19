(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('InvoiceDetail', 'api/InvoiceDetails', {
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
                display: 'Invoice'
            },
            Invoice: {
                type: 'Invoice',
                ref: 'Invoice',
                refBy: 'InvoiceId'
            },
            ItemName: {
                type: String,
                display: 'Item'
            },
            ItemDescription: {
                type: String,
                display: 'Description'
            },
            Quantity: {
                type: Number,
                display: 'Quantity'
            },
            UnitPrice: {
                type: Number,
                display: 'Price'
            },
            Discount: {
                type: Number,
                display: 'Discount'
            },
            TaxId: {
                type: String,
                display: 'Tax'
            },
            Tax: {
                type: 'Tax',
                ref: 'Tax',
                refBy: 'TaxId'
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