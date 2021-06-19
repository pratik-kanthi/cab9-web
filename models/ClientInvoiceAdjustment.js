(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('ClientInvoiceAdjustment', 'api/ClientInvoiceAdjustments', {
            Id: {
                type: String,
                editable: false,
                required: true,
                validators: [],
                table: {
                    visible: false
                }
            },
            BookingId: {
                type: String,
            },
            InvoiceId: {
                type: String,
                required: true,
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
            ClientAdjustmentId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            ClientAdjustment: {
                type: 'ClientAdjustment',
                table: {
                    hidden: true
                }
            },
            ClientPricingModelAdjustmentId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            ClientPricingModelAdjustment: {
                type: 'ClientPricingModelAdjustment',
                table: {
                    hidden: true
                }
            },
            Amount: {
                type: Number,
                table: {
                }
            },
            TaxAmount: {
                type: Number,
                table: {
                }
            },
            Type: {
                type: String,
                table: {
                }
            },
        });
    }
})(angular);