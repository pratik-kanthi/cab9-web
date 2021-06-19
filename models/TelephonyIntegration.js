(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('TelephonyIntegration', 'api/TelephonyIntegrations', {
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
            BookingStatus: {
                type: String,
                enum: ['Aircall']
            },
            Endpoint: {
                type: String,
            },
            AuthDetails1: {
                type: String,
            },
            AuthDetails2: {
                type: String,
            },
            AuthDetails3: {
                type: String,
            },
            CreationTime: {
                type: moment,
                hidden: true
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