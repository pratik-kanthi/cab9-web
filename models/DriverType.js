(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('DriverType', 'api/drivertypes', {
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
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            },
            DefaultDriverPaymentModelId: {
                type: String,
                displayField: 'DefaultDriverPaymentModel.Name',
                table: {
                    hidden: true
                }
            },
            DefaultDriverPaymentModel: {
                type: 'DriverPaymentModel',
                ref: 'DriverPaymentModel',
                refBy: 'DefaultDriverPaymentModelId',
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
    }
})(angular);