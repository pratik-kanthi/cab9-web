(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('FlagDownConfiguration', 'api/FlagDownConfigurations', {
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
            FlagDown: {
                type: Boolean,
                defaultValue: false
            },
            ClientId: {
                type: String,
                required: false,
                displayField: 'Client.Name',
                table: {
                    hidden: true
                }
            },
            Client: {
                type: 'Client',
                ref: 'Client',
                refBy: 'ClientId',
                table: {
                    hidden: true
                }
            },
            ClientStaffId: {
                type: String,
                required: false,
                displayField: 'ClientStaff._Fullname',
                table: {
                    hidden: true
                }
            },
            ClientStaff: {
                type: 'ClientStaff',
                ref: 'ClientStaff',
                refBy: 'ClientStaffId',
                table: {
                    hidden: true
                }
            },
            PassengerId: {
                type: String,
                required: false,
                displayField: 'Passenger._Fullname',
                table: {
                    hidden: true
                }
            },
            Passenger: {
                type: 'Passenger',
                ref: 'Passenger',
                refBy: 'PassengerId',
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);