(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('CompanyPaymentSettings', 'api/companypaymentsettings', {
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
            CommissionTaxId: {
                type: String,
                display: 'Commission Tax',
            },
            CommissionTax: {
                type: 'Tax'
            },
            InclusiveVAT: {
                type: Boolean
            },
            AccountAgent: {
                type: Boolean
            },
            CardAgent: {
                type: Boolean
            },
            CashAgent: {
                type: Boolean
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