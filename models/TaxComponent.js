(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('TaxComponent', 'api/TaxComponents', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                table: {
                    visible: false
                },
                display: 'Component'
            },
            TaxId: {
                type: String,
                display: 'Tax',
                displayField: 'Tax.Name',
                table: {
                    hidden: true
                }
            },
            Tax: {
                type: 'Tax',
                ref: 'Tax',
                refBy: 'TaxId',
                table: {
                    hidden: true
                }
            },
            Rate: {
                type: Number
            },
            Description: {
                type: String,
                table: {
                    visible: false
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